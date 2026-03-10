"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Sparkles, Play, Settings2, Layers, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditableSceneBlock, type SceneData } from "@/components/studio/EditableSceneBlock";

// Schema must exactly match the backend to parse the stream
const sceneBlockSchema = z.object({
    scenes: z.array(z.object({
        scene_id: z.number(),
        duration: z.number(),
        transition: z.string(),
        music_style: z.string(),
        scene_emotion: z.string(),
        camera_motion: z.string(),
        bpm_suggestion: z.number(),
        voiceover: z.object({
            text: z.string(),
            tone: z.string(),
            pace: z.string()
        }),
        text_overlay: z.object({
            content: z.string(),
            animation: z.string(),
            subtitle_style: z.string()
        }),
        visual: z.object({
            base: z.object({
                source: z.string(),
                asset_id: z.string().optional(),
                prompt: z.string().optional(),
                start_time_seconds: z.number().optional(),
                end_time_seconds: z.number().optional()
            }),
            overlay: z.object({
                source: z.string(),
                prompt: z.string().optional()
            }).optional()
        })
    }))
});

function VideoStudioContent() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId");
    const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
    const [isRendering, setIsRendering] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [localScenes, setLocalScenes] = useState<SceneData[]>([]);
    const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

    const { object, submit, isLoading, error } = useObject({
        api: "/api/studio/generate",
        schema: sceneBlockSchema,
        onFinish: (result) => {
            if (result.error) {
                console.error(result.error);
                toast.error("Generation failed. Please try again.");
            } else {
                toast.success("Storyboard generation complete!");
            }
        },
        onError: (err) => {
            console.error(err);
            toast.error("Generation failed. Please try again.");
        }
    });

    const handleGenerate = () => {
        if (!projectId) { toast.error("No project selected."); return; }
        setVideoUrl(null);
        setLocalScenes([]);
        submit({ projectId, prompt: "Generate a high-impact promotional video storyboard." });
    };

    // Sync streaming output → local editable state once generation settles
    useEffect(() => {
        if (object?.scenes?.length) {
            setLocalScenes(object.scenes as SceneData[]);
        }
    }, [object?.scenes]);

    // ── Scene Handlers ──────────────────────────────────────────
    const handleSceneChange = (idx: number, updated: SceneData) => {
        setLocalScenes((prev) => prev.map((s, i) => (i === idx ? updated : s)));
    };

    const handleSceneDelete = (idx: number) => {
        setLocalScenes((prev) => prev.filter((_, i) => i !== idx));
        toast.success("Scene removed.");
    };

    const handleMoveUp = (idx: number) => {
        if (idx === 0) return;
        setLocalScenes((prev) => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    };

    const handleMoveDown = (idx: number) => {
        setLocalScenes((prev) => {
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    };

    const handleRegenerate = async (idx: number, scene: SceneData) => {
        setRegeneratingIdx(idx);
        try {
            const res = await fetch("/api/studio/variants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, prompt: `Regenerate only scene ${idx + 1}: ${scene.text_overlay?.content}` }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const newScene: SceneData = data.variantA?.[0] || scene;
            setLocalScenes((prev) => prev.map((s, i) => (i === idx ? { ...newScene, scene_id: scene.scene_id } : s)));
            toast.success(`Scene ${idx + 1} regenerated!`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setRegeneratingIdx(null);
        }
    };

    const handleRender = async () => {
        if (!projectId || !object?.scenes?.length) {
            toast.error("Generate a storyboard first.");
            return;
        }
        try {
            setIsRendering(true);
            toast.info("Rendering video... this may take a few minutes.");

            const res = await fetch("/api/studio/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, aspectRatio, scenes: localScenes }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Render failed");

            if (data.outputGcsPath) {
                setVideoUrl(data.outputGcsPath);
                toast.success("Video rendered! Check your GCS bucket.");
            } else {
                toast.success("Video render queued successfully.");
            }
        } catch (err: any) {
            toast.error(err.message || "Render failed.");
        } finally {
            setIsRendering(false);
        }
    };

    const scenes = localScenes;

    return (
        <motion.div
            className="p-6 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Video Studio</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate promo videos powered by Gemini&apos;s Creative Director
                    </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Gemini Interleaved Output
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Project selector & controls */}
                <div className="space-y-4">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">Generation Settings</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Select a project to generate a promo video. The AI will use your assets, brand voice,
                                and campaign settings to create a full storyboard.
                            </p>
                            <Button
                                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                                onClick={handleGenerate}
                                disabled={isLoading || !projectId}
                            >
                                <Sparkles className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? "Generating..." : "Generate Storyboard"}
                            </Button>

                            {/* Render button — enabled once scenes are ready */}
                            <Button
                                variant="outline"
                                className="w-full border-violet-500/40 hover:bg-violet-500/10 text-violet-400"
                                onClick={handleRender}
                                disabled={isRendering || isLoading || !object?.scenes?.length}
                            >
                                <Video className={`mr-2 h-4 w-4 ${isRendering ? 'animate-pulse' : ''}`} />
                                {isRendering ? "Rendering video..." : "Render Video"}
                            </Button>

                            {videoUrl && (
                                <p className="text-xs text-muted-foreground break-all">
                                    <Download className="inline h-3 w-3 mr-1" />
                                    Output: <span className="text-violet-400">{videoUrl}</span>
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">Scene Blocks</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Scene blocks will appear here after generation. Edit text, swap assets, or regenerate individual scenes.
                            </p>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 pb-10">
                                <AnimatePresence>
                                    {scenes.length === 0 && !isLoading && (
                                        <div className="h-48 rounded-lg border border-dashed border-border/50 flex flex-col items-center justify-center text-center p-4">
                                            <Layers className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                            <span className="text-sm text-muted-foreground">No scenes generated yet.<br />Click Generate to start the AI Director.</span>
                                        </div>
                                    )}
                                    {scenes.map((scene, i) => (
                                        <EditableSceneBlock
                                            key={i}
                                            scene={scene}
                                            index={i}
                                            isRegenerating={regeneratingIdx === i}
                                            onChange={handleSceneChange}
                                            onRegenerate={handleRegenerate}
                                            onDelete={handleSceneDelete}
                                            onMoveUp={handleMoveUp}
                                            onMoveDown={handleMoveDown}
                                            isFirst={i === 0}
                                            isLast={i === scenes.length - 1}
                                        />
                                    ))}
                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-dashed border-border/50 flex justify-center"
                                        >
                                            <Sparkles className="h-5 w-5 animate-pulse text-violet-500" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center: Preview / Live Stream Panel */}
                <div className="lg:col-span-2">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
                        <CardContent className="p-5 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm">Live Preview</h3>
                                </div>
                                <div className="flex gap-2 bg-black/10 dark:bg-white/10 p-1 rounded-md">
                                    <button
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${aspectRatio === "16:9" ? "bg-background shadow font-bold" : "text-muted-foreground hover:text-foreground"}`}
                                        onClick={() => setAspectRatio("16:9")}
                                    >
                                        16:9
                                    </button>
                                    <button
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${aspectRatio === "9:16" ? "bg-background shadow font-bold" : "text-muted-foreground hover:text-foreground"}`}
                                        onClick={() => setAspectRatio("9:16")}
                                    >
                                        9:16
                                    </button>
                                </div>
                            </div>
                            <div className={`flex-1 min-h-[400px] rounded-xl bg-black/5 dark:bg-white/5 border border-border/30 flex items-center justify-center transition-all duration-500 ${aspectRatio === "9:16" ? "mx-auto max-w-[300px] aspect-[9/16]" : "w-full aspect-video"}`}>
                                <div className="text-center space-y-3">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
                                        <Play className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Video Preview</p>
                                        <p className="text-sm text-muted-foreground">
                                            Generate a storyboard to see the live preview
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}

export default function VideoStudioPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Studio...</div>}>
            <VideoStudioContent />
        </Suspense>
    );
}
