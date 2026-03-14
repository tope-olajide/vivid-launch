"use client";

/**
 * /project/[projectId]/studio/variants — A/B Variant Comparison Page
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, CheckCircle2, Loader2, ChevronRight, RotateCcw, Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { SceneData } from "@/components/studio/EditableSceneBlock";

// ── Compact read-only scene card ─────────────────────────────

function VariantSceneCard({ scene, index }: { scene: SceneData; index: number }) {
    return (
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-border/10 space-y-3 text-xs">
            <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[9px] font-bold uppercase border-violet-500/20 text-violet-400">Scene {scene.scene_id || index + 1}</Badge>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">{scene.duration}s · {scene.transition}</span>
            </div>
            <p className="font-black text-sm leading-tight tracking-tight">{scene.text_overlay?.content}</p>
            <p className="italic text-zinc-400 leading-relaxed">&ldquo;{scene.voiceover?.text}&rdquo;</p>
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[9px] font-black uppercase bg-zinc-800 text-zinc-400 border-none">{scene.visual?.base?.source}</Badge>
                {scene.visual?.base?.prompt && (
                    <span className="text-[9px] text-zinc-600 truncate font-medium uppercase tracking-tighter">{scene.visual.base.prompt.slice(0, 40)}...</span>
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
            className={`flex-1 min-w-0 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden relative
                ${isWinner
                    ? "border-violet-500 shadow-2xl shadow-violet-500/20"
                    : "border-border/10 bg-zinc-950/40"
                }`}
        >
            {/* Column header */}
            <div className={`px-8 py-6 flex items-center justify-between
                ${isWinner ? "bg-violet-600/10" : "bg-zinc-900/20"}`}
            >
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className={`text-3xl font-black italic tracking-tighter ${isWinner ? "text-violet-400" : "text-zinc-500"}`}>
                            V.{label}
                        </span>
                        {isWinner && (
                            <Badge className="bg-violet-600 text-white gap-1 text-[10px] font-black uppercase tracking-widest px-3 border-none">
                                <CheckCircle2 className="h-3 w-3" /> Winner
                            </Badge>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">{tagline}</p>
                </div>
                <Button
                    size="sm"
                    variant={isWinner ? "default" : "outline"}
                    className={`rounded-xl font-bold uppercase tracking-tight text-xs h-10 px-6 ${isWinner ? "bg-violet-600 hover:bg-violet-700 text-white" : "border-border/20 text-zinc-400"}`}
                    onClick={onSelect}
                >
                    {isWinner ? "Selected" : `Select V.${label}`}
                    {!isWinner && <ChevronRight className="ml-2 h-3.5 w-3.5" />}
                </Button>
            </div>

            {/* Scene list */}
            <div className="p-6 space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar">
                {scenes.map((scene, i) => (
                    <VariantSceneCard key={i} scene={scene} index={i} />
                ))}
            </div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────

export default function VariantsPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [variantA, setVariantA] = useState<SceneData[]>([]);
    const [variantB, setVariantB] = useState<SceneData[]>([]);
    const [winner, setWinner] = useState<"A" | "B" | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const handleGenerate = async () => {
        if (!projectId) {
            toast.error("Invalid project context.");
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
            toast.success("Split-test generated! Select your winning angle.");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectWinner = (variant: "A" | "B") => {
        setWinner(variant);
        toast.success(`Variant ${variant} is now the primary creative for this project.`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Layout className="h-8 w-8 text-violet-500" />
                        Split Studio
                    </h1>
                    <p className="text-muted-foreground italic text-sm">
                        Generate dual creative directions and select the winning narrative.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {hasGenerated && (
                        <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating} className="text-zinc-500 hover:text-white font-bold text-xs uppercase tracking-widest">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restart Test
                        </Button>
                    )}
                    <Button
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-violet-500/20"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? "Simulating Personas..." : "Run Split Test"}
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-8">
                <Card className="border-border/10 bg-zinc-900/20 p-6 rounded-[2rem] border-l-4 border-l-violet-500">
                    <p className="text-[11px] font-black text-violet-400 uppercase tracking-[0.2em] mb-2">Variant A: Narrative-Led</p>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                        Human-first storytelling focused on emotional transformation and brand values.
                    </p>
                </Card>
                <Card className="border-border/10 bg-zinc-900/20 p-6 rounded-[2rem] border-l-4 border-l-fuchsia-500">
                    <p className="text-[11px] font-black text-fuchsia-400 uppercase tracking-[0.2em] mb-2">Variant B: Logic-Led</p>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                        Feature-first narrative focused on utility, performance, and immediate social proof.
                    </p>
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
                        className="flex flex-col items-center justify-center py-32 space-y-6"
                    >
                        <div className="relative h-20 w-20">
                            <div className="absolute inset-0 rounded-full border-4 border-violet-500/10" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-violet-400 animate-pulse" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-white font-black uppercase tracking-[0.3em] text-sm">Parallel Synthesis active</p>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">Gemini is drafting two distinct creative visions...</p>
                        </div>
                    </motion.div>
                )}

                {/* Side-by-side variants */}
                {!isGenerating && hasGenerated && (
                    <motion.div
                        key="variants"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-8"
                    >
                        <VariantColumn
                            label="A"
                            tagline="Emotional Storytelling Focus"
                            scenes={variantA}
                            isWinner={winner === "A"}
                            onSelect={() => handleSelectWinner("A")}
                        />
                        <VariantColumn
                            label="B"
                            tagline="Data & Feature Utility Focus"
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
                        className="flex flex-col items-center justify-center py-40 space-y-6 border-2 border-dashed border-border/10 rounded-[3rem] bg-zinc-950/20 group hover:bg-zinc-900/20 transition-colors"
                    >
                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-border/10 group-hover:scale-110 transition-transform">
                            <Layout className="h-8 w-8 text-zinc-800" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-black text-zinc-600 uppercase tracking-widest">Compare Directions</p>
                            <p className="text-xs text-zinc-500 italic">Initiate a split test to contrast creative angles for this project.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
