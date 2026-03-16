"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCompletion, experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { 
    Sparkles, Send, Loader2, Twitter, Linkedin, Instagram, 
    Facebook, Globe, User, MessageCircle, Heart, Share2, 
    Layers, Rocket, Smartphone, CheckCircle2, ChevronRight,
    Search, Layout, History, Clock, Trash2, Copy, ExternalLink, PenTool, GitCompareArrows
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/**
 * Platform Configurations
 */
const PLATFORMS = {
    twitter: { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "text-white", bg: "bg-black", limit: 280 },
    linkedin: { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-[#0A66C2]", bg: "bg-[#0A66C2]/10", limit: 3000 },
    instagram: { id: "instagram", name: "Instagram", icon: Instagram, color: "text-rose-500", bg: "bg-rose-500/10", limit: 2200 },
    facebook: { id: "facebook", name: "Facebook", icon: Facebook, color: "text-[#1877F2]", bg: "bg-[#1877F2]/10", limit: 63206 },
    reddit: { id: "reddit", name: "Reddit", icon: Share2, color: "text-[#FF4500]", bg: "bg-[#FF4500]/10", limit: 40000 },
};

/**
 * SOCIAL POST MOCKUP COMPONENT
 */
const PlatformMockup = ({ platform, content, accountName = "Founder" }: { platform: string, content: string, accountName?: string }) => {
    const config = PLATFORMS[platform as keyof typeof PLATFORMS] || PLATFORMS.twitter;
    const Icon = config.icon;

    return (
        <Card className="w-full max-w-[340px] mx-auto border-border/40 bg-card overflow-hidden shadow-2xl rounded-[2.5rem] border-[8px] border-zinc-900 aspect-[9/16] relative">
            {/* Status Bar */}
            <div className="h-8 bg-zinc-900 flex items-center justify-between px-8 text-[10px] text-zinc-500">
                <span>9:41</span>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full border border-zinc-700" />
                    <div className="w-3 h-3 rounded-full border border-zinc-700" />
                </div>
            </div>

            <CardContent className="p-0 overflow-y-auto h-[calc(100%-32px)] custom-scrollbar">
                {/* Platform Header */}
                <div className="p-4 flex items-center justify-between border-b border-border/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center p-1.5`}>
                            <Icon className={`w-full h-full ${config.color}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold">{config.name}</p>
                            <p className="text-[10px] text-muted-foreground">Preview Mode</p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            <User className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-[12px] font-bold">{accountName} <span className="text-muted-foreground font-normal">@local_user</span></p>
                            <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                {content || "Generating your viral masterpiece..."}
                            </div>
                        </div>
                    </div>

                    {/* Meta Image Placeholder */}
                    <div className="aspect-video rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-700 overflow-hidden relative">
                        <Smartphone className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-[10px] font-medium opacity-20 uppercase tracking-widest">Visual Asset</span>
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                             <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-violet-500" 
                                    initial={{ width: 0 }} 
                                    animate={{ width: content ? '100%' : '0%' }} 
                                />
                             </div>
                        </div>
                    </div>

                    {/* Interactions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/10 text-zinc-500">
                        <div className="flex gap-4">
                            <Heart className="w-4 h-4 hover:text-rose-500 cursor-pointer transition-colors" />
                            <MessageCircle className="w-4 h-4 hover:text-sky-400 cursor-pointer transition-colors" />
                            <Share2 className="w-4 h-4 hover:text-green-400 cursor-pointer transition-colors" />
                        </div>
                        <Badge variant="ghost" className="text-[9px] opacity-40">DRAFT</Badge>
                    </div>
                </div>
            </CardContent>

            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl" />
        </Card>
    );
};

// Schema must match backend
const contentPackSchema = z.object({
    posts: z.array(z.object({
        platform: z.string(),
        content: z.string(),
        hashtags: z.array(z.string()),
        charCount: z.number()
    }))
});

const variantSchema = z.object({
    variantA: z.object({
        content: z.string(),
        strategy: z.string()
    }),
    variantB: z.object({
        content: z.string(),
        strategy: z.string()
    })
});

export default function SocialStudioPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [mode, setMode] = useState<"single" | "pack" | "variant" | "campaign">("single");
    const [platform, setPlatform] = useState<string>("twitter");
    const [prompt, setPrompt] = useState("");
    const [synthesisMode, setSynthesisMode] = useState<"auto" | "manual">("auto");
    const [content, setContent] = useState("");
    const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
    const [generatedVariants, setGeneratedVariants] = useState<{A?: any, B?: any}>({});
    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    // ── AI SDK Hooks ──────────────────────────────────────────
    const { completion, complete, isLoading: isStreamingText } = useCompletion({
        api: "/api/studio/social",
        onFinish: (prompt, finalCompletion) => {
            console.log("[Social Studio] Single post generation finished");
            if (finalCompletion && finalCompletion.trim() !== "" && !finalCompletion.includes("Generate high-impact")) {
                setContent(finalCompletion);
                fetchHistory();
            } else {
                // If the stream was empty or just an echo, fetch the real saved post from the DB
                setTimeout(() => fetchHistory(true, 'single'), 1500);
            }
        },
        onError: (err) => {
            console.error("[Social Studio] Single post error (fallback to DB fetch):", err);
            setTimeout(() => fetchHistory(true, 'single'), 1500);
        }
    });

    const { object, submit, isLoading: isStreamingObject } = useObject({
        api: "/api/studio/social",
        schema: mode === 'pack' ? contentPackSchema : variantSchema,
        onFinish: (finalObject) => {
            console.log(`[Social Studio] ${mode} generation finished`);
            if (mode === 'pack' && (finalObject as any)?.posts) {
                setGeneratedPosts((finalObject as any).posts);
                fetchHistory();
            } else if (mode === 'variant' && finalObject) {
                setGeneratedVariants({
                    A: (finalObject as any).variantA,
                    B: (finalObject as any).variantB
                });
                fetchHistory();
            } else {
                setTimeout(() => fetchHistory(true, mode), 1500);
            }
        },
        onError: (err) => {
            console.error(`[Social Studio] ${mode} error:`, err);
            setTimeout(() => fetchHistory(true, mode), 1500);
        }
    });

    const isGenerating = isStreamingText || isStreamingObject;

    // Sync Real-time Streams
    useEffect(() => {
        if (completion && mode === 'single') {
            setContent(completion);
        }
    }, [completion, mode]);

    useEffect(() => {
        if (object) {
            if (mode === 'pack' && (object as any).posts) {
                setGeneratedPosts((object as any).posts);
            } else if (mode === 'variant') {
                setGeneratedVariants({
                    A: (object as any).variantA,
                    B: (object as any).variantB
                });
            }
        }
    }, [object, mode]);

    // ── Fetch History ──────────────────────────────────────────
    const fetchHistory = useCallback(async (autoSelectLatest = false, targetMode?: string) => {
        if (!projectId) return;
        setIsLoadingHistory(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/socials`);
            const data = await res.json();
            if (res.ok) {
                const logs = data.socials || [];
                setHistory(logs);
                
                // USER REQUEST: Detect completion and automatically set new post as active preview
                if (autoSelectLatest && logs.length > 0) {
                    if (targetMode === 'single' && logs[0].type === 'single') {
                        setContent(logs[0].content);
                        setPlatform(logs[0].platform || 'twitter');
                        toast.success("Generation complete and loaded into preview.");
                    } else if (targetMode === 'variant' && logs.length >= 2) {
                        // For variants, we usually generate 2 at a time
                        const latestA = logs.find((l: any) => l.type === 'variant' && l.variantLabel === 'A');
                        const latestB = logs.find((l: any) => l.type === 'variant' && l.variantLabel === 'B');
                        if (latestA && latestB) {
                            setGeneratedVariants({
                                A: { content: latestA.content, strategy: latestA.strategy },
                                B: { content: latestB.content, strategy: latestB.strategy }
                            });
                            toast.success("Variants loaded from history.");
                        }
                    } else if (targetMode === 'pack' && logs[0].type === 'pack') {
                        // For a pack, collect all posts generated in the same batch (within 5 seconds of the latest)
                        const timeThreshold = new Date(logs[0].createdAt).getTime() - 5000;
                        const latestPack = logs.filter((h: any) => h.type === 'pack' && new Date(h.createdAt).getTime() > timeThreshold);
                        if (latestPack.length > 0) {
                            setGeneratedPosts(latestPack.map((p: any) => ({
                                platform: p.platform,
                                content: p.content,
                                hashtags: p.hashtags || [],
                                charCount: p.content.length || 0
                            })));
                            toast.success("Content Pack loaded into layout.");
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch social history", err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // ── Generate ─────────────────────────────────────────────
    const handleGenerate = async () => {
        console.log("[Social Studio] handleGenerate triggered", { projectId, mode, synthesisMode });
        if (!projectId) {
            toast.error("No project selected.");
            return;
        }

        const body = {
            projectId,
            mode,
            platform: mode === 'single' ? platform : undefined,
            prompt: synthesisMode === 'manual' ? prompt : `Generate high-impact social media content for ${mode === 'single' ? platform : 'multi-platform'} centered on the project's core mission and USP.`
        };

        if (mode === 'single') {
            setContent("");
            const { prompt: userPrompt, ...rest } = body;
            complete(userPrompt || "", { body: rest });
        } else if (mode === 'pack' || mode === 'variant') {
            if (mode === 'pack') setGeneratedPosts([]);
            else setGeneratedVariants({});
            submit(body);
        } else {
            toast.warning("Campaign mode is currently in blueprint phase.");
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const loadFromHistory = (item: any) => {
        setPlatform(item.platform || 'twitter');
        setContent(item.content);
        if (item.type === 'pack') {
            // If it was a pack, we might want to handle it differently, 
            // but for now let's just load the content into the single editor
            setMode('single');
        }
        toast.info("Loaded from history.");
    };

    // ── Publish ──────────────────────────────────────────────
    const handlePublish = async (postContent: string, postPlatform: string) => {
        if (!projectId || !postContent) return;

        setIsPublishing(true);
        const promise = fetch("/api/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectId,
                platform: postPlatform,
                content: postContent
            }),
        });

        toast.promise(promise, {
            loading: `Protocol: Dispatching to ${postPlatform}...`,
            success: (res) => {
                if (!res.ok) throw new Error("Handshake failed");
                return `Successfully published to ${postPlatform}!`;
            },
            error: (err) => `Publication failed: ${err.message}`,
            finally: () => setIsPublishing(false)
        });
    };

    const charCount = content.length;
    const charLimit = PLATFORMS[platform as keyof typeof PLATFORMS]?.limit || 280;
    const progress = Math.min((charCount / charLimit) * 100, 100);
    const isOverLimit = charCount > charLimit;

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-200">
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 pb-24">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-border/10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Share2 className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                                Social Studio
                            </h1>
                        </div>
                        <p className="text-muted-foreground italic text-sm">
                            Platform-aware viral resonance engine.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleCopy(content)}
                            className="border-border/10 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 font-bold h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest"
                            disabled={!content}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Post
                        </Button>

                        <Button 
                            onClick={() => handlePublish(content, platform)}
                            disabled={isPublishing || !content || isOverLimit}
                            className="bg-white text-black hover:bg-zinc-200 font-bold h-10 px-8 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-white/5 transition-all active:scale-95"
                        >
                            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Publish Now
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Sidebar: Config & History */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden border-t border-white/5">
                            <CardHeader className="p-6 border-b border-white/5">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-500" />
                                    Strategy & Focus
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Mode Selection */}
                                <div className="grid grid-cols-4 gap-2 bg-zinc-900/50 p-1 rounded-xl">
                                    {[
                                        { id: 'single', icon: Smartphone, label: 'Single' },
                                        { id: 'pack', icon: Layers, label: 'Pack' },
                                        { id: 'variant', icon: GitCompareArrows, label: 'A/B' },
                                        { id: 'campaign', icon: Rocket, label: 'Launch' }
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        return (
                                            <button 
                                                key={m.id}
                                                onClick={() => setMode(m.id as any)}
                                                className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg transition-all ${mode === m.id ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span className="text-[8px] font-black uppercase tracking-tighter">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Platform Focus */}
                                <AnimatePresence mode="wait">
                                    {(mode === 'single' || mode === 'variant') && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3 overflow-hidden"
                                        >
                                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Platform Focus</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {Object.values(PLATFORMS).map((p) => {
                                                    const Icon = p.icon;
                                                    return (
                                                        <button 
                                                            key={p.id}
                                                            onClick={() => setPlatform(p.id)}
                                                            className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all border ${platform === p.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-900/50 border-white/5 text-zinc-600 hover:text-zinc-400'}`}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            <span className="text-[7px] font-black uppercase tracking-tighter">{p.id}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Synthesis Mode */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex p-1 bg-zinc-900/50 rounded-lg border border-white/5">
                                        <button 
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${synthesisMode === 'auto' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            onClick={() => setSynthesisMode('auto')}
                                        >
                                            Automatic
                                        </button>
                                        <button 
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${synthesisMode === 'manual' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            onClick={() => setSynthesisMode('manual')}
                                        >
                                            Manual
                                        </button>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {synthesisMode === 'manual' && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden space-y-2"
                                            >
                                                <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Draft Topic</label>
                                                <Textarea 
                                                    placeholder="e.g. 'Announcement of our new feature X'"
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    className="bg-zinc-900/50 border-border/10 rounded-xl min-h-[100px] text-sm focus-visible:ring-indigo-500/30 font-medium"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black h-12 uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || (synthesisMode === 'manual' && !prompt)}
                                >
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {isGenerating ? "Synthesizing..." : "Generate Masterpiece"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* History Card */}
                        <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden max-h-[400px] flex flex-col border-t border-white/5">
                            <CardHeader className="p-6 border-b border-white/5 shrink-0">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <History className="h-4 w-4 text-sky-500" />
                                    Dispatch History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1">
                                {isLoadingHistory ? (
                                    <div className="p-12 flex flex-col items-center justify-center gap-3 opacity-20">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Accessing Logs...</p>
                                    </div>
                                ) : history.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {history.map((log) => (
                                            <div 
                                                key={log.id} 
                                                className="p-4 hover:bg-white/5 cursor-pointer transition-colors group"
                                                onClick={() => loadFromHistory(log)}
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="text-xs">
                                                            {(() => {
                                                                const config = PLATFORMS[log.platform as keyof typeof PLATFORMS];
                                                                const Icon = config?.icon || Globe;
                                                                return <Icon className="w-3 h-3" />;
                                                            })()}
                                                        </span>
                                                        <h4 className="text-[10px] font-bold truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{log.content}</h4>
                                                    </div>
                                                    <Badge className="bg-zinc-800 text-zinc-400 text-[8px] border-none shrink-0 font-black">
                                                        {log.content.length} CH
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Clock className="h-3 w-3 text-zinc-600" />
                                                    <span className="text-[9px] text-zinc-500 font-medium">
                                                        {new Date(log.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                                        <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center opacity-30 shadow-inner">
                                            <Trash2 className="h-6 w-6" />
                                        </div>
                                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-relaxed">No historic drafts<br/>found in registry.</p>
                                    </div>
                                ) }
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Workspace */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Status Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Platform', value: PLATFORMS[platform as keyof typeof PLATFORMS]?.name || 'Auto', color: 'text-indigo-400' },
                                { label: 'Char Count', value: `${charCount} / ${charLimit}`, color: isOverLimit ? 'text-rose-500' : 'text-zinc-500' },
                                { label: 'Type', value: mode.toUpperCase(), color: 'text-violet-400' },
                                { label: 'Status', value: isPublishing ? 'PUBLISHING' : 'DRAFT', color: 'text-zinc-500' }
                            ].map((stat, i) => (
                                <Card key={i} className="bg-zinc-900/40 border-white/5 rounded-xl p-4">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">{stat.label}</p>
                                    <p className={`text-xs font-bold ${stat.color}`}>{stat.value}</p>
                                </Card>
                            ))}
                        </div>

                        {/* Editor/Mockup Toggle */}
                        <Tabs defaultValue="mockup" className="space-y-6">
                            <TabsList className="bg-zinc-900/50 p-1 border border-border/10 rounded-xl w-full md:w-auto h-12">
                                <TabsTrigger value="mockup" className="flex-1 data-[state=active]:bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest px-8 h-10 gap-2">
                                    <Smartphone className="h-3.5 w-3.5" />
                                    Live Mockup
                                </TabsTrigger>
                                <TabsTrigger value="editor" className="flex-1 data-[state=active]:bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest px-8 h-10 gap-2">
                                    <PenTool className="h-3.5 w-3.5" />
                                    Fine-Tune
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="mockup" className="m-0 focus-visible:outline-none">
                                <div className="h-full flex flex-col items-center justify-center py-12">
                                    <AnimatePresence mode="wait">
                                        {mode === 'single' ? (
                                            <motion.div 
                                                key="mockup-single"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="relative group"
                                            >
                                                <PlatformMockup 
                                                    platform={platform} 
                                                    content={completion || content} 
                                                />
                                                <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                                            </motion.div>
                                        ) : mode === 'variant' ? (
                                            <motion.div 
                                                key="mockup-variants"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
                                            >
                                                {(generatedVariants.A || generatedVariants.B) ? (
                                                    ['A', 'B'].map((label) => {
                                                        const v = generatedVariants[label as 'A' | 'B'];
                                                        return (
                                                            <motion.div 
                                                                key={label}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="flex flex-col items-center gap-4"
                                                            >
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge className="bg-violet-600 text-white font-black uppercase tracking-widest text-[10px] px-3">{label}</Badge>
                                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight truncate max-w-[200px]">{v?.strategy || 'Synthesizing strategy...'}</span>
                                                                </div>
                                                                <PlatformMockup 
                                                                    platform={platform} 
                                                                    content={v?.content || ''} 
                                                                />
                                                                <Button 
                                                                    onClick={() => {
                                                                        if (v?.content) setContent(v.content);
                                                                        toast.success(`Variant ${label} selected!`);
                                                                    }}
                                                                    disabled={!v?.content}
                                                                    className="w-full max-w-[340px] bg-white text-black hover:bg-zinc-200 font-black uppercase text-[10px] tracking-widest h-10 rounded-xl"
                                                                >
                                                                    Select Variant {label}
                                                                </Button>
                                                            </motion.div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="col-span-full h-96 flex flex-col items-center justify-center text-muted-foreground italic gap-4">
                                                        <div className="w-16 h-16 rounded-2xl border border-zinc-800 flex items-center justify-center bg-zinc-900/40 animate-pulse">
                                                            <GitCompareArrows className="h-6 w-6 opacity-20" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Generating dual creative variations...</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div 
                                                key="mockup-grid"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
                                            >
                                                {generatedPosts.length > 0 ? generatedPosts.map((post, idx) => (
                                                    <motion.div 
                                                        key={idx}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="flex flex-col items-center gap-4"
                                                    >
                                                        <PlatformMockup 
                                                            platform={post.platform} 
                                                            content={post.content} 
                                                        />
                                                        <div className="flex w-full max-w-[340px] gap-2">
                                                            <Button 
                                                                variant="outline"
                                                                onClick={() => handleCopy(post.content)}
                                                                className="flex-1 bg-zinc-900 border-white/5 rounded-xl font-black uppercase text-[8px] tracking-widest h-10"
                                                            >
                                                                Copy
                                                            </Button>
                                                            <Button 
                                                                onClick={() => handlePublish(post.content, post.platform)}
                                                                disabled={isPublishing}
                                                                className="flex-[2] bg-indigo-600 text-white hover:bg-indigo-700 transition-colors rounded-xl font-black uppercase text-[8px] tracking-widest h-10 shadow-lg shadow-indigo-500/20"
                                                            >
                                                                Publish to {post.platform}
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                )) : (
                                                    <div className="col-span-full h-96 flex flex-col items-center justify-center text-muted-foreground italic gap-4">
                                                        <div className="w-16 h-16 rounded-2xl border border-zinc-800 flex items-center justify-center bg-zinc-900/40 animate-pulse">
                                                            <Layers className="h-6 w-6 opacity-20" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Generate a pack to see multi-platform previews</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </TabsContent>

                            <TabsContent value="editor" className="focus-visible:outline-none">
                                <Card className="border-none bg-zinc-900/20 rounded-2xl overflow-hidden shadow-none relative mt-4">
                                    <div className="p-1 rounded-full absolute -top-1 left-6 w-12 bg-white/5" />
                                    <CardContent className="p-0">
                                        <Textarea
                                            placeholder="Generated content will appear here for fine-tuning..."
                                            value={completion || content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="min-h-[500px] font-sans text-xl bg-transparent border-0 focus-visible:ring-0 resize-none custom-scrollbar p-12 leading-[1.6] text-zinc-300 placeholder:opacity-20 transition-all focus:placeholder:opacity-0"
                                        />
                                        
                                        <div className="px-12 py-6 border-t border-white/5 bg-black/20 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">Compliance</span>
                                                    <span className={`text-[10px] font-bold ${isOverLimit ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {isOverLimit ? 'LIMIT EXCEEDED' : 'READY FOR BROADCAST'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Progress value={progress} className={`w-48 h-1 ${isOverLimit ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500'}`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
