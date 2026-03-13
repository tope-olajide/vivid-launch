import { NextRequest, NextResponse } from "next/server";
import { db, COLLECTIONS } from "@/lib/gcp/firestore";
import { generateV4ReadSignedUrl } from "@/lib/gcp/storage";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        const doc = await db.collection(COLLECTIONS.PROJECTS).doc(projectId).get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const data = doc.data() as any;
        
        // If there's a stored video path, generate a fresh signed URL
        let signedVideoUrl = null;
        if (data.lastRenderedVideoGcsPath) {
            try {
                signedVideoUrl = await generateV4ReadSignedUrl(data.lastRenderedVideoGcsPath);
            } catch (err) {
                console.error("Error signing stored video URL:", err);
            }
        }

        return NextResponse.json({ 
            project: {
                id: doc.id,
                ...data,
                signedVideoUrl
            }
        });
    } catch (error: any) {
        console.error("Error fetching project:", error);
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        await db.collection(COLLECTIONS.PROJECTS).doc(projectId).delete();

        return NextResponse.json({ success: true, message: "Project deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting project:", error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        await db.collection(COLLECTIONS.PROJECTS).doc(projectId).update({
            ...body,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating project:", error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}
