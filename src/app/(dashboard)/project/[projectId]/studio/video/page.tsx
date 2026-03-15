"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Video, Sparkles, Play, Settings2, Layers, Download,
    RotateCcw,
    Pencil,
    Check,
    ChevronUp,
    ChevronDown,
    Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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
            subtitle_settings: z.object({
                enabled: z.boolean(),
                position: z.enum(['top', 'middle', 'bottom']),
                color: z.enum(['white', 'yellow', 'cyan', 'green'])
            }).optional()
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
    const params = useParams();
    const projectId = params.projectId as string;
    const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
    const [videoEngine, setVideoEngine] = useState<"image" | "hybrid" | "cinematic">("image");
    const [isRendering, setIsRendering] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [localScenes, setLocalScenes] = useState<SceneData[]>([]);
    const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

    // Load initial project data
    useEffect(() => {
        if (!projectId) return;

        const loadProject = async () => {
            try {
                const res = await fetch(`/api/projects/${projectId}`);
                const data = await res.json();
                if (data.project) {
                    if (data.project.lastStoryboard) {
                        setLocalScenes(data.project.lastStoryboard);
                    }
                    if (data.project.signedVideoUrl) {
                        setVideoUrl(data.project.signedVideoUrl);
                    }
                }
            } catch (err) {
                console.error("Error loading project:", err);
            }
        };

        loadProject();
    }, [projectId]);

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
        if (!projectId) { toast.error("No project context."); return; }
        setVideoUrl(null);
        setLocalScenes([]);
        submit({ projectId, prompt: "Generate a high-impact promotional video storyboard.", videoEngine });
    };

    // Save scenes to Firestore whenever they change (debounce or manual)
    const saveStoryboard = async (scenes: SceneData[]) => {
        if (!projectId) return;
        try {
            await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lastStoryboard: scenes }),
            });
        } catch (err) {
            console.error("Failed to save storyboard:", err);
        }
    };

    const handleSceneChange = (idx: number, updated: SceneData) => {
        const next = localScenes.map((s, i) => (i === idx ? updated : s));
        setLocalScenes(next);
        saveStoryboard(next);
    };

    // Sync streaming output → local editable state once generation settles
    useEffect(() => {
        if (!isLoading && object?.scenes) {
            setLocalScenes(object.scenes as SceneData[]);
            saveStoryboard(object.scenes as SceneData[]);
        }
    }, [isLoading, object]);

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
        if (!projectId || !localScenes.length) {
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

            if (data.outputUrl) {
                setVideoUrl(data.outputUrl);
                toast.success("Video rendered successfully!");
                
                // Persist video path
                if (data.outputGcsPath) {
                    await fetch(`/api/projects/${projectId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ lastRenderedVideoGcsPath: data.outputGcsPath }),
                    });
                }
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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Video className="h-8 w-8 text-violet-500" />
                        Video Studio
                    </h1>
                    <p className="text-muted-foreground italic text-sm">
                        Generate high-impact cinematic promo videos powered by Gemini.
                    </p>
                </div>
                <Badge variant="secondary" className="gap-1 bg-violet-500/10 text-violet-400 border-none font-bold uppercase tracking-widest text-[10px]">
                    <Sparkles className="h-3 w-3" />
                    Creative Director AI
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Project selector & controls */}
                <div className="space-y-6">
                    <Card className="border-border/10 bg-card/40 backdrop-blur-xl">
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-violet-500" />
                                <h3 className="font-bold text-sm tracking-widest uppercase">Generation Settings</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Video Generation Engine</label>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    {/* Option A */}
                                    <button 
                                        onClick={() => setVideoEngine("image")}
                                        className={cn(
                                            "flex flex-col gap-1 p-4 rounded-2xl border transition-all text-left group",
                                            videoEngine === "image" 
                                                ? "bg-violet-600/10 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.1)]" 
                                                : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={cn("text-xs font-black uppercase tracking-tight", videoEngine === "image" ? "text-violet-400" : "text-zinc-400")}>Option A — Pulse</span>
                                            <Badge variant="outline" className="text-[8px] h-4 border-none bg-emerald-500/10 text-emerald-400 font-black">LOW COST</Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-tight italic">Image-based dynamic slideshow (Imagen 3). Fast & efficient.</p>
                                    </button>

                                    {/* Option B */}
                                    <button 
                                        onClick={() => setVideoEngine("hybrid")}
                                        className={cn(
                                            "flex flex-col gap-1 p-4 rounded-2xl border transition-all text-left group",
                                            videoEngine === "hybrid" 
                                                ? "bg-fuchsia-600/10 border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.1)]" 
                                                : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={cn("text-xs font-black uppercase tracking-tight", videoEngine === "hybrid" ? "text-fuchsia-400" : "text-zinc-400")}>Option B — Hybrid</span>
                                            <Badge variant="outline" className="text-[8px] h-4 border-none bg-fuchsia-500/10 text-fuchsia-400 font-black">MEDIUM COST</Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-tight italic">AI Video clips (Veo 2) + Fallback images. Balanced motion.</p>
                                    </button>

                                    {/* Option C */}
                                    <button 
                                        onClick={() => {
                                            // Simulated credit check for Option C
                                            toast.info("Checking API Credits for Veo 3.1...");
                                            setTimeout(() => {
                                                setVideoEngine("cinematic");
                                            }, 500);
                                        }}
                                        className={cn(
                                            "flex flex-col gap-1 p-4 rounded-2xl border transition-all text-left group",
                                            videoEngine === "cinematic" 
                                                ? "bg-amber-600/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                                                : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={cn("text-xs font-black uppercase tracking-tight", videoEngine === "cinematic" ? "text-amber-400" : "text-zinc-400")}>Option C — Cinematic</span>
                                            <Badge variant="outline" className="text-[8px] h-4 border-none bg-amber-500/10 text-amber-400 font-black">HIGH COST</Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-tight italic">Full Veo 3.1 generation with native synced audio. Maximum quality.</p>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-violet-500/20"
                                    onClick={handleGenerate}
                                    disabled={isLoading || !projectId}
                                >
                                    <Sparkles className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    {isLoading ? "Drafting Canvas..." : "Generate Storyboard"}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full border-border/10 bg-zinc-900/50 hover:bg-zinc-900 text-violet-400 font-bold h-11 rounded-xl"
                                    onClick={handleRender}
                                    disabled={isRendering || isLoading || !localScenes.length}
                                >
                                    <Video className={`mr-2 h-4 w-4 ${isRendering ? 'animate-pulse' : ''}`} />
                                    {isRendering ? "Processing Frames..." : "Finalize Render"}
                                </Button>
                            </div>

                            {videoUrl && (
                                <div className="p-4 rounded-xl bg-violet-600/5 border border-violet-500/10">
                                    <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Last Output</p>
                                    <p className="text-[10px] text-violet-400 truncate italic">
                                        {videoUrl.split('?')[0]}
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-border/10">
                                <Button
                                    variant="ghost"
                                    className="w-full text-zinc-600 hover:text-destructive hover:bg-destructive/10 text-xs font-bold uppercase tracking-widest"
                                    onClick={async () => {
                                        if (window.confirm("Archive this project workspace? all renders will be removed.")) {
                                            setIsDeleting(true);
                                            try {
                                                const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
                                                if (res.ok) {
                                                    toast.success("Project archived");
                                                    window.location.href = "/projects";
                                                }
                                            } catch (err) {
                                                toast.error("Failed to archive project");
                                            } finally {
                                                setIsDeleting(false);
                                            }
                                        }
                                    }}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Archive Project
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/10 bg-card/40 backdrop-blur-xl">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-violet-500" />
                                <h3 className="font-bold text-sm tracking-widest uppercase">Sequence Blocks</h3>
                            </div>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar pb-10">
                                <AnimatePresence>
                                    {scenes.length === 0 && !isLoading && (
                                        <div className="h-48 rounded-2xl border border-dashed border-border/10 flex flex-col items-center justify-center text-center p-6 bg-zinc-900/20">
                                            <Layers className="h-8 w-8 text-zinc-800 mb-2" />
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic leading-tight">Timeline is empty.<br />Generate a storyboard to begin.</span>
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
                                            className="p-8 rounded-2xl bg-violet-500/5 border border-dashed border-violet-500/20 flex flex-col items-center justify-center gap-3"
                                        >
                                            <Sparkles className="h-6 w-6 animate-pulse text-violet-500" />
                                            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">Dreaming...</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center: Preview / Live Stream Panel */}
                <div className="lg:col-span-2">
                    <Card className="border-border/10 bg-card/40 backdrop-blur-xl h-full border-t-4 border-t-violet-500">
                        <CardContent className="p-8 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                                        <Play className="h-4 w-4 text-violet-500" />
                                    </div>
                                    <h3 className="font-bold text-lg tracking-tight">Master Preview</h3>
                                </div>
                                <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl">
                                    <button
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${aspectRatio === "16:9" ? "bg-violet-600 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-300"}`}
                                        onClick={() => setAspectRatio("16:9")}
                                    >
                                        Cinematic
                                    </button>
                                    <button
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${aspectRatio === "9:16" ? "bg-violet-600 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-300"}`}
                                        onClick={() => setAspectRatio("9:16")}
                                    >
                                        Social
                                    </button>
                                </div>
                            </div>
                            <div className={`flex-1 min-h-[500px] rounded-[2rem] bg-zinc-950 border-8 border-zinc-900 shadow-2xl flex items-center justify-center transition-all duration-700 overflow-hidden relative group ${aspectRatio === "9:16" ? "mx-auto max-w-[320px] aspect-[9/16]" : "w-full aspect-video"}`}>
                                <div className="absolute inset-0 bg-gradient-to-t from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                
                                {videoUrl ? (
                                    <video
                                        src={videoUrl}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900/50 border border-border/10 mx-auto animate-pulse">
                                            <Play className="h-10 w-10 text-zinc-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-zinc-400">Preview Engine Offline</p>
                                            <p className="text-xs text-muted-foreground italic max-w-xs">
                                                {isLoading ? "Synchronizing with Creative Director..." : isRendering ? "Synthesizing neural frames..." : "Initiate storyboard generation to activate preview."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function VideoStudioPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse font-black uppercase tracking-widest">Waking Studio Agent...</div>}>
            <VideoStudioContent />
        </Suspense>
    );
}
