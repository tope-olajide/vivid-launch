"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, Send, Loader2, Twitter, Linkedin, Instagram, 
    Facebook, Globe, User, MessageCircle, Heart, Share2, 
    Layers, Rocket, Smartphone, CheckCircle2, ChevronRight,
    Search, Layout
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    tiktok: { id: "tiktok", name: "TikTok", icon: MessageCircle, color: "text-cyan-400", bg: "bg-cyan-400/10", limit: 150 },
    facebook: { id: "facebook", name: "Facebook", icon: Facebook, color: "text-[#1877F2]", bg: "bg-[#1877F2]/10", limit: 63206 },
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

export default function SocialStudioPage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId");
    const [mode, setMode] = useState<"single" | "pack" | "campaign">("single");
    const [platform, setPlatform] = useState<string>("twitter");
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [content, setContent] = useState("");
    const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);

    const charCount = content.length;
    const charLimit = PLATFORMS[platform as keyof typeof PLATFORMS]?.limit || 280;
    const progress = Math.min((charCount / charLimit) * 100, 100);
    const isOverLimit = charCount > charLimit;

    // ── Generate ─────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!projectId) {
            toast.error("No project selected.");
            return;
        }

        setIsGenerating(true);
        setContent("");
        setGeneratedPosts([]);

        try {
            const res = await fetch("/api/studio/social", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    mode,
                    platform: mode === 'single' ? platform : undefined,
                    prompt
                }),
            });

            if (!res.ok) throw new Error("Generation failed");

            if (mode === 'single') {
                // Use streamText style reading
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                if (!reader) return;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    // AI SDK stream format usually starts with 0: for text
                    const text = chunk.split('\n')
                        .filter(l => l.startsWith('0:'))
                        .map(l => JSON.parse(l.substring(2)))
                        .join('');
                    setContent(prev => prev + text);
                }
            } else {
                // Handle streamObject (json stream)
                // For simplicity in the MVP, we assume non-streaming JSON for Pack/Campaign 
                // OR we just use regular POST if we want faster iteration
                const data = await res.json();
                if (data.posts) setGeneratedPosts(data.posts);
                toast.success("Content Pack generated!");
            }

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Left Column: AI Configuration */}
            <div className="w-[400px] border-r border-border/40 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-zinc-950/20">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-500" />
                        Social Studio
                    </h1>
                    <p className="text-xs text-muted-foreground italic">Platform-aware viral content engine</p>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-900/50 p-1 rounded-xl">
                    <button 
                        onClick={() => setMode('single')}
                        className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg transition-all ${mode === 'single' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Smartphone className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Single</span>
                    </button>
                    <button 
                        onClick={() => setMode('pack')}
                        className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg transition-all ${mode === 'pack' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Layers className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Pack</span>
                    </button>
                    <button 
                        onClick={() => setMode('campaign')}
                        className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg transition-all ${mode === 'campaign' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Rocket className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Launch</span>
                    </button>
                </div>

                {/* Config Panel */}
                <AnimatePresence mode="wait">
                    {mode === 'single' && (
                        <motion.div 
                            key="single"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Target Platform</label>
                            <div className="grid grid-cols-5 gap-2">
                                {Object.values(PLATFORMS).map((p) => {
                                    const Icon = p.icon;
                                    return (
                                        <button 
                                            key={p.id}
                                            onClick={() => setPlatform(p.id)}
                                            className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all border ${platform === p.id ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-zinc-900/50 border-transparent text-zinc-600 hover:text-zinc-400'}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="text-[8px] font-bold">{p.name.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Idea or Topic</label>
                    <Textarea 
                        placeholder={mode === 'campaign' ? "What are we launching today?" : "What should we post about?"}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="bg-zinc-900/50 border-zinc-800 resize-none h-32 focus-visible:ring-violet-500 font-medium placeholder:italic text-sm"
                    />
                </div>

                <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !prompt}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 h-10 font-bold uppercase tracking-wider relative group overflow-hidden"
                >
                    {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4 group-hover:scale-125 transition-transform" />
                            {mode === 'single' ? 'Generate Post' : mode === 'pack' ? 'Assemble Pack' : 'Launch Campaign'}
                        </>
                    )}
                    <span className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </Button>

                {/* Real-time Analytics Preview */}
                <div className="mt-auto p-4 rounded-xl bg-violet-600/5 border border-violet-500/10 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-violet-400/80 uppercase tracking-widest">Character Counter</span>
                        <span className={`text-[10px] font-mono ${isOverLimit ? 'text-rose-500' : 'text-zinc-500'}`}>
                            {charCount} / {charLimit}
                        </span>
                    </div>
                    <Progress value={progress} className={`h-1.5 ${isOverLimit ? '[&>div]:bg-rose-500' : '[&>div]:bg-violet-500'}`} />
                    <p className="text-[9px] text-zinc-500/60 leading-tight">
                        Character counts include mentions and hashtags. Platform limits are strictly enforced.
                    </p>
                </div>
            </div>

            {/* Right Column: Live Mockup / Previews */}
            <div className="flex-1 p-8 bg-zinc-950/40 relative overflow-y-auto custom-scrollbar">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent pointer-events-none" />
                
                <AnimatePresence mode="wait">
                    {mode === 'single' ? (
                        <motion.div 
                            key="mockup-single"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="h-full flex flex-col items-center justify-center gap-8"
                        >
                            <div className="relative group">
                                <PlatformMockup platform={platform} content={content} />
                                <div className="absolute -inset-4 bg-violet-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button variant="outline" className="border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 gap-2 h-10 px-6">
                                    <Layout className="h-4 w-4 text-violet-400" />
                                    <span>Copy Markdown</span>
                                </Button>
                                <Button className="bg-white text-black hover:bg-zinc-200 gap-2 h-10 px-8 font-bold">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Publish Now</span>
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="mockup-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                            {generatedPosts.length > 0 ? generatedPosts.map((post, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <PlatformMockup platform={post.platform} content={post.content} />
                                </motion.div>
                            )) : (
                                <div className="col-span-full h-96 flex flex-col items-center justify-center text-muted-foreground italic gap-4">
                                    <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 animate-pulse">
                                        <Layers className="h-6 w-6 opacity-20" />
                                    </div>
                                    <p className="text-sm">Generate a pack to see multi-platform previews</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
