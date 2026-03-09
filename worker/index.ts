import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import ffmpeg = require('fluent-ffmpeg');
import { generateTTS } from './tts';
import { downloadFromGCS, fetchPixabayVideo, generateImagenImage } from './assets';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const GCP_PROJECT = process.env.GCP_PROJECT_ID!;

const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);

const WORK_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(WORK_DIR)) {
    fs.mkdirSync(WORK_DIR, { recursive: true });
}



/**
 * Resolves an asset (from Gemini scene JSON) into a local file path
 * ready for FFmpeg ingestion.
 *
 * Sources:
 *  - uploaded_asset  → download directly from GCS using the stored URI
 *  - stock_video     → Pixabay API (falls back to solid-color clip)
 *  - generate_image  → Vertex AI Imagen 3 (falls back to solid-color clip)
 */
async function resolveAndDownloadAsset(
    source: string,
    assetId?: string,
    prompt?: string,
    duration: number = 5,
    gcsUri?: string,          // Direct gs:// URI injected by the orchestrator payload
): Promise<string> {

    // ── 1. User-uploaded asset ──────────────────────────────────────────────
    if (source === 'uploaded_asset') {
        // Prefer a direct gs:// URI passed in the payload; fall back to assetId
        const uri = gcsUri || assetId;
        if (!uri) throw new Error('uploaded_asset requires a gcsUri or assetId.');

        const ext  = uri.includes('.mp4') ? 'mp4' : 'jpg';
        const dest = path.join(WORK_DIR, `uploaded_${Date.now()}.${ext}`);
        return await downloadFromGCS(uri, dest);
    }

    // ── 2. Stock video (Pixabay) ────────────────────────────────────────────
    if (source === 'stock_video') {
        const searchPrompt = prompt || 'cinematic footage';
        const dest = path.join(WORK_DIR, `stock_${Date.now()}.mp4`);
        try {
            return await fetchPixabayVideo(searchPrompt, duration, dest);
        } catch (err: any) {
            console.warn(`⚠️  Pixabay fallback (${err.message}). Using solid-color clip.`);
            // Assuming we pass aspectRatio to resolveAndDownloadAsset if needed, 
            // but we can default this fallback and scale it correctly in the compositor
            return await createSolidColorVideo(dest, duration, 'darkblue');
        }
    }

    // ── 3. AI-generated image (Vertex AI Imagen) ────────────────────────────
    if (source === 'generate_image') {
        const imgPrompt = prompt || 'cinematic background';
        const dest = path.join(WORK_DIR, `imagen_${Date.now()}.jpg`);
        try {
            return await generateImagenImage(imgPrompt, dest);
        } catch (err: any) {
            console.warn(`⚠️  Imagen fallback (${err.message}). Using solid-color clip.`);
            return await createSolidColorVideo(dest, duration, 'black');
        }
    }

    throw new Error(`Unsupported visual source: "${source}"`);
}


/**
 * Helper to create a solid color fallback video using FFmpeg directly.
 * We'll generate it at 1920x1920 so it can be cropped perfectly to ANY aspect ratio
 * later in the compositor without letterboxing.
 */
function createSolidColorVideo(outputPath: string, duration: number, color: string = 'black'): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const ffmpegPath = require('ffmpeg-static');
            const { execSync } = require('child_process');
            const cmd = `"${ffmpegPath}" -y -f lavfi -i color=c=${color}:s=1920x1920 -t ${duration} -c:v libx264 -pix_fmt yuv420p "${outputPath}"`;
            execSync(cmd, { stdio: 'inherit' });
            resolve(outputPath);
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Renders a single scene from the Gemini-generated JSON block.
 */
async function renderScene(scene: any, index: number, aspectRatio: string = '16:9'): Promise<string> {
    console.log(`\n============================`);
    console.log(`🎬 Rendering Scene ${index + 1}... [${aspectRatio}]`);
    console.log(`============================`);

    const outputFileName = `scene_${index}.mp4`;
    const outputPath = path.join(WORK_DIR, outputFileName);

    // 1. Resolve and download Base Visual
    const baseVisualPath = await resolveAndDownloadAsset(
        scene.visual.base.source,
        scene.visual.base.asset_id,
        scene.visual.base.prompt,
        scene.duration,
        scene.visual.base.gcs_uri, // orchestrator may pass gs:// URI directly
    );

    // 2. Synthesize TTS
    const ttsFileName = `tts_${index}.mp3`;
    const ttsPath = path.join(WORK_DIR, ttsFileName);
    console.log(`🎙️ Synthesizing Voiceover: "${scene.voiceover.text}"`);
    const audioBuffer = await generateTTS(scene.voiceover.text, scene.voiceover.tone);
    fs.writeFileSync(ttsPath, audioBuffer);

    // 3. Setup FFmpeg Pipeline
    console.log(`⚙️ Running FFmpeg compositor directly via spawn...`);
    const { spawn } = require('child_process');
    const ffmpegPath = require('ffmpeg-static');

    return new Promise((resolve, reject) => {
        const complexFilters: string[] = [];
        
        // Determine dynamic resolution based on aspectRatio
        const [w, h] = aspectRatio === '9:16' ? [1080, 1920] : [1920, 1080];
        
        complexFilters.push(`[0:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=30[v1]`);

        const escapedText = scene.text_overlay.content.replace(/[^a-zA-Z0-9 ]/g, '');
        // Windows CMD quoting is extremely picky. 
        // We push the raw un-quoted filter component here, and we'll quote the whole -filter_complex block in the cmd string.
        complexFilters.push(`[v1]drawtext=fontfile=C\\\\\\\\:/Windows/Fonts/arial.ttf: text='${escapedText}': fontcolor=white: fontsize=84: x=(w-text_w)/2: y=(h-text_h)/2: box=1: boxcolor=black@0.5: boxborderw=20[v2]`);

        // Use v2 as final output
        const args = [
            '-y',
            '-stream_loop', '-1',
            '-i', `"${baseVisualPath}"`,
            '-i', `"${ttsPath}"`,
            '-filter_complex', `"${complexFilters.join(';')}"`,
            '-map', '"[v2]"',
            '-map', '1:a',
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-t', scene.duration.toString(),
            `"${outputPath}"`
        ];

        console.log('FFmpeg Execution Args:', args.join(' '));
        console.log('FFmpeg Path:', ffmpegPath);

        try {
            const cmd = `"${ffmpegPath}" ${args.join(' ')}`;
            console.log("Executing via execSync:", cmd);
            
            const { execSync } = require('child_process');
            execSync(cmd, { stdio: 'inherit' });
            
            console.log(`✅ Scene ${index + 1} rendered successfully -> ${outputPath}`);
            resolve(outputPath);
        } catch (e: any) {
            console.error(`❌ FFmpeg Error rendering Scene ${index + 1}:`, e.message);
            reject(e);
        }
    });
}

/**
 * Main Worker Entry Point
 */
async function main() {
    const campaignId = process.argv[2];
    if (!campaignId) {
        console.error("Usage: ts-node index.ts <campaignId>");
        process.exit(1);
    }
    
    console.log(`[Media Worker] Starting job for Campaign ${campaignId}...`);
    console.log(`[Media Worker] Workspace: ${WORK_DIR}`);

    try {
        // NOTE: For local testing, we might not have a campaign ID yet if the frontend isn't saving it.
        // We will pass the raw JSON file path instead for debugging.
        let payload;
        
        if (campaignId.endsWith('.json')) {
            console.log(`Loading JSON payload from disk: ${campaignId}`);
            payload = JSON.parse(fs.readFileSync(campaignId, 'utf-8'));
        } else {
             throw new Error("Local test mode requires a .json file payload");
        }

        const scenesData = Array.isArray(payload) ? payload : payload.scenes;
        const aspectRatio = payload.aspectRatio || '16:9';

        const renderedScenes: string[] = [];

        // Render each scene sequentially
        for (let i = 0; i < scenesData.length; i++) {
            const scenePath = await renderScene(scenesData[i], i, aspectRatio);
            renderedScenes.push(scenePath);
        }

        console.log("\n=================================");
        console.log("🎬 All individual scenes rendered!");
        console.log("📝 Renders:", renderedScenes);
        console.log("=================================\n");

        if (renderedScenes.length > 1) {
            console.log("⏳ Merging scenes into final video...");
            const finalOutputPath = path.join(WORK_DIR, 'final_output.mp4');
            
            // Create concat input file
            const concatListPath = path.join(WORK_DIR, 'concat.txt');
            const concatListContent = renderedScenes.map(file => `file '${path.basename(file)}'`).join('\n');
            fs.writeFileSync(concatListPath, concatListContent);

            // Merge via execSync — reliable on all platforms
            const ffmpegPath = require('ffmpeg-static');
            const { execSync } = require('child_process');
            const mergeCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalOutputPath}"`;
            console.log('Merging command:', mergeCmd);
            execSync(mergeCmd, { stdio: 'inherit' });
            console.log(`✅✅ SUCCESS! Final video saved to: ${finalOutputPath}`);

            // Upload to GCS if a project ID is set
            const outputGcsPath = process.env.GCS_OUTPUT_PATH;
            if (outputGcsPath) {
                const { Storage } = require('@google-cloud/storage');
                const storage = new Storage({
                    projectId: GCP_PROJECT,
                    credentials: {
                        client_email: process.env.GCP_CLIENT_EMAIL!,
                        private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                    },
                });
                const destBucket = process.env.GCS_BUCKET_NAME!;
                const destObj    = `${outputGcsPath}/final_output.mp4`;
                await storage.bucket(destBucket).upload(finalOutputPath, { destination: destObj });
                console.log(`☁️  Uploaded to gs://${destBucket}/${destObj}`);
            }
        }

    } catch (err) {
        console.error("[Media Worker] Fatal Error:", err);
        process.exit(1);
    }
}

main();
