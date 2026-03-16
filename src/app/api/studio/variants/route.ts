/**
 * POST /api/studio/variants
 *
 * Generates two creative variations of the same promotional concept
 * so the user can compare and choose the better one.
 *
 * Body: { projectId: string; prompt?: string }
 *
 * Returns: { variantA: Scene[]; variantB: Scene[] }
 * Both are full scene arrays (not streamed) so the comparison page
 * can render them side by side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/gcp/firestore';

import { GoogleGenAI } from '@google/genai';
import {
    getProjectContextDeclaration, getProjectContext,
    getProjectAssetsDeclaration, getProjectAssets,
    scrapeWebsiteDeclaration, scrapeWebsite
} from '@/lib/agents/tools';

// ── Shared scene schema ──────────────────────────────────────

const sceneSchema = z.object({
    scene_id:       z.number(),
    duration:       z.number(),
    transition:     z.string(),
    voiceover: z.object({
        text: z.string(),
        tone: z.string(),
        pace: z.string().optional(),
    }),
    text_overlay: z.object({
        content:        z.string(),
        animation:      z.string(),
        subtitle_settings: z.object({
            enabled: z.boolean(),
            position: z.enum(['top', 'middle', 'bottom']),
            color: z.enum(['white', 'yellow', 'cyan', 'green'])
        }).optional()
    }),
    visual: z.object({
        base: z.object({
            source:               z.enum(["uploaded_asset", "generate_image", "generate_video"]),
            asset_id:             z.string().describe("The exact 20-character alphanumeric ID of the asset. DO NOT USE THE FILENAME.").optional(),
            prompt:               z.string().optional(),
            start_time_seconds:   z.number().optional(),
            end_time_seconds:     z.number().optional(),
        }),
    }),
});

const storyboardSchema = z.object({ scenes: z.array(sceneSchema) });

// ── Helper: generate one variant ────────────────────────────

async function generateVariant(
    projectContext: string,
    angle: 'A' | 'B',
    useVeo: boolean
): Promise<z.infer<typeof storyboardSchema>> {
    const angleInstruction = angle === 'A'
        ? 'Focus on the EMOTIONAL STORY and human outcome. Open with a bold problem statement.'
        : 'Focus on the TECHNICAL PROOF and data-driven results. Open with a striking statistic or achievement.';

    const { object } = await generateObject({
        model: google('gemini-3.1-pro-preview'),
        schema: storyboardSchema,
        prompt: `You are a Creative Director AI generating a video storyboard.

Project context:
${projectContext}

Variant ${angle} creative direction: ${angleInstruction}

SAFETY GUARDRAILS:
You must strictly adhere to content safety guidelines. Do NOT generate content that promotes hate speech, violence, illegal acts, sexual explicitness, or harassment. If the project context or prompt requests something prohibited, pivot to generating a generic, safe promotional video about the core brand instead.

Generate a 4-6 scene storyboard. Each scene must have:
- A specific duration (4–8 seconds)
- A text overlay (punchy headline, < 6 words)  
- A voiceover script (1–3 sentences)
- A visual source: "uploaded_asset", "generate_image"${useVeo ? ', or "generate_video"' : ''}
- For visual.base.source, prefer 'uploaded_asset' if an appropriate asset exists in the brief, referencing it exactly by its 20-character asset_id. NEVER use the filename for the asset_id.
- IF the 'uploaded_asset' is a video, estimate 'start_time_seconds' and 'end_time_seconds'.
- ${useVeo ? "Use 'generate_video' heavily if no suitable uploaded asset is found (since High Quality Video Generation is ENABLED) and provide a rich prompt describing the fast, dynamic motion in extreme detail." : "Otherwise, use 'generate_image' (provide a highly descriptive visual prompt for Google Imagen)."}

Return ONLY valid JSON.`,
    });

    return object;
}

// ── Route handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const { projectId, prompt, useVeo } = await request.json() as {
            projectId: string;
            prompt?: string;
            useVeo?: boolean;
        };

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
        }

        // ─────────────────────────────────────────────────────────────
        // 1. Core Agent Intelligence Loop (Google ADK + Tools)
        // ─────────────────────────────────────────────────────────────
        
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
        
        console.log(`[Variants API] Initiating context gathering loop for project ${projectId}...`);
        
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

        let adkResponse = await chat.sendMessage({ 
            message: `Please gather context for projectId: ${projectId}. User prompt: ${prompt || "Generate a high-impact promotional video storyboard."}` 
        });

        let loopCount = 0;
        while (adkResponse.functionCalls && adkResponse.functionCalls.length > 0 && loopCount < 5) {
            const functionResponses = [];
            
            for (const call of adkResponse.functionCalls) {
                const name = call.name;
                const args = call.args as any;
                
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
        console.log(`[Variants API] Compilation complete. Final Brief length: ${creativeBrief.length} chars. Generating A/B...`);

        // Generate both variants in parallel using Vercel AI SDK
        const [variantA, variantB] = await Promise.all([
            generateVariant(creativeBrief, 'A', !!useVeo),
            generateVariant(creativeBrief, 'B', !!useVeo),
        ]);

        return NextResponse.json({
            variantA: variantA.scenes,
            variantB: variantB.scenes,
        });

    } catch (err: any) {
        console.error('[Variants API]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
