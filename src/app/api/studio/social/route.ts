import { streamText, streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import {
    getProjectContextDeclaration, getProjectContext,
    getProjectAssetsDeclaration, getProjectAssets,
    scrapeWebsiteDeclaration, scrapeWebsite
} from '@/lib/agents/tools';
import { db, COLLECTIONS } from '@/lib/gcp/firestore';

export const maxDuration = 60; // Allow enough time for campaign generation

/**
 * Platform Constraints
 */
const PLATFORMS = {
    twitter: { name: 'X (Twitter)', limit: 280, dna: 'Punchy, viral, use 1-2 hashtags, max 280 chars. Focus on hooks and engagement.' },
    linkedin: { name: 'LinkedIn', limit: 3000, dna: 'Professional, thought-leadership, industry-specific, structured with bullet points. Longer form allowed.' },
    instagram: { name: 'Instagram', limit: 2200, dna: 'Visual-first caption, emoji-rich, conversational, call-to-action at the end.' },
    facebook: { name: 'Facebook', limit: 63206, dna: 'Community-focused, engaging, uses many emojis, call-to-action (Share/Comment).' },
    reddit: { name: 'Reddit', limit: 40000, dna: 'Authentic, no-fluff, value-first, subreddit-specific tone. Avoid obvious marketing speak.' }
};

export async function POST(req: Request) {
    try {
        const { projectId, platform, platforms, mode, prompt: userPrompt } = await req.json();
        console.log(`[Social API] POST Request received`, { projectId, mode, platform, platforms });

        if (!projectId) {
            console.error('[Social API] Missing projectId');
            return new Response('Missing projectId', { status: 400 });
        }

        console.log(`[Social API] Fetching context for ${projectId}`);
        const projectContext: any = await getProjectContext(projectId);
        const projectAssets: any = await getProjectAssets(projectId);
        
        let scrapedContent = "";
        if (projectContext && !projectContext.error && projectContext.websiteUrl) {
            const scrape: any = await scrapeWebsite(projectContext.websiteUrl, projectContext.scraperSettings?.scope, projectContext.scraperSettings?.depth);
            if (scrape && !scrape.error) {
                scrapedContent = `\nScraped Website Content (Reference):\n${scrape.scrapedText}`;
            }
        }

        const projectDataString = `PROJECT CONTEXT:
Name: ${projectContext?.name || ''}
Tagline: ${projectContext?.tagline || ''}
Description: ${projectContext?.description || ''}
Target Audience: ${Array.isArray(projectContext?.targetAudience) ? projectContext.targetAudience.join(', ') : projectContext?.targetAudience || ''}
Voice Guidelines: ${JSON.stringify(projectContext?.brandVoice || {})}

AVAILABLE ASSETS:
${JSON.stringify(projectAssets || {})}
${scrapedContent}
`;

        // Base System Prompt for all social tasks
        const baseSystem = `You are the Social Media Director at VividLaunch. 
        Your goal is to generate high-converting social media content for the project provided.
        You must strictly adhere to platform character limits and "DNA" (tone/style).
        Always suggest 1-3 relevant hashtags unless specified otherwise.
        
        CRITICAL: DO NOT repeat the prompt in your output. Return ONLY the content of the post. No conversational filler, no repetition of my instructions.
        
        ${projectDataString}`;

        if (mode === 'single' && platform) {
            const platformConfig = PLATFORMS[platform as keyof typeof PLATFORMS];
            if (!platformConfig) {
                console.error(`[Social API] Invalid platform: ${platform}`);
                return new Response('Invalid platform', { status: 400 });
            }

            console.log(`[Social API] Mode: Single. Model: gemini-3-flash-preview. Platform: ${platformConfig.name}`);

            const result = await streamText({
                model: google('gemini-3.1-pro-preview'),
                system: `${baseSystem}\n\nPlatform: ${platformConfig.name}\nDNA: ${platformConfig.dna}\nLimit: ${platformConfig.limit} characters.\n\nGenerate a single post. Return ONLY the post content.`,
                prompt: userPrompt || "Generate a post about this project.",
                onFinish: async ({ text }) => {
                    console.log(`[Social API] Single post stream finished. Content length: ${text?.length}`);
                    try {
                        const doc = await db.collection('socials').add({
                            projectId,
                            platform,
                            content: text,
                            createdAt: new Date().toISOString(),
                            type: 'single'
                        });
                        console.log(`[Social API] Single post saved to Firestore: ${doc.id}`);
                    } catch (fsErr) {
                        console.error('[Social API] Firestore save error:', fsErr);
                    }
                },
            });

            return result.toTextStreamResponse();
        }

        if (mode === 'variant' && platform) {
            const platformConfig = PLATFORMS[platform as keyof typeof PLATFORMS];
            console.log(`[Social API] Mode: Variant. Platform: ${platformConfig?.name}`);

            const result = await streamObject({
                model: google('gemini-3.1-pro-preview'),
                schema: z.object({
                    variantA: z.object({
                        content: z.string(),
                        strategy: z.string()
                    }),
                    variantB: z.object({
                        content: z.string(),
                        strategy: z.string()
                    })
                }),
                system: `${baseSystem}\n\nYou are generating TWO DISTINCT A/B VARIANTS for ${platformConfig?.name}.
                Variant A: Emotional, story-driven, human-centric.
                Variant B: Logical, benefit-driven, feature-centric.
                Return BOTH variants.`,
                prompt: userPrompt || "Generate dual creative directions for this project.",
                onFinish: async ({ object }) => {
                    if (object) {
                        try {
                            const batch = db.batch();
                            const variants = [
                                { label: 'A', ...object.variantA },
                                { label: 'B', ...object.variantB }
                            ];
                            variants.forEach(v => {
                                const ref = db.collection('socials').doc();
                                batch.set(ref, {
                                    projectId,
                                    platform,
                                    content: v.content,
                                    strategy: v.strategy,
                                    variantLabel: v.label,
                                    createdAt: new Date().toISOString(),
                                    type: 'variant'
                                });
                            });
                            await batch.commit();
                        } catch (err) {
                            console.error('[Social API] Variant save error:', err);
                        }
                    }
                }
            });

            return result.toTextStreamResponse();
        }

        // --- Mode 2: Content Pack ---
        if (mode === 'pack') {
            const targetPlatforms = platforms || ['twitter', 'linkedin', 'instagram', 'tiktok'];
            console.log(`[Social API] Mode: Pack. Model: gemini-3-flash-preview. Target Platforms: ${targetPlatforms.join(', ')}`);
            
            const result = await streamObject({
                model: google('gemini-3.1-pro-preview'),
                schema: z.object({
                    posts: z.array(z.object({
                        platform: z.string(),
                        content: z.string(),
                        hashtags: z.array(z.string()),
                        charCount: z.number()
                    }))
                }),
                system: `${baseSystem}\n\nYou are generating a MULTI-PLATFORM CONTENT PACK. 
                Generate one post for each of these platforms: ${targetPlatforms.join(', ')}.
                Ensure each post is uniquely tailored to that platform's DNA and character limits.`,
                prompt: userPrompt || "Generate a launch announcement pack for this project.",
                onFinish: async ({ object }) => {
                    if (object?.posts) {
                        try {
                            const batch = db.batch();
                            object.posts.forEach(post => {
                                const ref = db.collection('socials').doc();
                                batch.set(ref, {
                                    projectId,
                                    platform: post.platform,
                                    content: post.content,
                                    hashtags: post.hashtags,
                                    createdAt: new Date().toISOString(),
                                    type: 'pack'
                                });
                            });
                            await batch.commit();
                            console.log(`[Social API] Content pack batch saved to Firestore.`);
                        } catch (fsErr) {
                            console.error('[Social API] Firestore batch save error:', fsErr);
                        }
                    }
                },
            });

            return result.toTextStreamResponse();
        }

        // --- Mode 3: Launch Campaign ---
        if (mode === 'campaign') {
            const result = await streamObject({
                model: google('gemini-3.1-pro-preview'),
                schema: z.object({
                    campaignName: z.string(),
                    strategy: z.string(),
                    roadmap: z.array(z.object({
                        day: z.number(),
                        platform: z.string(),
                        task: z.string(),
                        contentSnippet: z.string()
                    })),
                    assets: z.object({
                        videoScript: z.string(),
                        blogTitle: z.string(),
                        blogExcerpt: z.string(),
                        socialPosts: z.array(z.object({
                            platform: z.string(),
                            content: z.string()
                        }))
                    })
                }),
                system: `${baseSystem}\n\nYou are generating a FULL LAUNCH CAMPAIGN.
                This is a comprehensive orchestration. Think strategically about the roadmap (Day 1 teaser, Day 2 launch, etc.).
                Include a short video script, a blog title/excerpt, and multiple social posts.`,
                prompt: userPrompt || "Orchestrate a complete launch campaign for this project.",
            });

            return result.toTextStreamResponse();
        }

        return new Response('Invalid mode or missing parameters', { status: 400 });

    } catch (error: any) {
        console.error('[Social API Error]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
