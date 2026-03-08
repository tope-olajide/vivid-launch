import { NextResponse } from 'next/server';
import { storage, BUCKET_NAME } from '@/lib/gcp/storage';

export async function GET() {
    try {
        const corsConfiguration = [
            {
                // Allow our frontend origins
                origin: ['http://localhost:3000', 'https://vividlaunch.com'],
                // Allow typical upload methods
                method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                // These are required for signed URL PUT requests
                responseHeader: ['Content-Type', 'Authorization'],
                maxAgeSeconds: 3600
            }
        ];

        await storage.bucket(BUCKET_NAME).setCorsConfiguration(corsConfiguration);

        return NextResponse.json({
            success: true,
            message: `Successfully configured CORS for bucket: ${BUCKET_NAME}`,
            configuration: corsConfiguration
        });
    } catch (error: any) {
        console.error("Failed to configure bucket CORS:", error);
        return NextResponse.json({ error: error.message || "Failed to configure CORS" }, { status: 500 });
    }
}
