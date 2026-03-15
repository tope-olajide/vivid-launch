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
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
const ffmpeg = require("fluent-ffmpeg");
const mp3Duration = require('mp3-duration');
const tts_1 = require("./tts");
const assets_1 = require("./assets");
const { generateVeoVideo } = require("./assets");
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const GCP_PROJECT = process.env.GCP_PROJECT_ID;
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
async function resolveAndDownloadAsset(source, assetId, prompt, duration = 5, gcsUri, // Direct gs:// URI injected by the orchestrator payload
projectId) {
    // ── 1. User-uploaded asset ──────────────────────────────────────────────
    if (source === 'uploaded_asset') {
        // Prefer a direct gs:// URI passed in the payload; fall back to assetId
        const uri = gcsUri || assetId;
        if (!uri)
            throw new Error('uploaded_asset requires a gcsUri or assetId.');
        const ext = uri.includes('.mp4') ? 'mp4' : 'jpg';
        const dest = path.join(WORK_DIR, `uploaded_${Date.now()}.${ext}`);
        try {
            return await (0, assets_1.downloadFromGCS)(uri, dest);
        }
        catch (err) {
            if (err.message.includes('ASSET_NOT_FOUND')) {
                console.warn(`⚠️  Asset ${uri} not found in Firestore. Falling back to AI Generation...`);
                const fallbackPrompt = prompt || `cinematic scene about ${assetId || 'project'}`;
                const fallbackDest = path.join(WORK_DIR, `uploaded_fallback_${Date.now()}.jpg`);
                return await (0, assets_1.generateImagenImage)(fallbackPrompt, fallbackDest, projectId);
            }
            throw err;
        }
    }
    // ── 2. AI-generated image (Vertex AI Imagen) ────────────────────────────
    if (source === 'generate_image') {
        const imgPrompt = prompt || 'cinematic background';
        try {
            const dest = path.join(WORK_DIR, `imagen_${Date.now()}.jpg`);
            return await (0, assets_1.generateImagenImage)(imgPrompt, dest, projectId);
        }
        catch (err) {
            console.warn(`⚠️  Imagen fallback (${err.message}). Using solid-color clip.`);
            const fallbackDest = path.join(WORK_DIR, `fallback_${Date.now()}.mp4`);
            return await createSolidColorVideo(fallbackDest, duration, 'black');
        }
    }
    // ── 3. AI-generated video (Vertex AI Veo) ─────────────────────────────
    if (source === 'generate_video') {
        const videoPrompt = prompt || 'cinematic motion scene';
        try {
            const dest = path.join(WORK_DIR, `veo_${Date.now()}.mp4`);
            return await generateVeoVideo(videoPrompt, dest, projectId, duration);
        } catch (err) {
            console.warn(`⚠️  Veo fallback (${err.message}). Using solid-color clip.`);
            const fallbackDest = path.join(WORK_DIR, `fallback_veo_${Date.now()}.mp4`);
            return await createSolidColorVideo(fallbackDest, duration, 'black');
        }
    }
    throw new Error(`Unsupported visual source: "${source}"`);
}
/**
 * Helper to create a solid color fallback video using FFmpeg directly.
 * We'll generate it at 1920x1920 so it can be cropped perfectly to ANY aspect ratio
 * later in the compositor without letterboxing.
 */
function createSolidColorVideo(outputPath, duration, color = 'black') {
    return new Promise((resolve, reject) => {
        try {
            const ffmpegPath = require('ffmpeg-static');
            const { execSync } = require('child_process');
            const cmd = `"${ffmpegPath}" -y -f lavfi -i color=c=${color}:s=1920x1920 -t ${duration} -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outputPath}"`;
            execSync(cmd, { stdio: 'inherit' });
            resolve(outputPath);
        }
        catch (e) {
            reject(e);
        }
    });
}
/**
 * Renders a single scene from the Gemini-generated JSON block.
 */
async function renderScene(scene, index, aspectRatio = '16:9', projectId) {
    console.log(`\n============================`);
    console.log(`🎬 Rendering Scene ${index + 1}... [${aspectRatio}]`);
    console.log(`============================`);
    const outputFileName = `scene_${index}.mp4`;
    const outputPath = path.join(WORK_DIR, outputFileName);
    // 1. Resolve and download Base Visual
    const baseVisualPath = await resolveAndDownloadAsset(scene.visual.base.source, scene.visual.base.asset_id, scene.visual.base.prompt, scene.duration, scene.visual.base.gcs_uri, // orchestrator may pass gs:// URI directly
    projectId);
    // 2. Synthesize TTS
    const ttsFileName = `tts_${index}.mp3`;
    const ttsPath = path.join(WORK_DIR, ttsFileName);
    console.log(`🎙️ Synthesizing Voiceover: "${scene.voiceover.text}"`);
    const audioBuffer = await (0, tts_1.generateTTS)(scene.voiceover.text, scene.voiceover.tone);
    fs.writeFileSync(ttsPath, audioBuffer);
    // 2.5 Compute Audio Duration & Add Pacing
    const audioDuration = await mp3Duration(ttsPath);
    console.log(`⏱️ TTS Audio Length: ${audioDuration.toFixed(2)}s`);
    // Ensure scene is long enough for the audio + 0.8s padding to prevent clipping
    // Ensure scene is long enough for the audio + 2.5s padding to prevent clipping and give breathing room
    const actualDuration = Math.max((scene.duration || 5), audioDuration + 2.5);
    console.log(`⏱️ Final Scene Duration: ${actualDuration.toFixed(2)}s`);
    // 3. Setup FFmpeg Pipeline
    console.log(`⚙️ Running FFmpeg compositor directly via spawn...`);
    const { spawn } = require('child_process');
    const ffmpegPath = require('ffmpeg-static');
    return new Promise((resolve, reject) => {
        const complexFilters = [];
        // Determine dynamic resolution based on aspectRatio
        const [w, h] = aspectRatio === '9:16' ? [1080, 1920] : [1920, 1080];
        // --- Visual motion (Ken Burns / zoompan) ---
        let scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=30`;
        // If it's a generated image or uploaded image, we can apply motion
        const basePathLower = baseVisualPath.toLowerCase();
        const isImage = basePathLower.endsWith('.jpg') || basePathLower.endsWith('.png') || basePathLower.endsWith('.jpeg');
        if (isImage) {
            const motion = scene.camera_motion || 'zoom_in';
            // Scale up slightly first to give room for panning/zooming without black bars
            const bgW = Math.floor(w * 1.2);
            const bgH = Math.floor(h * 1.2);
            const frames = Math.ceil(actualDuration * 30);
            // Generate zooming/panning expressions
            let zExpr = '1';
            let xExpr = '0';
            let yExpr = '0';
            if (motion === 'zoom_in') {
                zExpr = 'min(zoom+0.0015,1.5)';
                xExpr = '(iw/2)-(iw/zoom/2)';
                yExpr = '(ih/2)-(ih/zoom/2)';
            }
            else if (motion === 'zoom_out') {
                zExpr = 'if(eq(on,1),1.5,max(1.0,zoom-0.0015))';
                xExpr = '(iw/2)-(iw/zoom/2)';
                yExpr = '(ih/2)-(ih/zoom/2)';
            }
            else if (motion === 'pan_right') {
                zExpr = '1.2';
                xExpr = `min((on-1)*((iw-iw/zoom)/${frames}),iw-iw/zoom)`;
                yExpr = '(ih/2)-(ih/zoom/2)';
            }
            else if (motion === 'pan_left') {
                zExpr = '1.2';
                xExpr = `max((iw-iw/zoom)-(on-1)*((iw-iw/zoom)/${frames}),0)`;
                yExpr = '(ih/2)-(ih/zoom/2)';
            }
            else if (motion === 'pan_up') {
                zExpr = '1.2';
                xExpr = '(iw/2)-(iw/zoom/2)';
                yExpr = `max((ih-ih/zoom)-(on-1)*((ih-ih/zoom)/${frames}),0)`;
            }
            else if (motion === 'pan_down') {
                zExpr = '1.2';
                xExpr = '(iw/2)-(iw/zoom/2)';
                yExpr = `min((on-1)*((ih-ih/zoom)/${frames}),ih-ih/zoom)`;
            }
            scaleFilter = `scale=${bgW}:${bgH}:force_original_aspect_ratio=increase,crop=${bgW}:${bgH},setsar=1,zoompan=z='${zExpr}':x='${xExpr}':y='${yExpr}':d=${frames}:s=${w}x${h}:fps=30`;
        }
        complexFilters.push(`[0:v]${scaleFilter}[v1]`);
        // --- Subtitles ---
        // Default to on if undefined, but respect explicit false
        const showSubtitles = scene.text_overlay?.subtitle_settings?.enabled !== false;
        if (showSubtitles && scene.text_overlay?.content) {
            const escapedText = scene.text_overlay.content.replace(/[^a-zA-Z0-9.\-?! ]/g, '');
            const subColor = scene.text_overlay?.subtitle_settings?.color || 'white';
            const subPos = scene.text_overlay?.subtitle_settings?.position || 'middle';
            let yPos = '(h-text_h)/2'; // middle
            if (subPos === 'top')
                yPos = 'h*0.15';
            else if (subPos === 'bottom')
                yPos = 'h*0.80';
            complexFilters.push(`[v1]drawtext=fontfile=C\\\\\\\\:/Windows/Fonts/arialbd.ttf: text='${escapedText}': fontcolor=${subColor}: fontsize=72: x=(w-text_w)/2: y=${yPos}: box=1: boxcolor=black@0.6: boxborderw=20[vOut]`);
        }
        else {
            complexFilters.push(`[v1]copy[vOut]`);
        }
        // --- Audio Pacing (Silence padding) ---
        // Pad audio out completely to match the actualDuration (capped by -t)
        complexFilters.push(`[1:a]apad[aOut]`);
        const inputArgsStart = [];
        inputArgsStart.push('-y');
        if (!isImage) {
            // Only loop indefinitely if the visual is a video. 
            // Setting loop for images breaks zoompan timeframe calculation.
            inputArgsStart.push('-stream_loop', '-1');
        }
        const args = [
            ...inputArgsStart,
            '-i', `"${baseVisualPath}"`,
            '-i', `"${ttsPath}"`,
            '-filter_complex', `"${complexFilters.join(';')}"`,
            '-map', '"[vOut]"',
            '-map', '"[aOut]"',
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-t', actualDuration.toString(),
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
        let payload;
        if (campaignId.endsWith('.json')) {
            console.log(`Loading JSON payload from disk: ${campaignId}`);
            payload = JSON.parse(fs.readFileSync(campaignId, 'utf-8'));
        }
        else {
            throw new Error("Local test mode requires a .json file payload");
        }
        const scenesData = Array.isArray(payload) ? payload : payload.scenes;
        const aspectRatio = payload.aspectRatio || '16:9';
        const projectId = payload.projectId;
        const renderedScenes = [];
        // Render each scene sequentially
        for (let i = 0; i < scenesData.length; i++) {
            const scenePath = await renderScene(scenesData[i], i, aspectRatio, projectId);
            // We need the ACTUAL duration for accurate xfade overlapping.
            // Executing ffprobe to get exact generated duration.
            const ffprobePath = require('ffprobe-static').path;
            const { execSync } = require('child_process');
            const durationOutput = execSync(`"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${scenePath}"`).toString();
            const actualSceneDuration = parseFloat(durationOutput.trim());
            renderedScenes.push({
                path: scenePath,
                duration: actualSceneDuration,
                transition: scenesData[i].transition || 'fade'
            });
        }
        console.log("\n=================================");
        console.log("🎬 All individual scenes rendered!");
        console.log("📝 Renders:", renderedScenes);
        console.log("=================================\n");
        const finalOutputPath = path.join(WORK_DIR, 'final_output.mp4');
        if (renderedScenes.length > 1) {
            console.log("⏳ Merging scenes with xfade transitions...");
            const ffmpegPath = require('ffmpeg-static');
            const { execSync } = require('child_process');
            let filterComplex = "";
            let inputArgs = [];
            let currentOffset = 0;
            const crossfadeDur = 1.0; // 1 second overlap for transitions
            // Map standard transition names to FFmpeg xfade types
            const getXfadeType = (name) => {
                const map = {
                    'fade': 'fade',
                    'wipe-right': 'wiperight',
                    'wipe-left': 'wipeleft',
                    'slide-up': 'slideup',
                    'slide-down': 'slidedown',
                    'dissolve': 'fade', // xfade covers dissolve smoothly
                    'cut': 'distance' // fallback
                };
                return map[name.toLowerCase()] || 'fade';
            };
            // 1. First, declare all inputs and normalize their timebases
            for (let i = 0; i < renderedScenes.length; i++) {
                inputArgs.push('-i', `"${renderedScenes[i].path}"`);
                // Normalizing timebase, framerate, audio sample rate, and resetting timestamps
                filterComplex += `[${i}:v]settb=1/90000,setpts=PTS-STARTPTS,fps=30[v_norm_${i}];`;
                filterComplex += `[${i}:a]asetpts=PTS-STARTPTS,aresample=44100[a_norm_${i}];`;
            }
            // 2. Build the xfade chain for video
            currentOffset = renderedScenes[0].duration;
            let audioDelays = [0];
            for (let i = 1; i < renderedScenes.length; i++) {
                const prevStreamV = i === 1 ? `[v_norm_0]` : `[v_out_${i - 1}]`;
                const nextStreamV = `[v_norm_${i}]`;
                const outStreamV = `[v_out_${i}]`;
                const xfadeMode = getXfadeType(renderedScenes[i - 1].transition);
                const offsetStart = Math.max(0.1, currentOffset - crossfadeDur);
                audioDelays.push(offsetStart);
                filterComplex += `${prevStreamV}${nextStreamV}xfade=transition=${xfadeMode}:duration=${crossfadeDur}:offset=${offsetStart}${outStreamV};`;
                // The new total length is old offset + new duration - overlap
                currentOffset = offsetStart + renderedScenes[i].duration;
            }
            // 3. Build precise amix for audio instead of crossfading to preserve full volume
            let audioMixInputs = '';
            for (let i = 0; i < renderedScenes.length; i++) {
                const delayMs = Math.floor(audioDelays[i] * 1000);
                filterComplex += `[a_norm_${i}]adelay=${delayMs}|${delayMs}[a_delayed_${i}];`;
                audioMixInputs += `[a_delayed_${i}]`;
            }
            filterComplex += `${audioMixInputs}amix=inputs=${renderedScenes.length}:dropout_transition=0:normalize=0[a_out];`;
            // Remove trailing semicolon
            filterComplex = filterComplex.replace(/;$/, '');
            const finalVStream = `[v_out_${renderedScenes.length - 1}]`;
            const finalAStream = `[a_out]`;
            const mergeCmd = `"${ffmpegPath}" -y ${inputArgs.join(' ')} -filter_complex "${filterComplex}" -map "${finalVStream}" -map "${finalAStream}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${finalOutputPath}"`;
            console.log('Merging command:', mergeCmd);
            execSync(mergeCmd, { stdio: 'inherit' });
            console.log(`✅✅ SUCCESS! Final video merged to: ${finalOutputPath}`);
        }
        else if (renderedScenes.length === 1) {
            console.log("🎬 Single scene detected. Copying to final output...");
            fs.copyFileSync(renderedScenes[0].path, finalOutputPath);
            console.log(`✅✅ SUCCESS! Final video saved to: ${finalOutputPath}`);
        }
        // ── Upload to GCS ──────────────────────────────────────────────────
        const outputGcsPath = process.env.GCS_OUTPUT_PATH;
        if (outputGcsPath && fs.existsSync(finalOutputPath)) {
            console.log(`⏳ Uploading final video for project context: ${outputGcsPath}`);
            const { Storage } = require('@google-cloud/storage');
            const storage = new Storage({
                projectId: GCP_PROJECT,
                credentials: {
                    client_email: process.env.GCP_CLIENT_EMAIL,
                    private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                },
            });
            const destBucket = process.env.GCS_BUCKET_NAME;
            const destObj = `${outputGcsPath}/final_output.mp4`;
            await storage.bucket(destBucket).upload(finalOutputPath, {
                destination: destObj,
                metadata: {
                    contentType: 'video/mp4',
                    cacheControl: 'public, max-age=3600',
                }
            });
            console.log(`☁️  Uploaded to gs://${destBucket}/${destObj}`);
        }
    }
    catch (err) {
        console.error("[Media Worker] Fatal Error:", err);
        process.exit(1);
    }
}
main();
