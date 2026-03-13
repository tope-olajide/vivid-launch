"use client";

/**
 * EditableSceneBlock.tsx
 *
 * An individual scene card with full inline editing:
 *  - Text overlay content & animation style
 *  - Voiceover text & tone
 *  - Visual source (stock_video / uploaded_asset / generate_image) & prompt
 *  - Duration
 *
 * Changes are captured locally and surfaced via `onChange`.
 * "Regenerate" calls the parent handler to ask Gemini to rewrite just this scene.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
    AlignLeft,
    Music,
    Image as ImageIcon,
    Clock,
    RotateCcw,
    Pencil,
    Check,
    ChevronUp,
    ChevronDown,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ── Types ────────────────────────────────────────────────────

export interface SceneData {
    scene_id: number;
    duration: number;
    transition: string;
    music_style?: string;
    scene_emotion?: string;
    camera_motion?: string;
    bpm_suggestion?: number;
    voiceover: { text: string; tone: string; pace?: string };
    text_overlay: { 
        content: string; 
        animation: string; 
        subtitle_settings?: {
            enabled: boolean;
            position: 'top' | 'middle' | 'bottom';
            color: 'white' | 'yellow' | 'cyan' | 'green';
        }
    };
    visual: {
        base: {
            source: string;
            asset_id?: string;
            prompt?: string;
            start_time_seconds?: number;
            end_time_seconds?: number;
            gcs_uri?: string;
        };
        overlay?: { source: string; prompt?: string };
    };
}

interface Props {
    scene: SceneData;
    index: number;
    isRegenerating?: boolean;
    onChange: (index: number, updatedScene: SceneData) => void;
    onRegenerate: (index: number, scene: SceneData) => void;
    onDelete: (index: number) => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    isFirst: boolean;
    isLast: boolean;
}

const VOICE_TONES = ["professional", "energetic", "casual", "serious", "inspirational"];
const VISUAL_SOURCES = ["uploaded_asset", "generate_image", "generate_video"];
const TEXT_ANIMATIONS = ["fade-in", "typewriter", "slide-reveal", "glitch-in", "slide-up"];
const TRANSITIONS = ["fade", "wipe-right", "wipe-left", "slide-up", "dissolve", "cut"];
const CAMERA_MOTIONS = ["zoom_in", "zoom_out", "pan_right", "pan_left", "pan_up", "pan_down"];

// ── Component ────────────────────────────────────────────────

export function EditableSceneBlock({
    scene, index, isRegenerating, onChange, onRegenerate, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<SceneData>(scene);

    const update = <K extends keyof SceneData>(key: K, value: SceneData[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const updateVoiceover = (field: keyof SceneData["voiceover"], value: string) => {
        setDraft((prev) => ({ ...prev, voiceover: { ...prev.voiceover, [field]: value } }));
    };

    const updateTextOverlay = (field: keyof SceneData["text_overlay"], value: string) => {
        setDraft((prev) => ({ ...prev, text_overlay: { ...prev.text_overlay, [field]: value } }));
    };

    const updateSubtitleSettings = (field: keyof NonNullable<SceneData["text_overlay"]["subtitle_settings"]>, value: any) => {
        setDraft((prev) => {
            const currentSettings = prev.text_overlay.subtitle_settings || { enabled: true, position: 'middle', color: 'white' };
            return {
                ...prev,
                text_overlay: {
                    ...prev.text_overlay,
                    subtitle_settings: { ...currentSettings, [field]: value }
                }
            };
        });
    };

    const updateVisualBase = (field: keyof SceneData["visual"]["base"], value: string) => {
        setDraft((prev) => ({
            ...prev,
            visual: { ...prev.visual, base: { ...prev.visual.base, [field]: value } },
        }));
    };

    const handleSave = () => {
        onChange(index, draft);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setDraft(scene);
        setIsEditing(false);
    };

    const displayScene = isEditing ? draft : scene;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-lg border transition-all duration-200 overflow-hidden group
                ${isEditing
                    ? "border-violet-500/60 bg-violet-500/5 shadow-lg shadow-violet-500/10"
                    : "border-border/50 bg-black/5 dark:bg-white/5 hover:border-border"
                }`}
        >
            {/* Left accent bar */}
            <div className={`absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-violet-500 to-fuchsia-500 transition-opacity ${isEditing ? "opacity-100" : "opacity-30 group-hover:opacity-70"}`} />

            <div className="p-4 space-y-3 pl-5">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Scene {displayScene.scene_id || index + 1}</Badge>
                        {isEditing ? (
                            <Select
                                value={draft.transition}
                                onValueChange={(v) => update("transition", v)}
                            >
                                <SelectTrigger className="h-6 w-28 text-[10px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TRANSITIONS.map((t) => (
                                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <span className="text-[10px] text-muted-foreground">{displayScene.transition}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Duration */}
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <input
                                    type="number"
                                    min={2} max={30}
                                    value={draft.duration}
                                    onChange={(e) => update("duration", Number(e.target.value))}
                                    className="w-12 h-6 text-xs text-center rounded border border-border/50 bg-transparent"
                                />
                                <span className="text-[10px] text-muted-foreground">s</span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">{displayScene.duration}s</span>
                        )}

                        {/* Reorder buttons */}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMoveUp(index)} disabled={isFirst}>
                            <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMoveDown(index)} disabled={isLast}>
                            <ChevronDown className="h-3 w-3" />
                        </Button>

                        {/* Edit / Save / Cancel */}
                        {isEditing ? (
                            <>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500 hover:text-green-400" onClick={handleSave}>
                                    <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={handleCancel}>
                                    ✕
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { setDraft(scene); setIsEditing(true); }}>
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="icon" variant="ghost"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-violet-400"
                                    onClick={() => onRegenerate(index, scene)}
                                    disabled={isRegenerating}
                                >
                                    <RotateCcw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive" onClick={() => onDelete(index)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Text Overlay */}
                <div className="flex gap-2 text-sm">
                    <AlignLeft className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                        <span className="font-semibold text-xs text-muted-foreground">TEXT OVERLAY</span>
                        {isEditing ? (
                            <div className="space-y-1.5">
                                <Input
                                    value={draft?.text_overlay?.content || ""}
                                    onChange={(e) => updateTextOverlay("content", e.target.value)}
                                    placeholder="Text overlay content"
                                    className="h-7 text-xs"
                                />
                                <Select
                                    value={draft?.text_overlay?.animation || ""}
                                    onValueChange={(v) => updateTextOverlay("animation", v)}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue placeholder="Animation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEXT_ANIMATIONS.map((a) => (
                                            <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-medium leading-snug">{displayScene?.text_overlay?.content || "..."}</p>
                                <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                                    <span>Anim: {displayScene?.text_overlay?.animation || "none"}</span>
                                    {displayScene?.text_overlay?.subtitle_settings && (
                                        <span>• Subtitles: {displayScene.text_overlay.subtitle_settings.enabled ? `${displayScene.text_overlay.subtitle_settings.color} (${displayScene.text_overlay.subtitle_settings.position})` : 'Off'}</span>
                                    )}
                                </div>
                            </>
                        )}
                        
                        {/* Subtitle Settings (Edit Mode Only) */}
                        {isEditing && (
                            <div className="flex gap-2 pt-1 border-t border-border/50 mt-2">
                                <button 
                                    className={`px-2 py-1 text-[10px] rounded ${draft.text_overlay.subtitle_settings?.enabled === false ? 'bg-black/20 text-muted-foreground' : 'bg-violet-500/20 text-violet-400'}`}
                                    onClick={() => updateSubtitleSettings('enabled', draft.text_overlay.subtitle_settings?.enabled === false ? true : false)}
                                >
                                    {draft.text_overlay.subtitle_settings?.enabled === false ? 'Subtitles Off' : 'Subtitles On'}
                                </button>
                                
                                {draft.text_overlay.subtitle_settings?.enabled !== false && (
                                    <>
                                        <Select value={draft.text_overlay.subtitle_settings?.position || 'middle'} onValueChange={(v) => updateSubtitleSettings('position', v)}>
                                            <SelectTrigger className="h-6 text-[10px] w-20"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="top" className="text-[10px]">Top</SelectItem>
                                                <SelectItem value="middle" className="text-[10px]">Middle</SelectItem>
                                                <SelectItem value="bottom" className="text-[10px]">Bottom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        
                                        <Select value={draft.text_overlay.subtitle_settings?.color || 'white'} onValueChange={(v) => updateSubtitleSettings('color', v)}>
                                            <SelectTrigger className="h-6 text-[10px] w-20"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="white" className="text-[10px]">White</SelectItem>
                                                <SelectItem value="yellow" className="text-[10px]">Yellow</SelectItem>
                                                <SelectItem value="cyan" className="text-[10px]">Cyan</SelectItem>
                                                <SelectItem value="green" className="text-[10px]">Green</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Voiceover */}
                <div className="flex gap-2 text-sm">
                    <Music className="h-4 w-4 text-fuchsia-400 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                        <span className="font-semibold text-xs text-muted-foreground">VOICEOVER</span>
                        {isEditing ? (
                            <div className="space-y-1.5">
                                <Textarea
                                    value={draft?.voiceover?.text || ""}
                                    onChange={(e) => updateVoiceover("text", e.target.value)}
                                    placeholder="Voiceover script"
                                    className="text-xs min-h-[48px] resize-none"
                                />
                                <Select
                                    value={draft?.voiceover?.tone || ""}
                                    onValueChange={(v) => updateVoiceover("tone", v)}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue placeholder="Tone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VOICE_TONES.map((t) => (
                                            <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm italic opacity-90">&ldquo;{displayScene?.voiceover?.text || "..."}&rdquo;</p>
                                <p className="text-[10px] text-muted-foreground">Tone: {displayScene?.voiceover?.tone || "standard"}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Visual Source */}
                <div className="flex gap-2 text-sm">
                    <ImageIcon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                        <span className="font-semibold text-xs text-muted-foreground uppercase flex gap-2 items-center mb-1">
                            VISUAL 
                            {isEditing ? (
                                <Select
                                    value={draft.camera_motion || "zoom_in"}
                                    onValueChange={(v) => update("camera_motion", v)}
                                >
                                    <SelectTrigger className="h-5 w-24 text-[9px] bg-black/20 border-border/30">
                                        <SelectValue placeholder="Motion" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CAMERA_MOTIONS.map((m) => (
                                            <SelectItem key={m} value={m} className="text-[9px]">{m.replace('_', ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                displayScene.camera_motion && <Badge variant="secondary" className="text-[8px] h-4 px-1">{displayScene.camera_motion.replace('_', ' ')}</Badge>
                            )}
                        </span>
                        {isEditing ? (
                            <div className="space-y-1.5">
                                <Select
                                    value={draft?.visual?.base?.source || ""}
                                    onValueChange={(v) => updateVisualBase("source", v)}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue placeholder="Source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VISUAL_SOURCES.map((s) => (
                                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {(draft?.visual?.base?.source === "generate_image" || draft?.visual?.base?.source === "generate_video") && (
                                    <Input
                                        value={draft?.visual?.base?.prompt || ""}
                                        onChange={(e) => updateVisualBase("prompt", e.target.value)}
                                        placeholder="Describe the visual..."
                                        className="h-7 text-xs"
                                    />
                                )}
                                {draft?.visual?.base?.source === "uploaded_asset" && (
                                    <Input
                                        value={draft?.visual?.base?.gcs_uri || draft?.visual?.base?.asset_id || ""}
                                        onChange={(e) => updateVisualBase("gcs_uri", e.target.value)}
                                        placeholder="gs://bucket/path or asset_id"
                                        className="h-7 text-xs font-mono"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] py-0">
                                    {displayScene?.visual?.base?.source || "pending..."}
                                </Badge>
                                {displayScene?.visual?.base?.prompt && (
                                    <span className="text-[10px] text-muted-foreground">{displayScene?.visual?.base?.prompt}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
