import * as path from 'path';
import * as dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function listFiles() {
    const storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL,
            private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
    });

    const bucketName = process.env.GCS_BUCKET_NAME || 'vividlaunch-assets';
    console.log(`Listing files in bucket: ${bucketName}`);

    try {
        const [files] = await storage.bucket(bucketName).getFiles({ maxResults: 50 });
        console.log(`Found ${files.length} files:`);
        files.forEach(f => console.log(` - ${f.name} (${f.metadata.size} bytes)`));

        const [cors] = await storage.bucket(bucketName).getMetadata();
        console.log('--- CORS CONFIG ---');
        console.log(JSON.stringify(cors.cors, null, 2));

    } catch (err: any) {
        console.error(`ERROR: ${err.message}`);
    }
}

listFiles();
