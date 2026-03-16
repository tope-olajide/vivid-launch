/**
 * assets.ts
 * Resolves scene visual assets into local file paths for FFmpeg composition.
 *
 * Supported sources:
 *  - uploaded_asset  → Direct GCS download via the file's gs:// URI
 *  - stock_video     → Pixabay Video API search (first relevant result)
 *  - generate_image  → Vertex AI Imagen 3 (text-to-image)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const fetch = require('node-fetch');

// ──────────────────────────────────────────────
// Config (loaded from .env.local via index.ts)
// ──────────────────────────────────────────────
const GCS_BUCKET  = process.env.GCS_BUCKET_NAME!;
const GCP_PROJECT = process.env.GCP_PROJECT_ID!;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Write a buffer or readable to a local path. */
async function writeStream(url: string, destPath: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed [${res.status}] ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    return destPath;
}

// ──────────────────────────────────────────────
// 1. GCS — Uploaded Assets
// ──────────────────────────────────────────────

/**
 * Downloads a file from GCS using the service-account credentials in the
 * environment.  `gcsUri` can be either:
 *   • a full `gs://bucket/path/to/file` URI, or
 *   • just the object path (bucket comes from GCS_BUCKET_NAME).
 */
export async function downloadFromGCS(gcsUri: string, destPath: string, projectId?: string): Promise<string> {
    // Resolve the gs:// URI → public/signed URL via `gcloud` CLI or
    // the @google-cloud/storage SDK (both available in the worker env).
    const { Storage } = require('@google-cloud/storage');

    const credentials = {
        projectId: GCP_PROJECT,
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL!,
            private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
    };

    const storage = new Storage(credentials);

    let bucketName = GCS_BUCKET;
    let objectPath  = gcsUri;

    // If it's a short alphanumeric ID (no slashes), it's likely a Firestore asset_id or filename
    if (!gcsUri.startsWith('gs://') && !gcsUri.includes('/')) {
        console.log(`🔍 Resolving asset_id: ${gcsUri} via Firestore...`);
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore(credentials);
        
        // 1. Try direct Document ID lookup
        let doc = await db.collection('assets').doc(gcsUri).get();
        let data = doc.exists ? doc.data() : null;

        // 2. If not found, try querying by 'name' or 'filename'
        if (!data) {
            console.log(`   ↳ Doc ID lookup failed. Trying query by name/filename...`);
            
            // Try query with projectId filter first
            if (projectId) {
                const snap = await db.collection('assets')
                    .where('projectId', '==', projectId)
                    .get();
                
                const found = snap.docs.find((d: any) => {
                    const dData = d.data();
                    return dData.name === gcsUri || dData.filename === gcsUri || dData.assetId === gcsUri;
                });

                if (found) {
                    data = found.data();
                    console.log(`   ↳ Found via projectId query: ${found.id}`);
                }
            }

            // 3. Last ditch: query everything if still not found (handles missing projectId in payload)
            if (!data) {
                console.log(`   ↳ Still not found. Trying broad query...`);
                const broadSnap = await db.collection('assets').get();
                const broadFound = broadSnap.docs.find((d: any) => {
                    const dData = d.data();
                    return dData.name === gcsUri || dData.filename === gcsUri || dData.assetId === gcsUri;
                });

                if (broadFound) {
                    data = broadFound.data();
                    console.log(`   ↳ Found via broad query: ${broadFound.id}`);
                }
            }
        }

        if (!data) {
            throw new Error(`ASSET_NOT_FOUND: ${gcsUri}`);
        }

        if (data.gcsUrl) {
            gcsUri = data.gcsUrl;
            console.log(`   ↳ Resolved to: ${gcsUri}`);
        } else {
            throw new Error(`ASSET_DOC_INVALID: ${gcsUri}`);
        }
    }

    // Parse https://storage.googleapis.com/bucket/object or gs://bucket/object
    if (gcsUri.startsWith('https://storage.googleapis.com/')) {
        const withoutDomain = gcsUri.replace('https://storage.googleapis.com/', '');
        const slashIdx = withoutDomain.indexOf('/');
        bucketName = withoutDomain.slice(0, slashIdx);
        objectPath = decodeURIComponent(withoutDomain.slice(slashIdx + 1));
    } else if (gcsUri.startsWith('gs://')) {
        const withoutScheme = gcsUri.slice(5);
        const slashIdx = withoutScheme.indexOf('/');
        bucketName = withoutScheme.slice(0, slashIdx);
        objectPath  = withoutScheme.slice(slashIdx + 1);
    }

    console.log(`📥 GCS download: gs://${bucketName}/${objectPath} → ${destPath}`);
    await storage.bucket(bucketName).file(objectPath).download({ destination: destPath });
    return destPath;
}

// ──────────────────────────────────────────────
// 2. Vertex AI Imagen — Generated Images
// ──────────────────────────────────────────────

/**
 * Calls Vertex AI Imagen 3 to generate a 1920×1080 image from `prompt`
 * and saves it as a JPEG to `destPath`.
 */
export async function generateImagenImage(prompt: string, destPath: string, projectId?: string): Promise<string> {
    if (!GCP_PROJECT) throw new Error('GCP_PROJECT_ID is not set in environment.');

    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL!,
            private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client  = await auth.getClient();
    const token   = (await client.getAccessToken()).token;
    
    // Use 'us-central1' for Imagen 3 Stable. Stable models are regional.
    const location = 'us-central1';

    // Stable Imagen 3 Model ID as recommended by the user
    const IMAGEN_MODEL = "imagen-3.0-generate-002";
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${location}/publishers/google/models/${IMAGEN_MODEL}:predict`;

    console.log(`DEBUG: Calling Imagen 3 Stable at: ${endpoint}`);
    console.log(`🖼️  Vertex AI Image Generation (Imagen 3 Stable): "${prompt.slice(0, 80)}..."`);

    const body = {
        instances: [{ prompt }],
        parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
            outputOptions: { mimeType: 'image/jpeg' },
        },
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Imagen API error [${response.status}]: ${err}`);
    }

    const result = await response.json() as any;
    const b64    = result?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error('Imagen returned no image data.');
    
    fs.writeFileSync(destPath, Buffer.from(b64, 'base64'));
    console.log(`   ✅ Generated image saved to ${destPath}`);

    // If projectId is provided, let's also silently upload this to GCS and save it to the Asset Library
    if (projectId) {
        try {
            console.log(`   🗃️ Saving Generated Image to Asset Library...`);
            const { Storage } = require('@google-cloud/storage');
            const { Firestore } = require('@google-cloud/firestore');
            
            const gcsDest = `projects/${projectId}/generated_${Date.now()}.jpg`;
            const commonCredentials = {
                projectId: GCP_PROJECT,
                credentials: {
                    client_email: process.env.GCP_CLIENT_EMAIL!,
                    private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                },
            };
            const storage = new Storage(commonCredentials);
            await storage.bucket(GCS_BUCKET).upload(destPath, {
                destination: gcsDest,
                metadata: { contentType: 'image/jpeg' }
            });
            
            const db = new Firestore(commonCredentials);
            
            const gcsUrl = `gs://${GCS_BUCKET}/${gcsDest}`;
            await db.collection('assets').add({
                projectId,
                type: 'image',
                source: 'imagen',
                prompt: prompt,
                gcsUrl: gcsUrl,
                status: 'ready',
                createdAt: new Date().toISOString()
            });
            console.log(`   ✅ Image added to Asset Library`);
        } catch (e: any) {
             console.warn(`   ⚠️ Could not save to Asset Library:`, e.message);
        }
    }

    return destPath;
}

/**
 * Calls Vertex AI Veo 3.1 to generate a video clip.
 */
export async function generateVeoVideo(prompt: string, destPath: string, duration: number = 5): Promise<string> {
    if (!GCP_PROJECT) throw new Error('GCP_PROJECT_ID is not set in environment.');

    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL!,
            private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client  = await auth.getClient();
    const token   = (await client.getAccessToken()).token;
    
    const location = 'global';
    const VEO_MODEL = "veo-3.1-generate-preview";
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${location}/publishers/google/models/${VEO_MODEL}:predict`;

    console.log(`🎬 Vertex AI Video Generation (Veo 3.1 Preview): "${prompt.slice(0, 80)}..."`);

    const body = {
        instances: [{ prompt }],
        parameters: {
            sampleCount: 1,
            durationSeconds: Math.min(Math.max(duration, 5), 10), // Veo 3.1 typical limits
            aspectRatio: '16:9',
        },
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Veo API error [${response.status}]: ${err}`);
    }

    const result = await response.json() as any;
    const b64    = result?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error('Veo returned no video data.');
    
    fs.writeFileSync(destPath, Buffer.from(b64, 'base64'));
    console.log(`   ✅ Generated video saved to ${destPath}`);

    return destPath;
}
