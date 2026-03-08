import { NextResponse } from "next/server";
import { db, COLLECTIONS } from "@/lib/gcp/firestore";

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Basic validation
        if (!payload.projectId || !payload.gcsUrl || !payload.type) {
            return NextResponse.json(
                { error: "Missing required fields: projectId, gcsUrl, type" },
                { status: 400 }
            );
        }

        const assetRef = db.collection(COLLECTIONS.ASSETS).doc();

        const assetData = {
            ...payload,
            createdAt: new Date().toISOString(),
            status: "ready"
        };

        await assetRef.set(assetData);

        return NextResponse.json({
            success: true,
            assetId: assetRef.id,
            data: assetData
        });

    } catch (error: any) {
        console.error("Error saving asset:", error);
        return NextResponse.json({ error: error.message || "Failed to save asset" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        let query: any = db.collection(COLLECTIONS.ASSETS).orderBy('createdAt', 'desc');

        if (projectId) {
            query = query.where('projectId', '==', projectId);
        }

        const snapshot = await query.get();
        const assets = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ assets });
    } catch (error: any) {
        console.error("Error fetching assets:", error);
        return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }
}
