import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/gcp/firestore';

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const { projectId } = params;
        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(projectId).get();
        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const projectData = projectDoc.data();
        const autopilotSettings = projectData?.autopilotSettings || {
            enabledPlatforms: [],
            automationEnabled: false,
            pulse: { videos: 1, blogs: 1, social: 7 },
            brandVoice: {
                tone: 50,
                humor: 30,
                formality: 70,
                emojiDensity: 40,
                customPrompt: ""
            }
        };

        return NextResponse.json({ autopilotSettings });
    } catch (err: any) {
        console.error('[Autopilot GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const { projectId } = params;
        const body = await request.json();
        const { autopilotSettings } = body;

        if (!projectId || !autopilotSettings) {
            return NextResponse.json({ error: 'projectId and autopilotSettings are required' }, { status: 400 });
        }

        await db.collection(COLLECTIONS.PROJECTS).doc(projectId).update({
            autopilotSettings,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Autopilot POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
