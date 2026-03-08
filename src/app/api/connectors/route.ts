/**
 * POST /api/connectors
 * Save connector credentials for a project.
 *
 * Body: { projectId: string; connectorId: ConnectorId; credentials: Record<string, string> }
 *
 * GET /api/connectors?projectId=xxx
 * Returns all saved connectors for a project.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/gcp/firestore';
import type { ConnectorId, StoredConnector } from '@/lib/connectors/types';

const CONNECTORS_COLLECTION = 'connectors';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, connectorId, credentials } = body as {
            projectId: string;
            connectorId: ConnectorId;
            credentials: Record<string, string>;
        };

        if (!projectId || !connectorId || !credentials) {
            return NextResponse.json({ error: 'projectId, connectorId, and credentials are required.' }, { status: 400 });
        }

        const doc: StoredConnector = {
            id: connectorId,
            projectId,
            credentials,
            connectedAt: new Date().toISOString(),
        };

        // Store under projects/{projectId}/connectors/{connectorId}
        await db
            .collection('projects')
            .doc(projectId)
            .collection(CONNECTORS_COLLECTION)
            .doc(connectorId)
            .set(doc);

        return NextResponse.json({ success: true, connector: { id: connectorId, connectedAt: doc.connectedAt } });
    } catch (err: any) {
        console.error('[Connectors POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'projectId query param is required.' }, { status: 400 });
        }

        const snap = await db
            .collection('projects')
            .doc(projectId)
            .collection(CONNECTORS_COLLECTION)
            .get();

        const connectors = snap.docs.map((d) => {
            const data = d.data() as StoredConnector;
            // Strip actual credentials from the response — only send metadata
            return { id: data.id, connectedAt: data.connectedAt };
        });

        return NextResponse.json({ connectors });
    } catch (err: any) {
        console.error('[Connectors GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const connectorId = searchParams.get('connectorId') as ConnectorId;

        if (!projectId || !connectorId) {
            return NextResponse.json({ error: 'projectId and connectorId are required.' }, { status: 400 });
        }

        await db
            .collection('projects')
            .doc(projectId)
            .collection(CONNECTORS_COLLECTION)
            .doc(connectorId)
            .delete();

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Connectors DELETE]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
