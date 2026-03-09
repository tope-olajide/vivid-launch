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
        subtitle_style: z.string().optional(),
    }),
    visual: z.object({
        base: z.object({
            source:               z.string(),
            asset_id:             z.string().optional(),
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
): Promise<z.infer<typeof storyboardSchema>> {
    const angleInstruction = angle === 'A'
        ? 'Focus on the EMOTIONAL STORY and human outcome. Open with a bold problem statement.'
        : 'Focus on the TECHNICAL PROOF and data-driven results. Open with a striking statistic or achievement.';

    const { object } = await generateObject({
        model: google('gemini-2.0-flash'),
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
- A visual source: "stock_video", "generate_image", or "uploaded_asset"
- A visual prompt if source is stock_video or generate_image

Return ONLY valid JSON.`,
    });

    return object;
}

// ── Route handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const { projectId, prompt } = await request.json() as {
            projectId: string;
            prompt?: string;
        };

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
        }

        // Fetch project context from Firestore
        let projectContext = prompt || '';

        if (!projectContext) {
            const doc = await db.collection('projects').doc(projectId).get();
            if (doc.exists) {
                const data = doc.data() as any;
                projectContext = [
                    `Project: ${data.name || 'Untitled'}`,
                    `Industry: ${data.industry || 'General'}`,
                    `Brand Voice: ${data.brandVoice?.tone || 'professional'}`,
                    `Target Audience: ${data.audience || 'general audience'}`,
                    `Campaign Goal: ${data.goal || 'brand awareness'}`,
                ].join('\n');
            }
        }

        console.log(`[Variants API] Generating A/B for project ${projectId}`);

        // Generate both variants in parallel
        const [variantA, variantB] = await Promise.all([
            generateVariant(projectContext, 'A'),
            generateVariant(projectContext, 'B'),
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
