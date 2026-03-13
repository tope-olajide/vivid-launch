import * as path from 'path';
import * as dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function fixCors() {
    const storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL,
            private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
    });

    const bucketName = process.env.GCS_BUCKET_NAME || 'vividlaunch-assets';
    console.log(`Setting CORS for bucket: ${bucketName}`);

    const cors = [
        {
            origin: ['*'], // Allow all during development/hackathon for convenience
            method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            responseHeader: ['Content-Type', 'Authorization', 'Content-Range', 'Accept-Ranges', 'Range'],
            maxAgeSeconds: 3600
        }
    ];

    try {
        await storage.bucket(bucketName).setCorsConfiguration(cors);
        console.log('✅ CORS configuration updated successfully.');
        
        const [metadata] = await storage.bucket(bucketName).getMetadata();
        console.log('Updated CORS:', JSON.stringify(metadata.cors, null, 2));

    } catch (err: any) {
        console.error(`ERROR: ${err.message}`);
    }
}

fixCors();
