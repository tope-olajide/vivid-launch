import { NextResponse } from "next/server";
import { db, COLLECTIONS } from "@/lib/gcp/firestore";
import { OWNER_ID } from "@/lib/owner";

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Basic validation
        if (!payload.name || !payload.description) {
            return NextResponse.json({ error: "Missing required fields: name, description" }, { status: 400 });
        }

        // We create a new document reference so we can return the ID
        const projectRef = db.collection(COLLECTIONS.PROJECTS).doc();

        const projectData = {
            ...payload,
            ownerId: OWNER_ID, // Inject unified ownerId
            createdAt: new Date().toISOString(),
            status: "draft"
        };

        await projectRef.set(projectData);

        return NextResponse.json({
            success: true,
            projectId: projectRef.id,
            data: projectData
        });

    } catch (error: any) {
        console.error("Error creating project:", error);
        return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        // Filter by OWNER_ID for future-proof multi-user support
        // We omit .orderBy('createdAt', 'desc') to avoid requiring a composite index in Firestore
        const snapshot = await db.collection(COLLECTIONS.PROJECTS)
            .where('ownerId', '==', OWNER_ID)
            .get();
            
        const projects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a: any, b: any) => {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        return NextResponse.json({ projects });
    } catch (error: any) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}
