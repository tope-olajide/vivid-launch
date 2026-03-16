"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket, Sparkles, Loader2, Save, Zap, Palette, FileText,
    ChevronRight, Play, Pause, Power, PowerOff, Clock, Calendar,
    CheckCircle2, AlertCircle, XCircle, Radio, Share2, Lock,
    MessageCircle, Video, BarChart3, Brain, Timer, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────
interface AutopilotSettings {
    automationEnabled: boolean;
    status: "running" | "paused" | "stopped";
    smartScheduling: boolean;
    lastRunAt: string | null;
    nextRunAt: string | null;
    enabledPlatforms: string[];
    pulse: { videos: number; blogs: number; social: number };
    brandVoice: {
        tone: number;
        humor: number;
        formality: number;
        emojiDensity: number;
        customPrompt: string;
    };
}

interface AutopilotEvent {
    id: string;
    type: "content_generated" | "queued" | "published" | "error";
    platform: string | null;
    message: string;
    contentId: string | null;
    timestamp: string;
}

interface QueueItem {
    id: string;
    platform: string;
    type: "social" | "blog";
    content: string;
    createdAt: string;
    status: string;
}

const DEFAULT_SETTINGS: AutopilotSettings = {
    automationEnabled: false,
    status: "stopped",
    smartScheduling: false,
    lastRunAt: null,
    nextRunAt: null,
    enabledPlatforms: [],
    pulse: { videos: 1, blogs: 1, social: 7 },
    brandVoice: { tone: 50, humor: 30, formality: 70, emojiDensity: 40, customPrompt: "" }
};

const PLATFORM_META: Record<string, { name: string; icon: string; color: string }> = {
    devto: { name: "Dev.to", icon: "📝", color: "bg-zinc-800" },
    hashnode: { name: "Hashnode", icon: "📘", color: "bg-blue-600/20" },
    medium: { name: "Medium", icon: "📰", color: "bg-zinc-800" },
    ghost: { name: "Ghost", icon: "👻", color: "bg-zinc-800" },
    youtube: { name: "YouTube", icon: "▶️", color: "bg-red-600/20" },
    twitter: { name: "X / Twitter", icon: "𝕏", color: "bg-zinc-800" },
    instagram: { name: "Instagram", icon: "📸", color: "bg-rose-500/20" },
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
    content_generated: <Sparkles className="h-3.5 w-3.5 text-violet-400" />,
    queued: <Clock className="h-3.5 w-3.5 text-sky-400" />,
    published: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    error: <XCircle className="h-3.5 w-3.5 text-red-400" />,
};

const EVENT_COLORS: Record<string, string> = {
    content_generated: "border-l-violet-500",
    queued: "border-l-sky-500",
    published: "border-l-emerald-500",
    error: "border-l-red-500",
};

// ── Helpers ─────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function formatScheduleTime(dateStr: string | null) {
    if (!dateStr) return "Not scheduled";
    const d = new Date(dateStr);
    const now = Date.now();
    const diff = d.getTime() - now;
    if (diff < 0) return "Overdue";
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
}

// ── Main Component ──────────────────────────────────────────────
export default function AutopilotCommandCenter() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [settings, setSettings] = useState<AutopilotSettings>(DEFAULT_SETTINGS);
    const [events, setEvents] = useState<AutopilotEvent[]>([]);
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [globalConnectors, setGlobalConnectors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [projectStrategy, setProjectStrategy] = useState<any[]>([]);

    // ── Data Fetching ───────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!projectId) return;
        try {
            const [settingsRes, eventsRes, connRes, socialsRes, blogsRes, projectsRes] = await Promise.all([
                fetch(`/api/projects/${projectId}/autopilot`),
                fetch(`/api/projects/${projectId}/autopilot/events`),
                fetch(`/api/connectors`),
                fetch(`/api/projects/${projectId}/socials`),
                fetch(`/api/projects/${projectId}/blogs`),
                fetch(`/api/projects`),
            ]);

            const [settingsData, eventsData, connData, socialsData, blogsData, projectListData] = await Promise.all([
                settingsRes.json(), eventsRes.json(), connRes.json(),
                socialsRes.json(), blogsRes.json(), projectsRes.json()
            ]);

            if (settingsData.autopilotSettings) {
                setSettings({ ...DEFAULT_SETTINGS, ...settingsData.autopilotSettings });
            }
            if (eventsData.events) setEvents(eventsData.events);
            if (connData.connectors) setGlobalConnectors(connData.connectors.map((c: any) => c.id));

            // Extract strategy from project data
            const currentProject = projectListData.projects?.find((p: any) => p.id === projectId);
            if (currentProject?.strategy) {
                setProjectStrategy(currentProject.strategy);
            }

            // Build queue from recent socials + blogs
            const queueItems: QueueItem[] = [];
            if (socialsData.socials) {
                socialsData.socials.slice(0, 5).forEach((s: any) => {
                    queueItems.push({
                        id: s.id,
                        platform: s.platform || "twitter",
                        type: "social",
                        content: s.content?.slice(0, 100) || "",
                        createdAt: s.createdAt,
                        status: s.publishedAt ? "published" : "queued"
                    });
                });
            }
            if (blogsData.blogs) {
                blogsData.blogs.slice(0, 3).forEach((b: any) => {
                    queueItems.push({
                        id: b.id,
                        platform: b.publishedTo || "blog",
                        type: "blog",
                        content: b.title?.slice(0, 100) || b.content?.slice(0, 100) || "",
                        createdAt: b.createdAt,
                        status: b.publishedAt ? "published" : "queued"
                    });
                });
            }
            queueItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setQueue(queueItems.slice(0, 8));
        } catch (err) {
            console.error("Failed to load autopilot data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Auto-refresh events every 15 seconds
    useEffect(() => {
        if (!projectId) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/projects/${projectId}/autopilot/events`);
                const data = await res.json();
                if (data.events) setEvents(data.events);
            } catch { /* silent */ }
        }, 15000);
        return () => clearInterval(interval);
    }, [projectId]);

    // ── Save Handler ────────────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/autopilot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autopilotSettings: settings }),
            });
            if (!res.ok) throw new Error("Save failed");
            setHasUnsavedChanges(false);
            toast.success("Command center settings synchronized.");
        } catch {
            toast.error("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateSettings = (patch: Partial<AutopilotSettings>) => {
        setSettings(prev => ({ ...prev, ...patch }));
        setHasUnsavedChanges(true);
    };

    const updatePulse = (key: string, value: number) => {
        setSettings(prev => ({ ...prev, pulse: { ...prev.pulse, [key]: value } }));
        setHasUnsavedChanges(true);
    };

    const updateBrandVoice = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, brandVoice: { ...prev.brandVoice, [key]: value } }));
        setHasUnsavedChanges(true);
    };

    const togglePlatform = (platformId: string) => {
        setSettings(prev => ({
            ...prev,
            enabledPlatforms: prev.enabledPlatforms.includes(platformId)
                ? prev.enabledPlatforms.filter(p => p !== platformId)
                : [...prev.enabledPlatforms, platformId]
        }));
        setHasUnsavedChanges(true);
    };

    const setStatus = (status: "running" | "paused" | "stopped") => {
        updateSettings({
            status,
            automationEnabled: status === "running",
            ...(status === "running" ? { lastRunAt: new Date().toISOString() } : {})
        });
    };

    // ── Status Helpers ──────────────────────────────────────────
    const statusConfig = {
        running: { label: "Running", color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400 animate-pulse", border: "border-emerald-500/20" },
        paused: { label: "Paused", color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-400", border: "border-amber-500/20" },
        stopped: { label: "Stopped", color: "text-zinc-500", bg: "bg-zinc-500/10", dot: "bg-zinc-500", border: "border-zinc-500/20" }
    };
    const sc = statusConfig[settings.status];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[600px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto" />
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Initializing Command Center...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* ── Page Header ──────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Rocket className="h-5 w-5 text-white" />
                        </div>
                        Autopilot
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        AI Marketing Command Center
                    </p>
                </div>
                <AnimatePresence>
                    {hasUnsavedChanges && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-violet-600 hover:bg-violet-700 text-white gap-2 h-10 px-6 shadow-lg shadow-violet-500/20 font-bold text-xs uppercase tracking-widest"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* SECTION 1: Status Bar                                  */}
            {/* ══════════════════════════════════════════════════════ */}
            <Card className={cn("border bg-card/40 backdrop-blur-xl overflow-hidden", sc.border)}>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Status + Next Run */}
                        <div className="flex items-center gap-6">
                            <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl", sc.bg)}>
                                <div className={cn("h-2.5 w-2.5 rounded-full", sc.dot)} />
                                <span className={cn("text-sm font-black uppercase tracking-widest", sc.color)}>
                                    {sc.label}
                                </span>
                            </div>
                            <Separator orientation="vertical" className="h-8 hidden lg:block" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Next Generation</p>
                                <p className="text-lg font-black tracking-tight">
                                    {settings.status === "running" ? formatScheduleTime(settings.nextRunAt) : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Health Badges */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant="outline" className="gap-1.5 bg-emerald-500/5 text-emerald-400 border-emerald-500/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
                                <Brain className="h-3 w-3" /> AI Engine
                            </Badge>
                            <Badge variant="outline" className="gap-1.5 bg-sky-500/5 text-sky-400 border-sky-500/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
                                <Radio className="h-3 w-3" /> Publisher
                            </Badge>
                            <Badge variant="outline" className={cn(
                                "gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5",
                                globalConnectors.length > 0
                                    ? "bg-violet-500/5 text-violet-400 border-violet-500/10"
                                    : "bg-zinc-500/5 text-zinc-500 border-zinc-500/10"
                            )}>
                                <Share2 className="h-3 w-3" /> {globalConnectors.length} Platforms
                            </Badge>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            {settings.status === "stopped" && (
                                <Button size="sm" onClick={() => setStatus("running")} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-lg">
                                    <Play className="h-3.5 w-3.5" /> Enable
                                </Button>
                            )}
                            {settings.status === "running" && (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => setStatus("paused")} className="gap-1.5 font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-lg border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
                                        <Pause className="h-3.5 w-3.5" /> Pause
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setStatus("stopped")} className="gap-1.5 font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10">
                                        <PowerOff className="h-3.5 w-3.5" /> Stop
                                    </Button>
                                </>
                            )}
                            {settings.status === "paused" && (
                                <>
                                    <Button size="sm" onClick={() => setStatus("running")} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-lg">
                                        <Play className="h-3.5 w-3.5" /> Resume
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setStatus("stopped")} className="gap-1.5 font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10">
                                        <PowerOff className="h-3.5 w-3.5" /> Stop
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ══════════════════════════════════════════════════════ */}
            {/* SECTION 2 + 3: Pulse Settings + Smart Scheduling       */}
            {/* ══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Pulse Cards */}
                {[
                    { label: "Video Pulse", key: "videos", icon: <Video className="h-4 w-4" />, sub: "per week", max: 10, color: "text-violet-400" },
                    { label: "Blog Pulse", key: "blogs", icon: <FileText className="h-4 w-4" />, sub: "per week", max: 10, color: "text-emerald-400" },
                    { label: "Social Pulse", key: "social", icon: <MessageCircle className="h-4 w-4" />, sub: "per day", max: 20, color: "text-sky-400" }
                ].map((item) => (
                    <Card key={item.key} className="bg-card/40 border-border/10 backdrop-blur-xl group hover:border-violet-500/20 transition-all">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    {item.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={cn("text-4xl font-black tabular-nums", item.color)}>
                                    {settings.pulse[item.key as keyof typeof settings.pulse]}
                                </span>
                                <span className="text-xs text-muted-foreground font-bold">{item.sub}</span>
                            </div>
                            <Slider
                                max={item.max}
                                step={1}
                                value={[settings.pulse[item.key as keyof typeof settings.pulse]]}
                                onValueChange={([val]) => updatePulse(item.key, val)}
                                className="[&>span:first-child]:h-1.5"
                            />
                        </CardContent>
                    </Card>
                ))}

                {/* Smart Scheduling Card */}
                <Card className="bg-card/40 border-border/10 backdrop-blur-xl">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Timer className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Smart Scheduling</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-bold">AI Optimization</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Gemini chooses optimal posting times based on engagement patterns.
                                </p>
                            </div>
                            <Switch
                                checked={settings.smartScheduling}
                                onCheckedChange={(checked) => updateSettings({ smartScheduling: checked })}
                            />
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors",
                            settings.smartScheduling
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-zinc-500/10 text-zinc-500"
                        )}>
                            {settings.smartScheduling ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {settings.smartScheduling ? "AI-Optimized Timing" : "Manual Schedule"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* SECTION: Strategic Roadmap Arc (New)                   */}
            {/* ══════════════════════════════════════════════════════ */}
            {projectStrategy.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-violet-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Planned Strategic Arc</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {projectStrategy.map((step, i) => (
                            <Card key={i} className="bg-card/40 border-border/10 backdrop-blur-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    {step.type === 'video' ? <Video className="h-12 w-12" /> : step.type === 'blog' ? <FileText className="h-12 w-12" /> : <MessageCircle className="h-12 w-12" />}
                                </div>
                                <CardContent className="p-4 pt-6 space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/10 text-[9px] font-black uppercase">Day {step.day}</Badge>
                                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight">{step.type}</Badge>
                                    </div>
                                    <h3 className="text-xs font-bold leading-tight line-clamp-2">{step.title}</h3>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                                        {step.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* SECTION 4 + 5: Queue + Activity Feed                    */}
            {/* ══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Queue */}
                <Card className="bg-card/40 border-border/10 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-violet-500" />
                            Upcoming Queue
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-widest font-bold">
                            Recent and scheduled content
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/5">
                            {queue.length > 0 ? queue.map((item) => {
                                const pmeta = PLATFORM_META[item.platform] || { name: item.platform, icon: "📄", color: "bg-zinc-800" };
                                return (
                                    <div key={item.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0", pmeta.color)}>
                                                {pmeta.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate">{item.content || `${item.type} content`}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    {pmeta.name} · {timeAgo(item.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] font-black uppercase tracking-widest border-none shrink-0 ml-2",
                                            item.status === "published" ? "bg-emerald-500/10 text-emerald-400" :
                                                item.status === "failed" ? "bg-red-500/10 text-red-400" :
                                                    "bg-sky-500/10 text-sky-400"
                                        )}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                );
                            }) : (
                                <div className="px-5 py-12 text-center">
                                    <Calendar className="h-8 w-8 text-zinc-800 mx-auto mb-3" />
                                    <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">No content in queue</p>
                                    <p className="text-[10px] text-zinc-700 mt-1">Enable Autopilot and generate content to populate the queue.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="bg-card/40 border-border/10 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-emerald-500" />
                                    Activity Feed
                                </CardTitle>
                                <CardDescription className="text-[10px] uppercase tracking-widest font-bold">
                                    Live autopilot events · Auto-refreshes
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/5 max-h-[380px] overflow-y-auto custom-scrollbar">
                            {events.length > 0 ? events.map((event) => (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "px-5 py-3 flex items-start gap-3 border-l-2 hover:bg-white/[0.02] transition-colors",
                                        EVENT_COLORS[event.type] || "border-l-zinc-700"
                                    )}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        {EVENT_ICONS[event.type] || <Zap className="h-3.5 w-3.5 text-zinc-500" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium leading-relaxed">{event.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {event.platform && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    {PLATFORM_META[event.platform]?.name || event.platform}
                                                </span>
                                            )}
                                            <span className="text-[9px] text-zinc-600">{timeAgo(event.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="px-5 py-12 text-center">
                                    <Activity className="h-8 w-8 text-zinc-800 mx-auto mb-3" />
                                    <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">No activity yet</p>
                                    <p className="text-[10px] text-zinc-700 mt-1">Events will appear here as Autopilot generates and publishes content.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* SECTION 6: Integrations                                */}
            {/* ══════════════════════════════════════════════════════ */}
            <Card className="bg-card/40 border-border/10 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-violet-500" />
                        Distribution Channels
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest font-bold">
                        Toggle platforms for autonomous publishing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {Object.entries(PLATFORM_META).map(([id, meta]) => {
                            const isConnected = globalConnectors.includes(id);
                            const isEnabled = settings.enabledPlatforms.includes(id);
                            return (
                                <div
                                    key={id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                                        isConnected
                                            ? "border-border/10 bg-zinc-900/30 hover:border-violet-500/20"
                                            : "border-border/5 bg-zinc-900/10 opacity-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center text-base relative", meta.color)}>
                                            {meta.icon}
                                            {!isConnected && (
                                                <div className="absolute -top-1 -right-1">
                                                    <Lock className="h-3 w-3 text-zinc-500 bg-zinc-950 rounded-full p-0.5" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">{meta.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                                {isConnected ? (isEnabled ? "Autopilot On" : "Connected") : "Not Connected"}
                                            </p>
                                        </div>
                                    </div>
                                    {isConnected ? (
                                        <Switch
                                            checked={isEnabled}
                                            onCheckedChange={() => togglePlatform(id)}
                                        />
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[9px] font-bold uppercase tracking-widest text-violet-400 hover:text-violet-300 h-7 px-2"
                                            asChild
                                        >
                                            <a href={`/project/${projectId}/manage/connectors`}>Connect</a>
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ══════════════════════════════════════════════════════ */}
            {/* SECTION 7: Brand Voice                                 */}
            {/* ══════════════════════════════════════════════════════ */}
            <Card className="bg-card/40 border-border/10 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                        <Palette className="h-4 w-4 text-fuchsia-500" />
                        Brand Voice
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest font-bold">
                        Define the AI personality for this project
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Sliders */}
                        <div className="space-y-6">
                            {[
                                { label: "Tone of Voice", sub: "Playful ← → Serious", key: "tone" },
                                { label: "Humor Level", sub: "Dry ← → High Energy", key: "humor" },
                                { label: "Formality", sub: "Casual ← → Corporate", key: "formality" },
                                { label: "Emoji Density", sub: "Minimal ← → Visual-First", key: "emojiDensity" }
                            ].map((s) => (
                                <div key={s.key} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <Label className="font-bold text-xs flex flex-col gap-0.5">
                                            {s.label}
                                            <span className="text-[9px] font-normal text-muted-foreground tracking-tighter">{s.sub}</span>
                                        </Label>
                                        <span className="text-xs font-mono text-violet-400 tabular-nums">
                                            {settings.brandVoice[s.key as keyof typeof settings.brandVoice]}%
                                        </span>
                                    </div>
                                    <Slider
                                        value={[settings.brandVoice[s.key as keyof typeof settings.brandVoice] as number]}
                                        onValueChange={([val]) => updateBrandVoice(s.key, val)}
                                        className="[&>span:first-child]:h-1.5"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Custom Directives */}
                        <div className="space-y-3">
                            <Label className="font-bold text-xs flex flex-col gap-0.5">
                                Custom AI Directives
                                <span className="text-[9px] font-normal text-muted-foreground tracking-tighter">Instructions injected into every generation</span>
                            </Label>
                            <Textarea
                                placeholder={`e.g. "Always sound like a confident indie hacker building in public."`}
                                className="min-h-[220px] bg-zinc-900/30 border-border/10 focus-visible:ring-violet-500 rounded-xl font-medium text-sm p-5 resize-none"
                                value={settings.brandVoice.customPrompt}
                                onChange={(e) => updateBrandVoice("customPrompt", e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
