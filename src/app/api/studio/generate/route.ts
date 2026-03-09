import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { db, COLLECTIONS } from '@/lib/gcp/firestore';
import { generateV4ReadSignedUrl } from '@/lib/gcp/storage';

// Define the expected output structure from Gemini
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
                source: z.enum(['uploaded_asset', 'generate_image', 'stock_video']),
                asset_id: z.string().optional(),
                prompt: z.string().optional(),
                start_time_seconds: z.number().optional(),
                end_time_seconds: z.number().optional()
            }),
            overlay: z.object({
                source: z.enum(['uploaded_asset', 'generate_image', 'stock_video', 'none']),
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

        // 1. Fetch Project and Brand Voice
        const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(projectId).get();

        if (!projectDoc.exists) {
            return new Response("Project not found", { status: 404 });
        }

        const projectData = projectDoc.data()!;
        const brandVoice = projectData.brandVoice || {};

        // 2. Fetch Project Assets
        const assetsSnapshot = await db.collection(COLLECTIONS.ASSETS).where('projectId', '==', projectId).get();
        const assets = assetsSnapshot.docs.map(doc => {
            const data = doc.data() as { gcsUrl?: string; type?: string; [key: string]: any };
            return {
                asset_id: doc.id,
                ...data
            };
        });

        // Filter and prepare actual media files to send to Gemini
        const mediaMessages: any[] = [];
        for (const asset of assets) {
            if (asset.gcsUrl) {
               // Generate a temporary signed read URL so Vercel AI SDK can download the private bucket asset
               const signedUrl = await generateV4ReadSignedUrl(asset.gcsUrl);

               // We skip 'video' types for now because downloading and passing 
               // a 4-minute video buffer causes Next.js serverless functions to time out.
               // Gemini still knows about the video from the stringified assets array in the prompt.
               if (asset.type === 'image') {
                   mediaMessages.push({
                       type: 'image',
                       image: signedUrl, // Must be string (URL)
                   });
               }
            }
        }

        // 3. Construct System Prompt
        const systemPrompt = `
      You are the Creative Director for VividLaunch. You generate high-converting promotional campaigns.
      
      PROJECT Details:
      Name: ${projectData.name}
      Tagline: ${projectData.tagline}
      Description: ${projectData.description}
      Target Audience: ${projectData.targetAudience}

      BRAND VOICE:
      Tone (0=Safe, 100=Bold): ${brandVoice.tone || 50}
      Humor (0=Serious, 100=Playful): ${brandVoice.humor || 30}
      Formality (0=Casual, 100=Professional): ${brandVoice.formality || 60}
      Emoji Usage: ${brandVoice.emojiUsage || 40}
      Audience Level: ${brandVoice.audienceLevel || "intermediate"}

      AVAILABLE ASSETS:
      ${JSON.stringify(assets)}

      SAFETY GUARDRAILS:
      You must strictly adhere to content safety guidelines. Do NOT generate content that promotes hate speech, violence, illegal acts, sexual explicitness, or harassment. If the project context or prompt requests something prohibited, pivot to generating a generic, safe promotional video about the core brand instead.

      INSTRUCTIONS:
      Generate a sequence of scene blocks for a promotional video.
      For visual.base.source, prefer 'uploaded_asset' if an appropriate asset exists in AVAILABLE ASSETS, referencing it by asset_id.
      IF the 'uploaded_asset' is a video, you MUST analyze it and provide 'start_time_seconds' and 'end_time_seconds' to extract the most exciting or relevant segment matching the scene's duration.
      Otherwise, use 'generate_image' (provide a prompt) or 'stock_video'.
    `;

        // 4. Stream structured JSON using Gemini
        const result = await streamObject({
            model: google('gemini-3-flash-preview'),
            schema: sceneBlockSchema,
            system: systemPrompt,
            messages: [
                 {
                     role: 'user',
                     content: [
                         { type: 'text', text: prompt || "Generate a high-impact promotional video storyboard from these assets." },
                         ...mediaMessages // Inject the actual video/image files
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
