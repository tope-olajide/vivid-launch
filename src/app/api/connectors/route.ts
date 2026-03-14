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
import { db, COLLECTIONS } from '@/lib/gcp/firestore';
import { OWNER_ID } from '@/lib/owner';
import type { ConnectorId, StoredOwnerConnector } from '@/lib/connectors/types';

const CONNECTORS_COLLECTION = 'connectors';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { connectorId, credentials, accountName } = body as {
            connectorId: ConnectorId;
            credentials: Record<string, string>;
            accountName?: string;
        };

        if (!connectorId || !credentials) {
            return NextResponse.json({ error: 'connectorId and credentials are required.' }, { status: 400 });
        }

        const doc: StoredOwnerConnector = {
            id: connectorId,
            ownerId: OWNER_ID,
            credentials,
            accountName: accountName || '',
            connectedAt: new Date().toISOString(),
            usageCount: 0,
            lastUsedAt: '',
        };

        // Store under owners/{ownerId}/connectors/{connectorId}
        await db
            .collection(COLLECTIONS.OWNERS)
            .doc(OWNER_ID)
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
        // Now returns global user-level connectors
        const snap = await db
            .collection(COLLECTIONS.OWNERS)
            .doc(OWNER_ID)
            .collection(CONNECTORS_COLLECTION)
            .get();

        const connectors = snap.docs.map((d) => {
            const data = d.data() as StoredOwnerConnector;
            // Strip actual credentials from the response — only send metadata & stats
            return { 
                id: data.id, 
                connectedAt: data.connectedAt,
                accountName: data.accountName,
                usageCount: data.usageCount || 0,
                lastUsedAt: data.lastUsedAt || ''
            };
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
        const connectorId = searchParams.get('connectorId') as ConnectorId;

        if (!connectorId) {
            return NextResponse.json({ error: 'connectorId is required.' }, { status: 400 });
        }

        await db
            .collection(COLLECTIONS.OWNERS)
            .doc(OWNER_ID)
            .collection(CONNECTORS_COLLECTION)
            .doc(connectorId)
            .delete();

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Connectors DELETE]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
