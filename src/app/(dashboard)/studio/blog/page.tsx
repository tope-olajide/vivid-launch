"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Sparkles, Eye, Code2, Globe, Send, Loader2 } from "lucide-react";
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
    const searchParams = useSearchParams();
    const projectId    = searchParams.get("projectId");

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
            toast.error("No project selected. Add ?projectId=xxx to the URL.");
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

            // The generate endpoint may stream JSON. Try to parse what we get.
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
            toast.error("No project selected.");
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
        <motion.div
            className="p-6 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Blog Engine</h1>
                    <p className="text-muted-foreground mt-1">
                        SEO-optimized long-form content — generate, edit, and publish
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Output Format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="markdown">Markdown (Ghost/Dev.to)</SelectItem>
                            <SelectItem value="html">HTML (Strapi)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? "Generating..." : "Generate Post"}
                    </Button>

                    {/* Publish Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-violet-500/40 hover:bg-violet-500/10 text-violet-400"
                                disabled={isPublishing || !content}
                            >
                                {isPublishing
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Send className="mr-2 h-4 w-4" />}
                                Publish to...
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {BLOG_CONNECTORS.map((c) => (
                                <DropdownMenuItem
                                    key={c.id}
                                    className="gap-2 cursor-pointer"
                                    onClick={() => handlePublish(c.id)}
                                >
                                    <span>{c.icon}</span>
                                    {c.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Title Input */}
            <Input
                placeholder="Post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold h-12 bg-card/50 border-border/50"
            />

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-2.5 py-0.5 cursor-pointer"
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    >
                        #{tag} ×
                    </span>
                ))}
                <div className="flex gap-1">
                    <Input
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag()}
                        className="h-7 w-28 text-xs"
                    />
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={addTag}>
                        +
                    </Button>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="editor" className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="gap-1.5">
                        <Code2 className="h-3.5 w-3.5" />
                        Source
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        SEO
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="editor">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <Textarea
                                placeholder="Your blog post content will appear here after generation, or start typing..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[500px] font-mono text-sm bg-transparent border-0 focus-visible:ring-0 resize-none"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preview">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-8 min-h-[500px] prose prose-invert max-w-none">
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
                                <p className="text-muted-foreground text-center mt-20">
                                    Preview will appear after generation
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="code">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-4 min-h-[500px]">
                            <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap text-muted-foreground">
                                {content || "Source code will appear after generation"}
                            </pre>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seo">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-8 min-h-[500px]">
                            {content ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Meta Title</p>
                                        <p className="font-medium">{title || "(no title)"}</p>
                                        <p className={`text-xs ${(title || "").length > 60 ? "text-amber-500" : "text-green-500"}`}>
                                            {(title || "").length}/60 characters
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Word Count</p>
                                        <p className="text-2xl font-bold">{content.split(/\s+/).filter(Boolean).length}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Tags</p>
                                        <p>{tags.length > 0 ? tags.map((t) => `#${t}`).join(" ") : "No tags"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Headings Found</p>
                                        <p>{(content.match(/^#+ .+/gm) || []).length} headings</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-sm text-muted-foreground">
                                        Meta title, description, and headings analysis will appear here
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
