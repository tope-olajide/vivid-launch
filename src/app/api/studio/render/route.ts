/**
 * POST /api/studio/render
 *
 * Triggers the FFmpeg media worker to compose a final MP4 video from
 * the Gemini-generated scene data stored for a project.
 *
 * Request body: { projectId: string; scenes: Scene[] }
 *
 * The worker runs as a child process (locally) or can be dispatched
 * to Cloud Run / Cloud Tasks in production.
 *
 * Returns: { status: "queued" | "complete"; outputUrl?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// The worker entry point (compiled JS)
const WORKER_DIR    = path.resolve(process.cwd(), 'worker');
const WORKER_SCRIPT = path.join(WORKER_DIR, 'index.js');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, scenes } = body as { projectId: string; scenes: any[] };

        if (!projectId || !Array.isArray(scenes) || scenes.length === 0) {
            return NextResponse.json(
                { error: 'projectId and scenes[] are required.' },
                { status: 400 },
            );
        }

        // Write scenes to a temporary JSON payload file
        const payloadPath = path.join(os.tmpdir(), `vl_render_${projectId}_${Date.now()}.json`);
        fs.writeFileSync(payloadPath, JSON.stringify(scenes, null, 2));

        console.log(`[Render API] Dispatching worker for project ${projectId}`);
        console.log(`[Render API] Payload: ${payloadPath}`);

        // ── Local / development: run the worker inline as a child process ──────
        // In production replace this block with a Cloud Tasks enqueue call.
        const env = {
            ...process.env,
            // forward the GCS output path so the worker uploads to the right folder
            GCS_OUTPUT_PATH: `rendered_videos/${projectId}`,
        };

        const worker = spawn('node', [WORKER_SCRIPT, payloadPath], {
            cwd: WORKER_DIR,
            env,
            stdio: 'inherit',  // pipe stdout/stderr to Next.js server logs
            detached: false,
        });

        // Stream stderr back for debugging
        worker.on('error', (err) => {
            console.error('[Render Worker] Failed to start:', err);
        });

        // For local dev we await the process; for production return "queued" immediately
        const IS_PRODUCTION = process.env.NODE_ENV === 'production';

        if (!IS_PRODUCTION) {
            // Wait for the worker to finish (blocks the API response until done)
            await new Promise<void>((resolve, reject) => {
                worker.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Worker exited with code ${code}`));
                    }
                });
            });

            const outputGcsPath = `gs://${process.env.GCS_BUCKET_NAME}/rendered_videos/${projectId}/final_output.mp4`;
            return NextResponse.json({
                status: 'complete',
                outputGcsPath,
                message: 'Video rendered successfully.',
            });
        }

        // Production: return immediately, let the worker run in the background
        return NextResponse.json({
            status: 'queued',
            message: 'Video render job has been queued.',
        });

    } catch (err: any) {
        console.error('[Render API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
