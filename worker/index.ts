import * as path from 'path';
import * as fs from 'fs';
import ffmpeg = require('fluent-ffmpeg');
import * as dotenv from 'dotenv';
import { generateTTS } from './tts';
import fetch from 'node-fetch'; // need node-fetch v2 for commonjs or native fetch if node 18+
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);

const WORK_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(WORK_DIR)) {
    fs.mkdirSync(WORK_DIR, { recursive: true });
}

// Ensure native fetch is available
const fetchContent = typeof fetch === 'undefined' ? require('node-fetch') : fetch;

/**
 * Downloads a file from a URL to local disk.
 */
async function downloadFile(url: string, destPath: string) {
    const res = await fetchContent(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    
    // Convert ArrayBuffer to Buffer for fs writing
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(destPath, buffer);
    return destPath;
}

/**
 * Resolves an asset (from Gemini Scene) into a local file path ready for FFmpeg
 */
async function resolveAndDownloadAsset(source: string, assetId?: string, prompt?: string, duration?: number): Promise<string> {
    if (source === 'uploaded_asset' && assetId) {
        console.log(`📡 Fetching user uploaded asset: ${assetId}`);
        // Wait, realistically we need to query Firestore if we don't know the exact GCS path?
        // Let's assume the frontend sends us the signed URL or we get the exact GCS path in the document.
        // For right now, I'll bypass Firestore dependency crashes by throwing a temporary not-implemented error 
        // until we orchestrate the real Pub/Sub payload that will provide direct Storage URIs.
        throw new Error("Direct Firestore/GCS lookup not implemented in local standalone worker yet.");
    } 
    
    if (source === 'generate_image') {
        throw new Error("Imagen generation not implemented yet.");
    }

    if (source === 'stock_video') {
         throw new Error("Pixabay fetch not implemented yet.");
    }

    throw new Error(`Unsupported source: ${source}`);
}

/**
 * Helper to create a solid color fallback video if stock/imagen fails or is stubbed
 */
function createSolidColorVideo(outputPath: string, duration: number, color: string = 'black'): Promise<string> {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(`color=c=${color}:s=1920x1080`)
            .inputFormat('lavfi')
            .duration(duration)
            .output(outputPath)
            .on('end', (() => resolve(outputPath)) as any)
            .on('error', reject)
            .run();
    });
}

/**
 * Renders a single scene from the Gemini-generated JSON block.
 */
async function renderScene(scene: any, index: number): Promise<string> {
    console.log(`\n============================`);
    console.log(`🎬 Rendering Scene ${index + 1}...`);
    console.log(`============================`);

    const outputFileName = `scene_${index}.mp4`;
    const outputPath = path.join(WORK_DIR, outputFileName);

    // 1. Resolve and download Base Visual
    const baseVisualPath = await resolveAndDownloadAsset(
        scene.visual.base.source, 
        scene.visual.base.asset_id, 
        scene.visual.base.prompt,
        scene.duration
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
        complexFilters.push(`[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30[v1]`);

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
        let scenesData;
        
        if (campaignId.endsWith('.json')) {
            console.log(`Loading JSON payload from disk: ${campaignId}`);
            scenesData = JSON.parse(fs.readFileSync(campaignId, 'utf-8'));
        } else {
             throw new Error("Local test mode requires a .json file payload");
        }

        const renderedScenes: string[] = [];

        // Render each scene sequentially
        for (let i = 0; i < scenesData.length; i++) {
            const scenePath = await renderScene(scenesData[i], i);
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

            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(concatListPath)
                    .inputOptions(['-f concat', '-safe 0'])
                    .outputOptions('-c copy') // Fast copy since they are all identical formats
                    .output(finalOutputPath)
                    .on('end', () => {
                        console.log(`✅✅ SUCCESS! Final video saved to: ${finalOutputPath}`);
                        resolve(finalOutputPath);
                    })
                    .on('error', (err) => {
                        console.error("❌ Error merging final video:", err);
                        reject(err);
                    })
                    .run();
            });
        }

    } catch (err) {
        console.error("[Media Worker] Fatal Error:", err);
        process.exit(1);
    }
}

main();
