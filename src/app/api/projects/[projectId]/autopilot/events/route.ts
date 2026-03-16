/**
 * GET  /api/projects/[projectId]/autopilot/events — Returns recent autopilot activity events
 * POST /api/projects/[projectId]/autopilot/events — Logs a new autopilot event
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/gcp/firestore';

const EVENTS_SUBCOLLECTION = 'autopilotEvents';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        const snapshot = await db
            .collection(COLLECTIONS.PROJECTS)
            .doc(projectId)
            .collection(EVENTS_SUBCOLLECTION)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ events });
    } catch (err: any) {
        console.error('[Autopilot Events GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await request.json();
        const { type, platform, message, contentId } = body;

        if (!projectId || !type || !message) {
            return NextResponse.json(
                { error: 'projectId, type, and message are required' },
                { status: 400 }
            );
        }

        const event = {
            type,          // "content_generated" | "queued" | "published" | "error"
            platform: platform || null,
            message,
            contentId: contentId || null,
            timestamp: new Date().toISOString(),
        };

        const ref = await db
            .collection(COLLECTIONS.PROJECTS)
            .doc(projectId)
            .collection(EVENTS_SUBCOLLECTION)
            .add(event);

        return NextResponse.json({ success: true, eventId: ref.id });
    } catch (err: any) {
        console.error('[Autopilot Events POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
