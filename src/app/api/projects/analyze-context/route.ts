import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { scrapeWebsite } from '@/lib/agents/tools';

const analysisSchema = z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    targetAudience: z.string(),
    brandVoice: z.object({
        tone: z.number().describe("0-100 value: 0 is safe/conservative, 100 is bold/provocative"),
        humor: z.number().describe("0-100 value: 0 is serious, 100 is very playful"),
        formality: z.number().describe("0-100 value: 0 is casual, 100 is very professional"),
        emojiUsage: z.number().describe("0-100 value: 0 is none, 100 is heavy")
    }),
    keyFeatures: z.array(z.string()),
    extractedKnowledge: z.string().describe("A comprehensive summary of the product insights and documentation extracted.")
});

export async function POST(req: Request) {
    try {
        const { type, value, manualDescription } = await req.json();

        let contextText = "";
        let metadata = {};

        if (type === 'website' || type === 'blog') {
            const scrapeResult = await scrapeWebsite(value);
            if ('error' in scrapeResult) {
                return new Response(JSON.stringify({ error: scrapeResult.error }), { status: 500 });
            }
            contextText = scrapeResult.scrapedText;
            metadata = scrapeResult.metadata;
        } else if (type === 'manual') {
            contextText = value || manualDescription;
        } else if (type === 'file') {
            // For hackathon, we assume the 'value' passed is the text content of the file
            // extracted on the frontend or a placeholder for now.
            contextText = value;
        }

        if (!contextText) {
            return new Response(JSON.stringify({ error: "No content found for analysis." }), { status: 400 });
        }

        const systemPrompt = `
            You are the VividLaunch Brand Architect. 
            Your goal is to analyze the provided raw content from a ${type} and extract a structured brand identity.
            
            Focus on:
            1. Determining the product's actual name and mission.
            2. Identifying the core target audience.
            3. Decoding the Brand DNA:
               - Tone: Is it safe/corporate or bold/disruptive?
               - Humor: Is it dry/serious or witty/playful?
               - Formality: Is it professional or casual/street?
               - Emoji: Does it use emojis for engagement?
            
            Be precise. If information is missing, infer a professional default based on the context.
        `;

        console.log(`[Context Analyzer] Starting AI generation with ${contextText.length} characters of context...`);
        const { object } = await generateObject({
            model: google('gemini-3.1-pro-preview'),
            schema: analysisSchema,
            system: systemPrompt,
            prompt: `Analyze this content: \n\n${contextText}`,
        });
        console.log(`[Context Analyzer] AI generation successful for ${object.name}`);

        return new Response(JSON.stringify({ analysis: object, metadata }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[Context Analyzer Error]", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
