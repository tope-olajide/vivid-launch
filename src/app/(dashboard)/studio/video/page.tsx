"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Sparkles, Play, Settings2, Layers, AlignLeft, Music, Activity, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        if (!projectId) {
            toast.error("No project selected.");
            return;
        }
        submit({ projectId, prompt: "Generate a high-impact promotional video storyboard." });
    };

    const scenes = object?.scenes || [];

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
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 pb-10">
                                <AnimatePresence>
                                    {scenes.length === 0 && !isLoading && (
                                        <div className="h-48 rounded-lg border border-dashed border-border/50 flex flex-col items-center justify-center text-center p-4">
                                            <Layers className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                            <span className="text-sm text-muted-foreground">No scenes generated yet.<br />Click Generate to start the AI Director.</span>
                                        </div>
                                    )}
                                    {scenes.map((scene, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-border/50 space-y-3 relative overflow-hidden group"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-fuchsia-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline">Scene {scene?.scene_id || i + 1}</Badge>
                                                <span className="text-xs text-muted-foreground">{scene?.duration}s • {scene?.transition}</span>
                                            </div>

                                            {scene?.text_overlay?.content && (
                                                <div className="flex gap-2 text-sm">
                                                    <AlignLeft className="h-4 w-4 text-violet-400 mt-0.5" />
                                                    <div>
                                                        <span className="font-semibold dark:text-gray-200">Text:</span> <span className="opacity-90">{scene.text_overlay.content}</span>
                                                        <div className="text-[10px] text-muted-foreground">Animation: {scene.text_overlay.animation}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {scene?.voiceover?.text && (
                                                <div className="flex gap-2 text-sm">
                                                    <Music className="h-4 w-4 text-fuchsia-400 mt-0.5" />
                                                    <div>
                                                        <span className="font-semibold dark:text-gray-200">VO:</span> <span className="italic opacity-90">"{scene.voiceover.text}"</span>
                                                        <div className="text-[10px] text-muted-foreground">Tone: {scene.voiceover.tone}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {scene?.visual?.base && (
                                                <div className="flex gap-2 text-sm">
                                                    <ImageIcon className="h-4 w-4 text-blue-400 mt-0.5" />
                                                    <div>
                                                        <span className="font-semibold dark:text-gray-200">Visual:</span>
                                                        <div className="text-xs opacity-90 flex items-center gap-2">
                                                            <span>Source: <Badge variant="secondary" className="text-[10px] py-0">{scene.visual.base.source}</Badge></span>
                                                            {scene.visual.base.start_time_seconds !== undefined && scene.visual.base.end_time_seconds !== undefined && (
                                                                <Badge variant="outline" className="text-[10px] py-0 border-blue-500/30 text-blue-500">
                                                                    ✂️ {scene.visual.base.start_time_seconds}s - {scene.visual.base.end_time_seconds}s
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {scene.visual.base.prompt && <div className="text-[10px] text-muted-foreground mt-1">Prompt: {scene.visual.base.prompt}</div>}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
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
