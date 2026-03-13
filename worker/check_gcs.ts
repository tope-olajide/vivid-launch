import * as path from 'path';
import * as dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkFile() {
    const storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL,
            private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
    });

    const bucketName = process.env.GCS_BUCKET_NAME || 'vividlaunch-assets';
    const projectId = 'RjulA1CihZ5Oxrf163GK';
    const filePath = `rendered_videos/${projectId}/final_output.mp4`;

    console.log(`--- GCS DIAGNOSTIC ---`);
    console.log(`ENV GCS_BUCKET_NAME: ${process.env.GCS_BUCKET_NAME}`);
    console.log(`Using Bucket: ${bucketName}`);
    console.log(`Target Path: ${filePath}`);

    try {
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.file(filePath).exists();
        console.log(`FILE_EXISTS: ${exists}`);
        
        if (exists) {
            const [metadata] = await bucket.file(filePath).getMetadata();
            console.log(`CONTENT_TYPE: ${metadata.contentType}`);
            console.log(`SIZE: ${metadata.size} bytes`);
        }

        const [bucketMetadata] = await bucket.getMetadata();
        console.log(`BUCKET_CORS: ${JSON.stringify(bucketMetadata.cors || [], null, 2)}`);

        // Check if there are other files in that directory
        const [files] = await bucket.getFiles({ prefix: `rendered_videos/${projectId}/` });
        console.log(`FILES_IN_FOLDER: ${files.map(f => f.name).join(', ')}`);

    } catch (err: any) {
        console.error(`ERROR: ${err.message}`);
    }
    console.log(`--- END DIAGNOSTIC ---`);
}

checkFile();
