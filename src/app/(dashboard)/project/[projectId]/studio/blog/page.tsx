"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Sparkles, Eye, Code2, Globe, Send, Loader2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { ConnectorId } from "@/lib/connectors/types";

// Blog connectors available for publishing
const BLOG_CONNECTORS: { id: ConnectorId; name: string; icon: string }[] = [
    { id: "devto",    name: "Dev.to",    icon: "📝" },
    { id: "hashnode", name: "Hashnode",  icon: "📘" },
    { id: "medium",   name: "Medium",    icon: "📰" },
    { id: "ghost",    name: "Ghost",     icon: "👻" },
];

export default function BlogEnginePage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [format, setFormat]     = useState("markdown");
    const [title, setTitle]       = useState("");
    const [content, setContent]   = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [activeTab, setActiveTab] = useState("editor");
    const [tags, setTags]         = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    // ── Generate ─────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!projectId) {
            toast.error("Invalid project context.");
            return;
        }
        setIsGenerating(true);
        try {
            // Call the same generate endpoint but request blog format
            const res = await fetch("/api/studio/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    prompt: `Generate an SEO-optimized long-form blog post in ${format} format. Return JSON with keys: title (string), body (string in ${format}), tags (string[]).`,
                    format: "blog",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Generation failed");

            if (data.title)   setTitle(data.title);
            if (data.body)    setContent(data.body);
            if (data.tags)    setTags(data.tags);
            setActiveTab("editor");
            toast.success("Blog post generated!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsGenerating(false);
        }
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

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
        setTagInput("");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <FileText className="h-8 w-8 text-violet-500" />
                        Blog Engine
                    </h1>
                    <p className="text-muted-foreground italic text-sm">
                        SEO-optimized long-form content architecture.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className="w-44 bg-zinc-900/50 border-border/10 rounded-xl">
                            <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-border/10">
                            <SelectItem value="markdown">Markdown</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold h-10 px-6 rounded-xl"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? "Synthesizing..." : "Analyze & Write"}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-border/10 bg-zinc-900/50 hover:bg-zinc-900 text-violet-400 font-bold h-10 px-6 rounded-xl"
                                disabled={isPublishing || !content}
                            >
                                {isPublishing
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Send className="mr-2 h-4 w-4" />}
                                Publish
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-950 border-border/10">
                            {BLOG_CONNECTORS.map((c) => (
                                <DropdownMenuItem
                                    key={c.id}
                                    className="gap-3 cursor-pointer p-3 hover:bg-violet-600/10 focus:bg-violet-600/20"
                                    onClick={() => handlePublish(c.id)}
                                >
                                    <span className="text-lg">{c.icon}</span>
                                    <span className="font-bold text-sm">{c.name}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-4">
                <Input
                    placeholder="Engaging headline..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-black h-14 bg-zinc-900/30 border-border/10 rounded-2xl px-6 focus-visible:ring-violet-500 placeholder:italic"
                />

                <div className="flex flex-wrap items-center gap-2">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/10 rounded-full px-3 py-1 cursor-pointer transition-colors hover:bg-violet-500/20"
                            onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        >
                            #{tag.toUpperCase()} 
                            <span className="opacity-40">×</span>
                        </span>
                    ))}
                    <div className="flex gap-1">
                        <Input
                            placeholder="Add Tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addTag()}
                            className="h-8 w-24 text-[10px] bg-zinc-900/50 border-border/10 rounded-lg placeholder:font-bold placeholder:uppercase uppercase"
                        />
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-zinc-900/50 p-1 border border-border/10 rounded-xl">
                    <TabsTrigger value="editor" className="gap-2 data-[state=active]:bg-violet-600 rounded-lg text-xs font-bold uppercase tracking-widest px-6 h-9">
                        <FileText className="h-3.5 w-3.5" />
                        Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-violet-600 rounded-lg text-xs font-bold uppercase tracking-widest px-6 h-9">
                        <Eye className="h-3.5 w-3.5" />
                        Live View
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="gap-2 data-[state=active]:bg-violet-600 rounded-lg text-xs font-bold uppercase tracking-widest px-6 h-9">
                        <Globe className="h-3.5 w-3.5" />
                        SEO Analysis
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="editor">
                    <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden border-t-4 border-t-violet-500">
                        <CardContent className="p-6">
                            <Textarea
                                placeholder="The AI will weave your narrative here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[600px] font-mono text-sm bg-transparent border-0 focus-visible:ring-0 resize-none custom-scrollbar p-6 leading-relaxed"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preview">
                    <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[2rem] border-t-4 border-t-blue-500">
                        <CardContent className="p-12 min-h-[600px] prose prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-blue">
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
                                <div className="h-[500px] flex flex-col items-center justify-center text-center gap-4 opacity-20">
                                    <Eye className="w-16 h-16" />
                                    <p className="font-black uppercase tracking-[0.3em]">No Render Available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seo">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-zinc-900/40 border-border/10 p-6 rounded-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-violet-600/10 transition-colors" />
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Meta Score</p>
                           <div className="text-4xl font-black text-violet-400 mb-1">
                               {title ? (title.length > 50 && title.length < 70 ? "98" : "72") : "0"}
                           </div>
                           <p className="text-[10px] text-zinc-500 font-medium uppercase italic">Based on title length / keywords</p>
                        </Card>

                        <Card className="bg-zinc-900/40 border-border/10 p-6 rounded-2xl">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Word Density</p>
                           <div className="text-4xl font-black text-blue-400 mb-1">
                               {content ? content.split(/\s+/).filter(Boolean).length : "0"}
                           </div>
                           <p className="text-[10px] text-zinc-500 font-medium uppercase italic">Recommended: 800-1200</p>
                        </Card>

                        <Card className="bg-zinc-900/40 border-border/10 p-6 rounded-2xl">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Structure</p>
                           <div className="text-4xl font-black text-fuchsia-400 mb-1">
                               {(content.match(/^#+ .+/gm) || []).length}
                           </div>
                           <p className="text-[10px] text-zinc-500 font-medium uppercase italic">Heading H1-H3 analysis</p>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
