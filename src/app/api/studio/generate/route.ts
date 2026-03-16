import { streamObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

const googleAI = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    // Add custom fetch options if needed to increase standard fetch timeout
});

// Configure the model instance
const googleModel = googleAI('gemini-3.1-pro-preview');
import { GoogleGenAI } from '@google/genai';
import {
    getProjectContextDeclaration, getProjectContext,
    getProjectAssetsDeclaration, getProjectAssets,
    scrapeWebsiteDeclaration, scrapeWebsite
} from '@/lib/agents/tools';
import { generateV4ReadSignedUrl } from '@/lib/gcp/storage';

const sceneBlockSchema = z.object({
    scenes: z.array(z.object({
        scene_id: z.number(),
        duration: z.number(),
        transition: z.string(),
        music_style: z.string(),
        scene_emotion: z.string(),
        camera_motion: z.string(),
        bpm_suggestion: z.number(),
        voiceover: z.object({
            text: z.string(),
            tone: z.string(),
            pace: z.string()
        }),
        text_overlay: z.object({
            content: z.string(),
            animation: z.string(),
            subtitle_settings: z.object({
                enabled: z.boolean(),
                position: z.enum(['top', 'middle', 'bottom']),
                color: z.enum(['white', 'yellow', 'cyan', 'green'])
            }).optional()
        }),
        visual: z.object({
            base: z.object({
                source: z.enum(['uploaded_asset', 'generate_image', 'generate_video']),
                asset_id: z.string().describe("The exact 20-character alphanumeric ID of the asset. DO NOT USE THE FILENAME.").optional(),
                prompt: z.string().optional(),
                start_time_seconds: z.number().optional(),
                end_time_seconds: z.number().optional()
            }),
            overlay: z.object({
                source: z.enum(['uploaded_asset', 'generate_image', 'none']),
                prompt: z.string().optional()
            }).optional()
        })
    }))
});

const blogSchema = z.object({
    title: z.string(),
    body: z.string(),
    tags: z.array(z.string()),
    description: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const { projectId, prompt, videoEngine, format, targetDuration } = await req.json();
        console.log(`[Generate API] Request received`, { projectId, format, videoEngine, targetDuration });

        if (!projectId) {
            return new Response("Missing projectId", { status: 400 });
        }

        const engine = videoEngine || "image";
        const durationSetting = targetDuration || 30; // Default to 30s

        // ─────────────────────────────────────────────────────────────
        // 1. Core Agent Intelligence Loop (Google ADK + Tools)
        // ─────────────────────────────────────────────────────────────
        
        // Initialize the ADK client
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
        
        const chat = ai.chats.create({
            model: 'gemini-3.1-pro-preview', 
            config: {
                systemInstruction: `You are the Creative Director Researcher for VividLaunch. You compile project briefs so a video storyboard can be generated. 
You have tools to fetch project context, assets, and scrape websites. 
INSTRUCTIONS:
1. Always call get_project_context with the given projectId.
2. Always call get_project_assets with the given projectId.
3. IF the project context includes a websiteUrl, you MUST call scrape_website to extract the landing page copy.
4. After you have gathered all information, output a comprehensive "Creative Brief" containing the parsed details, brand voice, and a list of available assets.`,
                tools: [{
                    functionDeclarations: [
                        getProjectContextDeclaration,
                        getProjectAssetsDeclaration,
                        scrapeWebsiteDeclaration
                    ]
                }]
            }
        });

        // Retry wrapper for ADK calls to handle intermittent network blips
        const withRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
            for (let i = 0; i < retries; i++) {
                try {
                    return await fn();
                } catch (err: any) {
                    if (i === retries - 1) throw err;
                    const isTimeout = err.message?.includes('timeout') || err.code === 'UND_ERR_CONNECT_TIMEOUT';
                    console.warn(`[Agent] ${isTimeout ? 'Timeout' : 'Error'} on attempt ${i + 1}. Retrying in ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2; // Exponential backoff
                }
            }
        };

        const adkInitialPrompt = `Please gather context for projectId: ${projectId}. User prompt: ${prompt || "Generate a high-impact promotional video storyboard."}`;
        let adkResponse = await withRetry(() => chat.sendMessage({ message: adkInitialPrompt }));

        // Autonomous Tool Execution Loop
        let projectScraperSettings: any = null;
        let loopCount = 0;
        while (adkResponse.functionCalls && adkResponse.functionCalls.length > 0 && loopCount < 5) {
            const functionResponses: any[] = [];
            
            for (const call of adkResponse.functionCalls) {
                const name = call.name;
                const args = call.args as any;
                
                console.log(`[Agent] Executing tool: ${name}`, args);
                
                let resultData;
                if (name === 'get_project_context') {
                    resultData = await getProjectContext(args.projectId);
                    projectScraperSettings = resultData.scraperSettings;
                } else if (name === 'get_project_assets') {
                    resultData = await getProjectAssets(args.projectId);
                } else if (name === 'scrape_website') {
                    const finalUrl = (projectScraperSettings?.scope === 'path-only' && projectScraperSettings.path)
                        ? `${args.url}${projectScraperSettings.path.startsWith('/') ? '' : '/'}${projectScraperSettings.path}`
                        : args.url;

                    resultData = await scrapeWebsite(
                        finalUrl,
                        projectScraperSettings?.scope,
                        projectScraperSettings?.depth,
                        projectScraperSettings?.extractImages,
                        projectScraperSettings?.extractTestimonials
                    );
                } else {
                    resultData = { error: 'Unknown function' };
                }
                
                functionResponses.push({
                    functionResponse: {
                        name: name as string,
                        response: resultData
                    }
                });
            }
            
            adkResponse = await withRetry(() => chat.sendMessage({ message: functionResponses }));
            console.log(`[Agent] Tool results sent. Next response type: ${adkResponse.functionCalls ? 'Tool Call' : 'Text'}`);
            loopCount++;
        }

        const creativeBrief = adkResponse.text || "No context gathered.";
        console.log(`[Agent] Compilation complete. Final Brief length: ${creativeBrief.length} chars.`);

        // ─────────────────────────────────────────────────────────────
        // 2. Prepare Media for Gemini Structured Generative Pass
        // ─────────────────────────────────────────────────────────────
        
        const { db, COLLECTIONS } = require('@/lib/gcp/firestore');
        const snapshot = await db.collection(COLLECTIONS.ASSETS).where('projectId', '==', projectId).get();
        const mediaMessages: any[] = [];
        
        for (const doc of snapshot.docs) {
            const asset = doc.data();
            if (asset.gcsUrl && (asset.type === 'image' || asset.type.startsWith('image/'))) {
                const signedUrl = await generateV4ReadSignedUrl(asset.gcsUrl);
                mediaMessages.push({
                    type: 'image',
                    image: signedUrl,
                });
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 3. Final JSON Stream Generation
        // ─────────────────────────────────────────────────────────────

        const enginePromptMap = {
            image: "Favor 'generate_image' for any missing visual assets. Focus on creating highly descriptive prompts for a high-quality static background that will have Ken Burns motion applied.",
            cinematic: `Use 'generate_video' for ALL scenes to leverage Veo 3.1. Generate a cinematic story prompt based entirely on the project context and product narrative. Focus strongly on visual description, camera motion, and cinematic tone. Native Veo 3 audio is active, so you can leave voiceover.text empty if native audio fits better. STRICT LIMIT: Total storyboard duration must not exceed ${durationSetting} seconds.`
        };

        const systemPrompt = `
      You are the Creative Director and Cinematographer Gen-Agent for VividLaunch.
      
      CREATIVE BRIEF (Compiled by ADK Researcher):
      ${creativeBrief}

      VIDEO ENGINE MODE: ${engine.toUpperCase()}
      ${enginePromptMap[engine as keyof typeof enginePromptMap]}

      SAFETY GUARDRAILS:
      Do NOT generate content that promotes hate speech, violence, illegal acts, sexual explicitness, or harassment. If the project context requests something prohibited, pivot to generating a generic, safe promotional video.

      INSTRUCTIONS:
      Generate a sequence of scene blocks for a promotional video, or a long-form blog post if the format is 'blog'.
      
      FOR BLOGS (if format specified in prompt):
      - Create a unique, SEO-driven narrative that is NOT a repeat of previous generic templates.
      - If a specific 'topic' or 'brief' is provided in the User Prompt, you MUST make it the central theme of the blog.
      - Use the Brand Voice tokens to adjust tone and complexity.
      - Aim for COMPREHENSIVENESS (at least 800-1200 words) with clear headings and structure.
      
      FOR VIDEOS (Cinematographer mode):
      - ALLOCATE SCENE DURATIONS: You have a target approximate video duration of ${durationSetting} seconds. You MUST allocate appropriate \`duration\` (in seconds) to each scene block so their sum is within ±20% of ${durationSetting}.
      - STYLE-BASED PACING GUIDELINES: 
          - HOOK (~10-15s): Generate 2-3 high-impact, fast-paced scenes.
          - PROMO (~30-45s): Generate 4-6 scenes with professional feature exposition.
          - STORY (~60-120s): Generate 7-12 scenes with narrative depth and smooth build-up.
      - PACING & BREATHING: Prioritize narrative flow and cinematic pacing. Narrators should have room to breathe; do NOT cram too much text into short scenes.
      - VOICE CONSISTENCY: You MUST use a **strictly consistent** \`voiceover.tone\` and \`voiceover.pace\` across ALL scenes to ensure the narrator sounds like the same person throughout the video.
      - ASSET MIXING RULE: You MUST prioritize using 'uploaded_asset' for any scene where the project assets (images provided) are relevant to the narrative. MIX uploaded assets with AI-generated visuals ('generate_image' or 'generate_video') to create a premium, product-focused video.
      - Carefully select the \`transition\` type (e.g., fade, wipeleft, wiperight, slideup, slidedown, circlecrop) for seamless flow between scenes.
      - Apply cinematic \`camera_motion\` (e.g., zoom_in, zoom_out, pan_left, pan_right) for still images.
      - Configure \`subtitle_settings\` specifically for the voiceover.
      - 🚨 STRICT VOICE OVER RULE: DO NOT use emojis, emoticons, or special characters in the \`voiceover.text\`. The narrator will read them out loud.
      
      For visual.base.source:
      - Use 'uploaded_asset', 'generate_image', and 'generate_video' intelligently.
      - If you use 'uploaded_asset', you MUST reference it by its exact 20-character alphanumeric ID from the CREATIVE BRIEF list.
      - IF the 'uploaded_asset' is a video, estimate 'start_time_seconds' and 'end_time_seconds'.
    `;

        if (format === 'blog') {
            console.log(`[Generate API] Mode: Blog. Starting generateObject pass with googleModel...`);
            const { generateObject } = require('ai');
            const { object } = await generateObject({
                model: googleModel,
                schema: blogSchema,
                system: systemPrompt,
                prompt: prompt || "Generate a high-impact promotional blog post.",
            });
            console.log(`[Generate API] Blog generation complete. Title: ${object.title}`);

            // Persistence: Save to History
            try {
                const blogId = `blog_${Date.now()}`;
                await db.collection(COLLECTIONS.PROJECTS)
                    .doc(projectId)
                    .collection('blogs')
                    .doc(blogId)
                    .set({
                        ...object,
                        id: blogId,
                        createdAt: new Date().toISOString(),
                        status: 'generated'
                    });
                console.log(`[Generate API] Blog persisted to ${projectId}/blogs/${blogId}`);
            } catch (fsErr) {
                console.error("[Generate API] Firestore persistence failed:", fsErr);
            }

            return new Response(JSON.stringify(object), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log(`[Generate API] Mode: Video. Starting streamObject pass with googleModel...`);
        const result = await streamObject({
            model: googleModel,
            schema: sceneBlockSchema,
            system: systemPrompt,
            messages: [
                 {
                     role: 'user',
                     content: [
                         { type: 'text', text: prompt || "Generate a high-impact promotional video storyboard from these assets." },
                         ...mediaMessages
                     ]
                 }
            ]
        });

        return result.toTextStreamResponse();

    } catch (error: any) {
        console.error("Error generating storyboard:", error);
        return new Response(error.message, { status: 500 });
    }
}
