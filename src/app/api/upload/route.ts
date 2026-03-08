import { NextResponse } from "next/server";
import { generateV4UploadSignedUrl } from "@/lib/gcp/storage";

export async function POST(req: Request) {
    try {
        const { fileName, contentType, projectId } = await req.json();

        if (!fileName || !contentType || !projectId) {
            return NextResponse.json(
                { error: "Missing required fields: fileName, contentType, projectId" },
                { status: 400 }
            );
        }

        const data = await generateV4UploadSignedUrl(fileName, contentType, projectId);

        return NextResponse.json({ success: true, ...data });
    } catch (error: any) {
        console.error("Error generating signed URL:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate signed URL" },
            { status: 500 }
        );
    }
}
