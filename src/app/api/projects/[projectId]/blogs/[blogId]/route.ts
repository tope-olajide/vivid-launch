import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/gcp/firestore';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string; blogId: string }> }
) {
    try {
        const { projectId, blogId } = await params;

        if (!projectId || !blogId) {
            return NextResponse.json({ error: 'ProjectId and BlogId are required' }, { status: 400 });
        }

        await db.collection(COLLECTIONS.PROJECTS)
            .doc(projectId)
            .collection('blogs')
            .doc(blogId)
            .delete();

        return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
    } catch (err: any) {
        console.error('[Blog Delete API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
