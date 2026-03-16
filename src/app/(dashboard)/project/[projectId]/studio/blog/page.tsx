"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { 
    FileText, Sparkles, Eye, Globe, Send, Loader2, 
    History, Clock, CheckCircle2, AlertCircle, 
    Layout, PenTool, Search, Trash2, ExternalLink, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ConnectorId } from "@/lib/connectors/types";

// Blog connectors available for publishing
const BLOG_CONNECTORS: { id: ConnectorId; name: string; icon: string }[] = [
    { id: "devto",    name: "Dev.to",    icon: "📝" },
    { id: "hashnode", name: "Hashnode",  icon: "📘" },
    { id: "medium",   name: "Medium",    icon: "📰" },
    { id: "ghost",    name: "Ghost",     icon: "👻" },
];

interface BlogEntry {
    id: string;
    title: string;
    body: string;
    tags: string[];
    createdAt: string;
    status: string;
}

const blogSchema = z.object({
    title: z.string(),
    body: z.string(),
    tags: z.array(z.string()),
});

export default function BlogEnginePage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [format, setFormat]     = useState("markdown");
    const [title, setTitle]       = useState("");
    const [content, setContent]   = useState("");
    const [topic, setTopic]       = useState("");
    const [tags, setTags]         = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    
    const [synthesisMode, setSynthesisMode] = useState<"auto" | "manual">("auto");
    const [isPublishing, setIsPublishing] = useState(false);
    const [activeTab, setActiveTab] = useState("editor");


    const { object, submit, isLoading: isStreaming } = useObject({
        api: "/api/studio/generate",
        schema: blogSchema,
        onFinish: () => {
            fetchHistory();
            toast.success("Blog post synthesized and saved to history!");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    useEffect(() => {
        if (object) {
            if (object.title) setTitle(object.title);
            if (object.body) setContent(object.body);
            if (object.tags) setTags(object.tags as string[]);
            setActiveTab("editor");
        }
    }, [object]);

    const isGenerating = isStreaming;

    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [history, setHistory] = useState<BlogEntry[]>([]);

    // ── Fetch History ──────────────────────────────────────────
    const fetchHistory = useCallback(async () => {
        if (!projectId) return;
        setIsLoadingHistory(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/blogs`);
            const data = await res.json();
            if (res.ok) setHistory(data.blogs || []);
        } catch (err) {
            console.error("Failed to fetch blog history", err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // ── Generate ─────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!projectId) {
            toast.error("Invalid project context.");
            return;
        }

        setTitle("");
        setContent("");
        setTags([]);
        
        submit({
            projectId,
            prompt: synthesisMode === "manual" && topic 
                ? `Generate an SEO-optimized long-form blog post about "${topic}" in ${format} format. Return JSON with keys: title (string), body (string in ${format}), tags (string[]).`
                : `Generate an SEO-optimized long-form blog post centered on the project's core mission in ${format} format. Return JSON with keys: title (string), body (string in ${format}), tags (string[]).`,
            format: "blog",
        });
    };

    // ── Publish ───────────────────────────────────────────────
    const handlePublish = async (connectorId: ConnectorId) => {
        if (!projectId) {
            toast.error("Invalid project context.");
            return;
        }
        if (!title.trim() || !content.trim()) {
            toast.error("Generate or write a blog post first.");
            return;
        }
        setIsPublishing(true);
        try {
            const res = await fetch("/api/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    connectorId,
                    title,
                    body: content,
                    tags,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(
                data.url
                    ? `Published! View at: ${data.url}`
                    : "Published successfully!",
            );
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDownload = () => {
        if (!content) {
            toast.error("No content to download.");
            return;
        }
        
        const fileExtension = format === "html" ? "html" : "md";
        const fileName = `${title.toLowerCase().replace(/\s+/g, "-") || "blog-post"}.${fileExtension}`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(`Downloaded as ${fileExtension.toUpperCase()}`);
    };

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
        setTagInput("");
    };

    const loadFromHistory = (blog: BlogEntry) => {
        setTitle(blog.title);
        setContent(blog.body);
        setTags(blog.tags || []);
        setActiveTab("editor");
        toast.info("Loaded draft from history.");
    };

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-200">
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-border/10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                                Blog Studio
                            </h1>
                        </div>
                        <p className="text-muted-foreground italic text-sm">
                            SEO-optimized storytelling architecture.
                        </p>
                    </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Select value={format} onValueChange={setFormat}>
                                <SelectTrigger className="w-40 bg-zinc-900/50 border-border/10 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-border/10">
                                    <SelectItem value="markdown">Markdown</SelectItem>
                                    <SelectItem value="html">HTML</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={handleDownload}
                                className="border-border/10 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 font-bold h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest"
                                disabled={!content}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="border-border/10 bg-zinc-900/50 hover:bg-zinc-900 text-violet-400 font-bold h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest"
                                    disabled={isPublishing || !content}
                                >
                                    {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Publish
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-950 border-border/10 w-56">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500">Destination</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                {BLOG_CONNECTORS.map((c) => (
                                    <DropdownMenuItem
                                        key={c.id}
                                        className="gap-3 cursor-pointer p-3 hover:bg-violet-600/10 focus:bg-violet-600/20"
                                        onClick={() => handlePublish(c.id)}
                                    >
                                        <span className="text-lg">{c.icon}</span>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{c.name}</span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Sidebar: Config & History */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden">
                            <CardHeader className="p-6 border-b border-white/5">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-500" />
                                    Synthesis Focus
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex p-1 bg-zinc-900/50 rounded-lg border border-white/5">
                                    <button 
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${synthesisMode === 'auto' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => setSynthesisMode('auto')}
                                    >
                                        Automatic
                                    </button>
                                    <button 
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${synthesisMode === 'manual' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                                            <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Topic or Angle</label>
                                            <Textarea 
                                                placeholder="e.g. 'A technical deep dive into X'"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                className="bg-zinc-900/50 border-border/10 rounded-xl min-h-[100px] text-sm focus-visible:ring-violet-500/30"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black h-12 uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenTool className="mr-2 h-4 w-4" />}
                                    {isGenerating ? "Synthesizing Content..." : "Generate masterpiece"}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden max-h-[500px] flex flex-col">
                            <CardHeader className="p-6 border-b border-white/5 shrink-0">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <History className="h-4 w-4 text-sky-500" />
                                    Draft History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1">
                                {isLoadingHistory ? (
                                    <div className="p-12 flex flex-col items-center justify-center gap-3 opacity-20">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Accessing Archives...</p>
                                    </div>
                                ) : history.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {history.map((blog) => (
                                            <div 
                                                key={blog.id} 
                                                className="p-4 hover:bg-white/5 cursor-pointer transition-colors group"
                                                onClick={() => loadFromHistory(blog)}
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <h4 className="text-xs font-bold truncate group-hover:text-violet-400 transition-colors uppercase tracking-tight">{blog.title}</h4>
                                                    <Badge className="bg-zinc-800 text-zinc-400 text-[8px] border-none shrink-0 font-black">
                                                        {blog.body.length} CH
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Clock className="h-3 w-3 text-zinc-600" />
                                                    <span className="text-[9px] text-zinc-500 font-medium">
                                                        {new Date(blog.createdAt).toLocaleDateString()}
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
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Workspace: Editor & Preview */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="space-y-4">
                            <Input
                                placeholder="Generated headline will appear here..."
                                value={isGenerating && object?.title ? object.title : title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-3xl font-black h-16 bg-transparent border-none px-6 focus-visible:ring-0 placeholder:opacity-20 transition-all focus:placeholder:opacity-0 focus-visible:ring-offset-0"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                                {tags.map((tag) => (
                                    <Badge 
                                        key={tag} 
                                        variant="outline" 
                                        className="bg-violet-500/5 border-violet-500/20 text-violet-400 py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-violet-500/10 cursor-pointer transition-colors"
                                        onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                                    >
                                        #{tag}
                                        <span className="ml-2 opacity-40">×</span>
                                    </Badge>
                                ))}
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="+ TAG"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                        className="h-8 w-24 bg-zinc-900/50 border-white/5 rounded-full text-[9px] font-black tracking-widest uppercase px-3"
                                    />
                                </div>
                            </div>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsList className="bg-zinc-900/50 p-1 border border-border/10 rounded-xl w-full md:w-auto h-12">
                                <TabsTrigger value="editor" className="flex-1 data-[state=active]:bg-violet-600 rounded-lg text-[10px] font-black uppercase tracking-widest px-8 h-10 gap-2">
                                    <PenTool className="h-3.5 w-3.5" />
                                    Creative Editor
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="flex-1 data-[state=active]:bg-violet-600 rounded-lg text-[10px] font-black uppercase tracking-widest px-8 h-10 gap-2">
                                    <Eye className="h-3.5 w-3.5" />
                                    Reader Mode
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="editor" className="m-0 focus-visible:outline-none">
                                <Card className="border-none bg-transparent rounded-lg overflow-hidden shadow-none relative">
                                    <CardContent className="p-0">
                                        <Textarea
                                            placeholder="Waiting for AI synthesis..."
                                            value={isGenerating && object?.body ? object.body : content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="min-h-[700px] font-sans text-lg bg-transparent border-0 focus-visible:ring-0 resize-none custom-scrollbar p-6 leading-[1.8] text-zinc-300 placeholder:opacity-20 transition-all focus:placeholder:opacity-0"
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="preview" className="m-0 focus-visible:outline-none">
                                <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden border-t-4 border-t-sky-500 shadow-2xl">
                                    <CardContent className="p-12 md:p-20 min-h-[700px] prose prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-zinc-400 prose-blue prose-img:rounded-3xl">
                                        {content ? (
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: content
                                                        .replace(/^# (.+)/gm, "<h1>$1</h1>")
                                                        .replace(/^## (.+)/gm, "<h2>$1</h2>")
                                                        .replace(/^### (.+)/gm, "<h3>$1</h3>")
                                                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                                                        .replace(/\*(.+?)\*/g, "<em>$1</em>")
                                                        .replace(/\n\n/g, "</p><p>")
                                                        .replace(/^/, "<p>")
                                                        .replace(/$/, "</p>"),
                                                }}
                                            />
                                        ) : (
                                            <div className="h-[500px] flex flex-col items-center justify-center text-center gap-6 opacity-10">
                                                <Eye className="w-20 h-20" />
                                                <p className="font-black uppercase tracking-[0.5em] text-xl">Preview Hidden</p>
                                            </div>
                                        )}
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
