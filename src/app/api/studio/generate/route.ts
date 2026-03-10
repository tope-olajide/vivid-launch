import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
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
            subtitle_style: z.string()
        }),
        visual: z.object({
            base: z.object({
                source: z.enum(['uploaded_asset', 'generate_image']),
                asset_id: z.string().optional(),
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

export async function POST(req: Request) {
    try {
        const { projectId, prompt } = await req.json();

        if (!projectId) {
            return new Response("Missing projectId", { status: 400 });
        }

        // ─────────────────────────────────────────────────────────────
        // 1. Core Agent Intelligence Loop (Google ADK + Tools)
        // ─────────────────────────────────────────────────────────────
        
        // Initialize the ADK client
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
        
        console.log(`[Agent] Initiating context gathering loop for project ${projectId}...`);
        
        // Let the agent use tools to fetch context autonomously
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash',
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

        let adkResponse = await chat.sendMessage({ 
            message: `Please gather context for projectId: ${projectId}. User prompt: ${prompt || "Generate a high-impact promotional video storyboard."}` 
        });

        // Autonomous Tool Execution Loop
        let loopCount = 0;
        while (adkResponse.functionCalls && adkResponse.functionCalls.length > 0 && loopCount < 5) {
            const functionResponses = [];
            
            for (const call of adkResponse.functionCalls) {
                const name = call.name;
                const args = call.args as any;
                
                console.log(`[Agent] Executing tool: ${name}`, args);
                
                let resultData;
                if (name === 'get_project_context') {
                    resultData = await getProjectContext(args.projectId);
                } else if (name === 'get_project_assets') {
                    resultData = await getProjectAssets(args.projectId);
                } else if (name === 'scrape_website') {
                    resultData = await scrapeWebsite(args.url);
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
            
            adkResponse = await chat.sendMessage({ message: functionResponses });
            loopCount++;
        }

        const creativeBrief = adkResponse.text || "No context gathered.";
        console.log(`[Agent] Compilation complete. Final Brief length: ${creativeBrief.length} chars.`);

        // ─────────────────────────────────────────────────────────────
        // 2. Prepare Media for Gemini Structured Generative Pass
        // ─────────────────────────────────────────────────────────────
        
        // Re-fetch assets manually just to get GCS URLs for the Vercel AI SDK passing 
        // (Since the ADK loop returns text summaries, we still need the raw image buffers for the vision model)
        const rawAssets = await getProjectAssets(projectId);
        const mediaMessages: any[] = [];
        
        if (Array.isArray(rawAssets.assets)) {
            for (const asset of rawAssets.assets) {
                if (asset.gcsUrl && asset.type === 'image') {
                    const signedUrl = await generateV4ReadSignedUrl(asset.gcsUrl);
                    mediaMessages.push({
                        type: 'image',
                        image: signedUrl,
                    });
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 3. Final JSON Stream Generation
        // ─────────────────────────────────────────────────────────────

        const systemPrompt = `
      You are the Creative Director Gen-Agent for VividLaunch.
      
      CREATIVE BRIEF (Compiled by ADK Researcher):
      ${creativeBrief}

      SAFETY GUARDRAILS:
      Do NOT generate content that promotes hate speech, violence, illegal acts, sexual explicitness, or harassment. If the project context requests something prohibited, pivot to generating a generic, safe promotional video.

      INSTRUCTIONS:
      Generate a sequence of scene blocks for a promotional video.
      For visual.base.source, prefer 'uploaded_asset' if an appropriate asset exists in the brief, referencing it by asset_id.
      IF the 'uploaded_asset' is a video, estimate 'start_time_seconds' and 'end_time_seconds'.
      Otherwise, use 'generate_image' (provide a highly descriptive visual prompt for Google Imagen).
    `;

        const result = await streamObject({
            model: google('gemini-3-flash-preview'),
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
