import { NextResponse } from "next/server";
import { db, COLLECTIONS } from "@/lib/gcp/firestore";
import { generateV4ReadSignedUrl } from "@/lib/gcp/storage";

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

        let query: any = db.collection(COLLECTIONS.ASSETS);

        if (projectId) {
            query = query.where('projectId', '==', projectId);
        }

        const snapshot = await query.get();
        let assets = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort in memory to avoid needing a composite index in Firestore
        assets.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA; // Descending
        });

        // Convert GCS Public URLs to temporary signed URLs for private bucket access
        const signedAssets = await Promise.all(assets.map(async (asset: any) => {
            if (asset.gcsUrl && (asset.type === 'image' || asset.type === 'video')) {
                try {
                    const signedUrl = await generateV4ReadSignedUrl(asset.gcsUrl);
                    return { ...asset, gcsUrl: signedUrl };
                } catch (err) {
                    console.error("Failed to sign URL for asset:", asset.id, err);
                    return asset;
                }
            }
            return asset;
        }));

        return NextResponse.json({ assets: signedAssets });
    } catch (error: any) {
        console.error("Error fetching assets:", error);
        return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
        }

        await db.collection(COLLECTIONS.ASSETS).doc(id).delete();

        return NextResponse.json({ success: true, message: "Asset deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting asset:", error);
        return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const payload = await req.json();
        const { id, ...updates } = payload;

        if (!id) {
            return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
        }

        await db.collection(COLLECTIONS.ASSETS).doc(id).update(updates);

        return NextResponse.json({ success: true, message: "Asset updated successfully" });
    } catch (error: any) {
        console.error("Error updating asset:", error);
        return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
    }
}
