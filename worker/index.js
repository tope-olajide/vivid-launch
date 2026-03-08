"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ffmpeg = require("fluent-ffmpeg");
const dotenv = __importStar(require("dotenv"));
const tts_1 = require("./tts");
const node_fetch_1 = __importDefault(require("node-fetch")); // need node-fetch v2 for commonjs or native fetch if node 18+
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);
const WORK_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(WORK_DIR)) {
    fs.mkdirSync(WORK_DIR, { recursive: true });
}
// Ensure native fetch is available
const fetchContent = typeof node_fetch_1.default === 'undefined' ? require('node-fetch') : node_fetch_1.default;
/**
 * Downloads a file from a URL to local disk.
 */
async function downloadFile(url, destPath) {
    const res = await fetchContent(url);
    if (!res.ok)
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    // Convert ArrayBuffer to Buffer for fs writing
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    return destPath;
}
/**
 * Resolves an asset (from Gemini Scene) into a local file path ready for FFmpeg
 */
async function resolveAndDownloadAsset(source, assetId, prompt, duration) {
    if (source === 'uploaded_asset' && assetId) {
        // [STUB] Bypassing Firestore for local FFmpeg compositing test.
        console.log(`[STUB] Simulating fetch for asset ID: ${assetId}`);
        const dest = path.join(WORK_DIR, `${assetId}.mp4`);
        await createSolidColorVideo(dest, duration || 5, 'red'); // placeholder for user uploaded asset
        return dest;
    }
    if (source === 'generate_image') {
        // TODO: Call Vertex AI Imagen
        console.log(`[STUB] Would generate image for prompt: "${prompt}"`);
        // For now, return a placeholder black image
        const dest = path.join(WORK_DIR, `generated_${Date.now()}.jpg`);
        await createSolidColorVideo(dest, duration || 5, 'black');
        return dest;
    }
    if (source === 'stock_video') {
        // TODO: Call Pixabay 
        console.log(`[STUB] Would fetch stock video for prompt: "${prompt}"`);
        const dest = path.join(WORK_DIR, `stock_${Date.now()}.mp4`);
        await createSolidColorVideo(dest, duration || 5, 'blue');
        return dest;
    }
    throw new Error(`Unsupported source: ${source}`);
}
/**
 * Helper to create a solid color fallback video if stock/imagen fails or is stubbed
 */
function createSolidColorVideo(outputPath, duration, color = 'black') {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(`color=c=${color}:s=1920x1080`)
            .inputFormat('lavfi')
            .duration(duration)
            .output(outputPath)
            .on('end', (() => resolve(outputPath)))
            .on('error', reject)
            .run();
    });
}
/**
 * Renders a single scene from the Gemini-generated JSON block.
 */
async function renderScene(scene, index) {
    console.log(`\n============================`);
    console.log(`🎬 Rendering Scene ${index + 1}...`);
    console.log(`============================`);
    const outputFileName = `scene_${index}.mp4`;
    const outputPath = path.join(WORK_DIR, outputFileName);
    // 1. Resolve and download Base Visual
    const baseVisualPath = await resolveAndDownloadAsset(scene.visual.base.source, scene.visual.base.asset_id, scene.visual.base.prompt, scene.duration);
    // 2. Synthesize TTS
    const ttsFileName = `tts_${index}.mp3`;
    const ttsPath = path.join(WORK_DIR, ttsFileName);
    console.log(`🎙️ Synthesizing Voiceover: "${scene.voiceover.text}"`);
    const audioBuffer = await (0, tts_1.generateTTS)(scene.voiceover.text, scene.voiceover.tone);
    fs.writeFileSync(ttsPath, audioBuffer);
    // 3. Setup FFmpeg Pipeline
    console.log(`⚙️ Running FFmpeg compositor directly via spawn...`);
    const { spawn } = require('child_process');
    const ffmpegPath = require('ffmpeg-static');
    return new Promise((resolve, reject) => {
        const complexFilters = [];
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
        }
        catch (e) {
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
        }
        else {
            throw new Error("Local test mode requires a .json file payload");
        }
        const renderedScenes = [];
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
    }
    catch (err) {
        console.error("[Media Worker] Fatal Error:", err);
        process.exit(1);
    }
}
main();
