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

        const snapshot = await db.collection(COLLECTIONS.PROJECTS)
            .doc(projectId)
            .collection('blogs')
            .get();

        const blogs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt || new Date(0).toISOString()
            };
        });

        // Sort in memory to avoid index error
        blogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ blogs });
    } catch (err: any) {
        console.error('[Blog History API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
