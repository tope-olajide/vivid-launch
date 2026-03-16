import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/gcp/firestore';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const EVENTS_SUBCOLLECTION = 'autopilotEvents';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const { templateId, name, description } = await request.json();

        if (!projectId || !templateId) {
            return NextResponse.json({ error: 'projectId and templateId are required' }, { status: 400 });
        }

        // 1. Generate Strategy with Gemini 3.1 Pro
        const { text } = await generateText({
            model: google('gemini-3.1-pro-preview'),
            system: `You are a world-class Marketing Strategist and Creative Director. 
            Your goal is to take a product name, description, and a "Launch Arc" template ID, 
            and generate a specific, actionable content roadmap.
            
            Templates:
            - app-launch: Big bang launch with teasers, main video, and follow-ups.
            - feature-update: Focus on specific new capabilities and value props.
            - testimonial-push: Leverage social proof and user stories.
            - growth-sprint: High-volume consistent output across all channels.
            - product-hunt: Specific countdown and launch day hype.

            Output a JSON array of 5 steps for the roadmap. 
            Each step should have: 
            - day: number (1-7)
            - type: "video" | "blog" | "social"
            - title: short catch title
            - description: what the content will focus on`,
            prompt: `Product: ${name}
            Description: ${description}
            Template: ${templateId}
            
            Generate the 5-step roadmap strategy in JSON format.`,
        });

        // Parse JSON safely
        let roadmap = [];
        try {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            roadmap = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse Gemini strategy:", text);
            // Fallback roadmap
            roadmap = [
                { day: 1, type: "social", title: "The Hook", description: "Tease the core problem we solve." },
                { day: 2, type: "blog", title: "Deep Dive", description: "Explain the 'Why' behind the project." },
                { day: 3, type: "video", title: "The Reveal", description: "Main cinematic trailer launch." },
                { day: 4, type: "social", title: "Feature Spotlight", description: "Highlight the top 3 features." },
                { day: 5, type: "social", title: "Join the Movement", description: "Final call to action for launch week." }
            ];
        }

        // 2. Save roadmap steps as events in Firestore
        const batch = db.batch();
        const eventsRef = db.collection(COLLECTIONS.PROJECTS).doc(projectId).collection(EVENTS_SUBCOLLECTION);

        // First, add a "Strategy Activated" event
        const initRef = eventsRef.doc();
        batch.set(initRef, {
            type: 'content_generated',
            message: `🚀 Campaign Strategy Activated: ${templateId.toUpperCase()}`,
            timestamp: new Date().toISOString(),
            platform: 'vividlaunch'
        });

        // Add roadmap items
        roadmap.forEach((item: any, index: number) => {
            const docRef = eventsRef.doc();
            batch.set(docRef, {
                type: 'queued',
                message: `[Day ${item.day}] ${item.type.toUpperCase()}: ${item.title} — ${item.description}`,
                timestamp: new Date(Date.now() + (index + 1) * 1000).toISOString(), // Stagger timestamps slightly
                platform: item.type === 'social' ? 'twitter' : (item.type === 'blog' ? 'medium' : 'youtube')
            });
        });

        // Also save strategy to project document for quick access
        const projectRef = db.collection(COLLECTIONS.PROJECTS).doc(projectId);
        batch.update(projectRef, { 
            strategy: roadmap,
            activeTemplate: templateId 
        });

        await batch.commit();

        return NextResponse.json({ success: true, roadmap });
    } catch (err: any) {
        console.error('[Strategy API POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
