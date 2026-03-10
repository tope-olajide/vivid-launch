"use client";

/**
 * /studio/variants — A/B Variant Comparison Page
 *
 * Generates two creative storyboard variations in parallel and presents
 * them side-by-side so the user can pick the winner.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, CheckCircle2, Loader2, ChevronRight, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { SceneData } from "@/components/studio/EditableSceneBlock";

// ── Compact read-only scene card ─────────────────────────────

function VariantSceneCard({ scene, index }: { scene: SceneData; index: number }) {
    return (
        <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-border/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">Scene {scene.scene_id || index + 1}</Badge>
                <span className="text-muted-foreground">{scene.duration}s · {scene.transition}</span>
            </div>
            <p className="font-semibold leading-tight">{scene.text_overlay?.content}</p>
            <p className="italic text-muted-foreground line-clamp-2">&ldquo;{scene.voiceover?.text}&rdquo;</p>
            <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] py-0">{scene.visual?.base?.source}</Badge>
                {scene.visual?.base?.prompt && (
                    <span className="text-muted-foreground truncate">{scene.visual.base.prompt.slice(0, 50)}</span>
                )}
            </div>
        </div>
    );
}

// ── Variant column ────────────────────────────────────────────

interface VariantColumnProps {
    label: "A" | "B";
    tagline: string;
    scenes: SceneData[];
    isWinner: boolean;
    onSelect: () => void;
}

function VariantColumn({ label, tagline, scenes, isWinner, onSelect }: VariantColumnProps) {
    return (
        <motion.div
            layout
            className={`flex-1 min-w-0 rounded-xl border-2 transition-all duration-300 overflow-hidden
                ${isWinner
                    ? "border-violet-500 shadow-lg shadow-violet-500/20"
                    : "border-border/50"
                }`}
        >
            {/* Column header */}
            <div className={`px-5 py-4 flex items-center justify-between
                ${isWinner ? "bg-violet-500/10" : "bg-card/50"}`}
            >
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-black ${isWinner ? "text-violet-400" : "text-muted-foreground"}`}>
                            Variant {label}
                        </span>
                        {isWinner && (
                            <Badge className="bg-violet-500 text-white gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3" /> Selected
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tagline}</p>
                </div>
                <Button
                    size="sm"
                    variant={isWinner ? "default" : "outline"}
                    className={isWinner ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
                    onClick={onSelect}
                >
                    {isWinner ? "✓ Winner" : `Use Variant ${label}`}
                    {!isWinner && <ChevronRight className="ml-1 h-3 w-3" />}
                </Button>
            </div>

            {/* Scene list */}
            <div className="p-4 space-y-2.5 max-h-[600px] overflow-y-auto">
                {scenes.map((scene, i) => (
                    <VariantSceneCard key={i} scene={scene} index={i} />
                ))}
            </div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────

export default function VariantsPage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId");

    const [variantA, setVariantA] = useState<SceneData[]>([]);
    const [variantB, setVariantB] = useState<SceneData[]>([]);
    const [winner, setWinner] = useState<"A" | "B" | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const handleGenerate = async () => {
        if (!projectId) {
            toast.error("No project selected — add ?projectId=xxx to the URL.");
            return;
        }
        setIsGenerating(true);
        setWinner(null);
        setHasGenerated(false);
        try {
            const res = await fetch("/api/studio/variants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Generation failed");
            setVariantA(data.variantA);
            setVariantB(data.variantB);
            setHasGenerated(true);
            toast.success("Both variants generated! Compare and choose your winner.");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectWinner = (variant: "A" | "B") => {
        setWinner(variant);
        toast.success(`Variant ${variant} selected as winner! Head to Video Studio to render it.`);
    };

    return (
        <motion.div
            className="p-6 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">A/B Variant Comparison</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate two creative storyboard angles and pick the winner
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {hasGenerated && (
                        <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Regenerate
                        </Button>
                    )}
                    <Button
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? "Generating both variants..." : "Generate A/B Variants"}
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/40 bg-card/40">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-violet-400 mb-0.5">VARIANT A — EMOTIONAL</p>
                        <p className="text-xs text-muted-foreground">
                            Leads with story and human outcome. Designed for top-of-funnel brand awareness.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/40">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-fuchsia-400 mb-0.5">VARIANT B — DATA-DRIVEN</p>
                        <p className="text-xs text-muted-foreground">
                            Leads with proof and results. Designed for mid-funnel conversion campaigns.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Generating state */}
            <AnimatePresence mode="wait">
                {isGenerating && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 space-y-4"
                    >
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-violet-400" />
                        </div>
                        <p className="text-muted-foreground text-sm">Gemini is writing both creative angles simultaneously...</p>
                    </motion.div>
                )}

                {/* Side-by-side variants */}
                {!isGenerating && hasGenerated && (
                    <motion.div
                        key="variants"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-5"
                    >
                        <VariantColumn
                            label="A"
                            tagline="Emotional story — lead with human outcome"
                            scenes={variantA}
                            isWinner={winner === "A"}
                            onSelect={() => handleSelectWinner("A")}
                        />
                        <VariantColumn
                            label="B"
                            tagline="Data-driven proof — lead with results"
                            scenes={variantB}
                            isWinner={winner === "B"}
                            onSelect={() => handleSelectWinner("B")}
                        />
                    </motion.div>
                )}

                {/* Empty state */}
                {!isGenerating && !hasGenerated && (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-24 space-y-4 border-2 border-dashed border-border/30 rounded-xl"
                    >
                        <Sparkles className="h-12 w-12 text-muted-foreground/30" />
                        <div className="text-center">
                            <p className="font-medium text-muted-foreground">No variants yet</p>
                            <p className="text-sm text-muted-foreground/70">Click &quot;Generate A/B Variants&quot; to compare two creative directions</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
