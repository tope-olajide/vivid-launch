/**
 * POST /api/publish
 *
 * Publishes content to a connected platform.
 *
 * Body: PublishPayload (see types.ts)
 *
 * Flow:
 *  1. Load the connector credentials from Firestore
 *  2. Call the appropriate platform publisher
 *  3. Return the published URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/gcp/firestore';
import { publishWithConnector } from '@/lib/connectors/publishers';
import type { PublishPayload, StoredConnector } from '@/lib/connectors/types';

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as PublishPayload;
        const { projectId, connectorId } = payload;

        if (!projectId || !connectorId) {
            return NextResponse.json({ error: 'projectId and connectorId are required.' }, { status: 400 });
        }

        // Load credentials from Firestore
        const credSnap = await db
            .collection('projects')
            .doc(projectId)
            .collection('connectors')
            .doc(connectorId)
            .get();

        if (!credSnap.exists) {
            return NextResponse.json(
                { error: `Connector "${connectorId}" is not connected. Please connect it in the Connectors page first.` },
                { status: 404 },
            );
        }

        const storedConnector = credSnap.data() as StoredConnector;
        const credentials = storedConnector.credentials;

        console.log(`[Publish] Publishing to ${connectorId} for project ${projectId}`);

        const result = await publishWithConnector(connectorId, credentials, payload);

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('[Publish API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
