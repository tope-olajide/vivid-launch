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
const PIXABAY_KEY = process.env.PIXABAY_API_KEY!;

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
export async function downloadFromGCS(gcsUri: string, destPath: string): Promise<string> {
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

    // Parse gs://bucket/object style URIs
    if (gcsUri.startsWith('gs://')) {
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
// 2. Pixabay — Stock Video
// ──────────────────────────────────────────────

interface PixabayVideoHit {
    videos: { large: { url: string }; medium: { url: string }; small: { url: string } };
    duration: number;
    tags: string;
}

/**
 * Searches Pixabay for a stock video matching `prompt` and downloads the
 * best-fit clip (≥ requested duration) to `destPath`.
 */
export async function fetchPixabayVideo(prompt: string, durationSecs: number, destPath: string): Promise<string> {
    if (!PIXABAY_KEY) throw new Error('PIXABAY_API_KEY is not set in environment.');

    const q  = encodeURIComponent(prompt.slice(0, 100));
    const url = `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${q}&video_type=film&per_page=10&min_width=1280`;

    console.log(`🎥 Searching Pixabay for: "${prompt}"`);
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`Pixabay API error: ${res.status}`);

    const data = await res.json() as { hits: PixabayVideoHit[] };

    if (!data.hits || data.hits.length === 0) {
        throw new Error(`No Pixabay results for: "${prompt}"`);
    }

    // Prefer clips whose duration is at least as long as the scene
    const sorted = data.hits.sort((a: PixabayVideoHit, b: PixabayVideoHit) => {
        const aOk = a.duration >= durationSecs ? 1 : 0;
        const bOk = b.duration >= durationSecs ? 1 : 0;
        return bOk - aOk;
    });

    const best = sorted[0];
    const videoUrl = best.videos.large?.url || best.videos.medium?.url || best.videos.small?.url;
    if (!videoUrl) throw new Error('Pixabay returned no downloadable video URL.');

    console.log(`   ✅ Found clip (${best.duration}s): "${best.tags.split(',')[0].trim()}" → ${videoUrl}`);
    return await writeStream(videoUrl, destPath);
}

// ──────────────────────────────────────────────
// 3. Vertex AI Imagen — Generated Images
// ──────────────────────────────────────────────

/**
 * Calls Vertex AI Imagen 3 to generate a 1920×1080 image from `prompt`
 * and saves it as a JPEG to `destPath`.
 */
export async function generateImagenImage(prompt: string, destPath: string): Promise<string> {
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
    const location = process.env.GCP_LOCATION_ID || 'us-central1';

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    console.log(`🖼️  Vertex AI Imagen: "${prompt.slice(0, 80)}..."`);

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
    return destPath;
}
