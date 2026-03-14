import { streamText, streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import {
    getProjectContextDeclaration, getProjectContext,
    getProjectAssetsDeclaration, getProjectAssets,
    scrapeWebsiteDeclaration, scrapeWebsite
} from '@/lib/agents/tools';

export const maxDuration = 60; // Allow enough time for campaign generation

/**
 * Platform Constraints
 */
const PLATFORMS = {
    twitter: { name: 'X (Twitter)', limit: 280, dna: 'Punchy, viral, use 1-2 hashtags, max 280 chars. Focus on hooks and engagement.' },
    linkedin: { name: 'LinkedIn', limit: 3000, dna: 'Professional, thought-leadership, industry-specific, structured with bullet points. Longer form allowed.' },
    instagram: { name: 'Instagram', limit: 2200, dna: 'Visual-first caption, emoji-rich, conversational, call-to-action at the end.' },
    tiktok: { name: 'TikTok', limit: 150, dna: 'Gen-Z hype, trending language, very short hook, focusing on the visual hook.' },
    facebook: { name: 'Facebook', limit: 63206, dna: 'Community-focused, engaging, uses many emojis, call-to-action (Share/Comment).' },
    reddit: { name: 'Reddit', limit: 40000, dna: 'Authentic, no-fluff, value-first, subreddit-specific tone. Avoid obvious marketing speak.' }
};

export async function POST(req: Request) {
    try {
        const { projectId, platform, platforms, mode, prompt: userPrompt } = await req.json();

        if (!projectId) return new Response('Missing projectId', { status: 400 });

        // Base System Prompt for all social tasks
        const baseSystem = `You are the Social Media Director at VividLaunch. 
        Your goal is to generate high-converting social media content for the project provided.
        You must strictly adhere to platform character limits and "DNA" (tone/style).
        Always suggest 1-3 relevant hashtags unless specified otherwise.
        Use the available tools to understand the project's brand voice, audience, and assets.`;

        // --- Mode 1: Single Post ---
        if (mode === 'single' && platform) {
            const platformConfig = PLATFORMS[platform as keyof typeof PLATFORMS];
            if (!platformConfig) return new Response('Invalid platform', { status: 400 });

            const result = await streamText({
                model: google('gemini-3-flash-preview'),
                system: `${baseSystem}\n\nPlatform: ${platformConfig.name}\nDNA: ${platformConfig.dna}\nLimit: ${platformConfig.limit} characters.\n\nGenerate a single post.`,
                prompt: userPrompt || "Generate a post about this project.",
                tools: {
                    get_project_context: getProjectContextDeclaration as any,
                    get_project_assets: getProjectAssetsDeclaration as any,
                    scrape_website: scrapeWebsiteDeclaration as any,
                },
            });

            return result.toTextStreamResponse();
        }

        // --- Mode 2: Content Pack ---
        if (mode === 'pack') {
            const targetPlatforms = platforms || ['twitter', 'linkedin', 'instagram', 'tiktok'];
            
            const result = await streamObject({
                model: google('gemini-3-flash-preview'),
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
            });

            return result.toTextStreamResponse();
        }

        // --- Mode 3: Launch Campaign ---
        if (mode === 'campaign') {
            const result = await streamObject({
                model: google('gemini-3-flash-preview'),
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
