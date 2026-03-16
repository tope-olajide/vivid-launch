import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/gcp/firestore';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        if (!projectId) {
            return NextResponse.json({ error: 'ProjectId is required' }, { status: 400 });
        }

        const socialsSnapshot = await db
            .collection('socials')
            .where('projectId', '==', projectId)
            .get();

        const socials = socialsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt || new Date(0).toISOString() // Fallback for sorting
            };
        });

        // Sort in memory to avoid needing a Firestore composite index
        socials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ socials });
    } catch (error: any) {
        console.error('Error fetching social history:', error);
        return NextResponse.json({ error: 'Failed to fetch social history' }, { status: 500 });
    }
}
