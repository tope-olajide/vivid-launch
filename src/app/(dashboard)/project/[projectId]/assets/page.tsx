"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Image as ImageIcon,
    FileText,
    BrainCircuit,
    Sparkles,
    Loader2,
    Globe,
    Target,
    Zap,
    ExternalLink,
    ChevronRight,
    Search,
    Filter,
    Download,
    Eye,
    Upload,
    Trash2,
    Plus,
    X,
    VideoIcon,
    FileImage,
    MessageSquare,
    Link as LinkIcon,
    Edit3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Asset {
    id: string;
    name: string;
    type: string;
    gcsUrl: string;
    projectId: string;
    createdAt: string;
    status: string;
}

interface Blog {
    id: string;
    title: string;
    description?: string;
    createdAt: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    tagline?: string;
    targetAudience?: string;
    websiteUrl?: string;
    brandVoice?: {
        tone: number;
        humor: number;
        formality: number;
        emojiUsage: number;
    };
}

export default function AssetsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingAsset, setIsAddingAsset] = useState(false);
    const [addType, setAddType] = useState<"media" | "url">("media");
    const [isUploading, setIsUploading] = useState(false);

    // Form states
    const [urlValue, setUrlValue] = useState("");
    const [urlLabel, setUrlLabel] = useState("");
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        try {
            // Fetch Project
            const projRes = await fetch(`/api/projects`);
            const projData = await projRes.json();
            const found = projData.projects.find((p: Project) => p.id === projectId);
            setProject(found || null);

            // Fetch Assets
            const assetRes = await fetch(`/api/assets?projectId=${projectId}`);
            const assetData = await assetRes.json();
            setAssets(assetData.assets || []);

            // Fetch Blogs
            const blogRes = await fetch(`/api/projects/${projectId}/blogs`);
            const blogData = await blogRes.json();
            setBlogs(blogData.blogs || []);
        } catch (err) {
            console.error("Failed to fetch assets data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAsset = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove "${name}"?`)) return;

        try {
            const res = await fetch(`/api/assets?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Asset ejected from registry");
                setAssets(prev => prev.filter(a => a.id !== id));
            } else {
                throw new Error("Failed to delete asset");
            }
        } catch (err) {
            toast.error("Deletion failed");
        }
    };

    const handleDeleteBlog = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete the blog "${title}"?`)) return;

        try {
            const res = await fetch(`/api/projects/${projectId}/blogs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Blog removed from timeline");
                setBlogs(prev => prev.filter(b => b.id !== id));
            } else {
                throw new Error("Failed to delete blog");
            }
        } catch (err) {
            toast.error("Blog deletion failed");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const loadingToast = toast.loading(`Targeting ${file.name} for uplink...`);

        try {
            const urlRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type,
                    projectId
                })
            });

            if (!urlRes.ok) throw new Error(`Failed to get upload URL`);
            const { url, publicUrl } = await urlRes.json();

            const uploadRes = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file
            });

            if (!uploadRes.ok) throw new Error(`Storage uplink failed`);

            const assetRes = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    name: file.name.split('.')[0],
                    type: file.type.startsWith("image") ? "image" : "video",
                    gcsUrl: publicUrl
                })
            });

            if (!assetRes.ok) throw new Error(`Registry update failed`);

            toast.success("Uplink successful!", { id: loadingToast });
            setIsAddingAsset(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message, { id: loadingToast });
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddUrl = async () => {
        if (!urlValue) return;
        setIsUploading(true);
        try {
            const assetRes = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    name: urlLabel || "Website Source",
                    type: "url",
                    gcsUrl: urlValue
                })
            });

            if (assetRes.ok) {
                toast.success("Remote source integrated");
                setIsAddingAsset(false);
                setUrlValue("");
                setUrlLabel("");
                fetchData();
            }
        } catch (err) {
            toast.error("Source integration failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateAsset = async () => {
        if (!editingAsset || !editName) return;
        try {
            const res = await fetch(`/api/assets`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingAsset.id, name: editName })
            });

            if (res.ok) {
                toast.success("Registry entry recalibrated");
                setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, name: editName } : a));
                setEditingAsset(null);
            }
        } catch (err) {
            toast.error("Calibration failed");
        }
    };

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBlogs = blogs.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-[0.2em]">Synchronizing Registry...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <LayoutDashboard className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Project Assets</h1>
                    </div>
                    <p className="text-muted-foreground italic text-sm">
                        The central neural repository for {project?.name || "this project"}'s brand assets and knowledge.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={isAddingAsset} onOpenChange={setIsAddingAsset}>
                        <DialogTrigger asChild>
                            <Button className="bg-violet-600 hover:bg-violet-700 text-white h-11 px-6 rounded-xl shadow-lg shadow-violet-500/20 font-black uppercase tracking-widest text-[10px] gap-2">
                                <Plus className="h-3.5 w-3.5" />
                                Add Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-white/5 rounded-[2.5rem] p-8 max-w-xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">Integrate Asset</DialogTitle>
                                <DialogDescription className="text-zinc-500 italic">Expand your project's knowledge base.</DialogDescription>
                            </DialogHeader>

                            <div className="flex gap-2 p-1 bg-zinc-900 rounded-2xl mb-6">
                                {(["media", "url"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setAddType(t)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addType === t ? "bg-violet-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
                                    >
                                        {t === 'media' ? 'Media Upload' : 'Remote URL'}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {addType === 'media' ? (
                                    <motion.div
                                        key="media"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/5 hover:border-violet-500/20 bg-white/[0.02] rounded-3xl cursor-pointer transition-all group">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                                                    <Upload className="h-6 w-6" />
                                                </div>
                                                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Select Files</p>
                                            </div>
                                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                        </label>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="url"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Source Name</Label>
                                            <Input
                                                placeholder="e.g. Official Documentation"
                                                className="h-12 bg-zinc-900/50 border-white/5 rounded-xl"
                                                value={urlLabel}
                                                onChange={(e) => setUrlLabel(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Destination URL</Label>
                                            <Input
                                                placeholder="https://..."
                                                className="h-12 bg-zinc-900/50 border-white/5 rounded-xl"
                                                value={urlValue}
                                                onChange={(e) => setUrlValue(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleAddUrl}
                                            disabled={!urlValue || isUploading}
                                            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest rounded-xl"
                                        >
                                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Integrate Source"}
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="media" className="space-y-8">
                <div className="flex items-center justify-between border-b border-border/10 pb-4">
                    <TabsList className="bg-transparent gap-8 p-0">
                        <TabsTrigger value="media" className="relative h-10 bg-transparent p-0 text-sm font-bold uppercase tracking-widest data-[state=active]:text-violet-400 group">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Media Gallery
                            <div className="absolute -bottom-4 left-0 right-0 h-1 bg-violet-500 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-left rounded-full" />
                        </TabsTrigger>
                        <TabsTrigger value="content" className="relative h-10 bg-transparent p-0 text-sm font-bold uppercase tracking-widest data-[state=active]:text-sky-400 group">
                            <FileText className="h-4 w-4 mr-2" />
                            Campaign Content
                            <div className="absolute -bottom-4 left-0 right-0 h-1 bg-sky-500 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-left rounded-full" />
                        </TabsTrigger>
                        <TabsTrigger value="brand" className="relative h-10 bg-transparent p-0 text-sm font-bold uppercase tracking-widest data-[state=active]:text-fuchsia-400 group">
                            <BrainCircuit className="h-4 w-4 mr-2" />
                            Brand Identity
                            <div className="absolute -bottom-4 left-0 right-0 h-1 bg-fuchsia-500 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-left rounded-full" />
                        </TabsTrigger>
                    </TabsList>

                    <div className="hidden lg:flex items-center gap-4">
                        <div className="relative group w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                            <Input
                                placeholder="Search by name or type..."
                                className="pl-10 h-10 bg-zinc-900/50 border-white/5 rounded-xl focus:ring-violet-500/20 transition-all text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <TabsContent value="media" className="mt-0 outline-none">
                    <AnimatePresence mode="wait">
                        {filteredAssets.length > 0 ? (
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {filteredAssets.map((asset) => (
                                    <Card key={asset.id} className="group relative border-border/10 bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2rem] hover:border-violet-500/30 transition-all duration-500 cursor-pointer">
                                        <div className="aspect-square relative overflow-hidden">
                                            {asset.type.startsWith('image') ? (
                                                <img
                                                    src={asset.gcsUrl}
                                                    alt={asset.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : asset.type === 'url' ? (
                                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                    <LinkIcon className="h-12 w-12 text-zinc-700" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                    <VideoIcon className="h-12 w-12 text-zinc-700" />
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />

                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteAsset(asset.id, asset.name);
                                                    }}
                                                    className="h-8 w-8 rounded-lg bg-black/60 backdrop-blur-md border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-rose-500 hover:bg-rose-500 hover:text-white"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingAsset(asset);
                                                        setEditName(asset.name);
                                                    }}
                                                    className="h-8 w-8 rounded-lg bg-black/60 backdrop-blur-md border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 delay-75"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            <Badge className="absolute bottom-4 left-4 bg-violet-600/80 backdrop-blur-md border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                                                {asset.type.includes('/') ? asset.type.split('/')[1] : asset.type}
                                            </Badge>
                                        </div>
                                        <CardContent className="p-5 space-y-1">
                                            <p className="text-xs font-black truncate tracking-tight">{asset.name}</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                                                    {new Date(asset.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-[10px] text-emerald-500 font-black tracking-widest uppercase">Verified</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 rounded-[3rem] border-2 border-dashed border-border/10 space-y-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="h-16 w-16 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center text-zinc-700 shadow-inner">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-black text-zinc-400 uppercase tracking-widest">No matching assets</p>
                                    <p className="text-[10px] text-muted-foreground italic">Upload images or videos to populate this workspace.</p>
                                </div>
                                <Button
                                    onClick={() => setIsAddingAsset(true)}
                                    className="h-9 px-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Import First Asset
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TabsContent>

                <TabsContent value="content" className="mt-0 outline-none">
                    <AnimatePresence mode="wait">
                        {filteredBlogs.length > 0 ? (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                {filteredBlogs.map((blog) => (
                                    <Card key={blog.id} className="group relative border-border/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] p-6 hover:border-sky-500/30 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    onClick={() => router.push(`/project/${projectId}/studio/blog`)}
                                                    className="h-8 w-8 rounded-lg"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    onClick={() => handleDeleteBlog(blog.id, blog.title)}
                                                    className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black tracking-tight group-hover:text-sky-400 transition-colors">{blog.title}</h3>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                    Generated on {new Date(blog.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <p className="text-xs text-zinc-400 line-clamp-3 italic">
                                                {blog.description || "Experimental narrative generated by Gemini 3.1 Pro."}
                                            </p>
                                            <div className="pt-4 flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-sky-500/5 text-sky-400 border-none text-[8px] font-black uppercase">Blog Post</Badge>
                                                <Badge variant="secondary" className="bg-emerald-500/5 text-emerald-400 border-none text-[8px] font-black uppercase">Live</Badge>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 rounded-[3rem] border-2 border-dashed border-border/10 space-y-4 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="h-16 w-16 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center text-zinc-700 shadow-inner">
                                    <Sparkles className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-zinc-400 uppercase tracking-widest">No generated content</p>
                                    <p className="text-[10px] text-muted-foreground italic">Fire up the Blog Engine to see AI narratives here.</p>
                                </div>
                                <Button
                                    onClick={() => router.push(`/project/${projectId}/studio/blog`)}
                                    className="h-9 px-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Open Blog Studio
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TabsContent>

                <TabsContent value="brand" className="mt-0 outline-none space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] overflow-hidden p-8 space-y-8">
                            <div className="space-y-4">
                                <Badge variant="outline" className="border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-black tracking-widest uppercase px-3">DNA Mapping</Badge>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tighter">Core Characteristics</h2>
                                    <p className="text-xs text-muted-foreground italic">Neural sliders pulled from project configuration.</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { label: "Vocal Tone", value: project?.brandVoice?.tone || 50, color: "from-violet-500 to-indigo-500", desc: "Aggressive vs Empowering" },
                                    { label: "Humor Threshold", value: project?.brandVoice?.humor || 30, color: "from-fuchsia-500 to-pink-500", desc: "Satirical vs Earnest" },
                                    { label: "Formality Index", value: project?.brandVoice?.formality || 60, color: "from-sky-500 to-blue-500", desc: "Corporate vs Guerrilla" },
                                    { label: "Emoji Density", value: project?.brandVoice?.emojiUsage || 40, color: "from-amber-500 to-orange-500", desc: "Minimalist vs Visual" },
                                ].map((dna, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                                            <span className="text-zinc-400">{dna.label}</span>
                                            <span className="text-white">{dna.value}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                                            <motion.div
                                                className={`h-full rounded-full bg-gradient-to-r ${dna.color}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${dna.value}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-zinc-500 italic font-bold tracking-tight">{dna.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div className="flex flex-col gap-8">
                            <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] overflow-hidden p-8 flex-1 space-y-6">
                                <div className="space-y-4">
                                    <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-400 text-[10px] font-black tracking-widest uppercase px-3">Target Node</Badge>
                                    <h2 className="text-xl font-black tracking-tighter">Audience Definition</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {project?.targetAudience?.split(',').map((tag, j) => (
                                        <div key={j} className="px-4 py-2 bg-zinc-900/80 rounded-2xl border border-white/10 text-xs font-bold text-zinc-300">
                                            {tag.trim()}
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4 p-6 bg-zinc-950/50 rounded-[2rem] border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Core Narrative</p>
                                    <p className="text-sm leading-relaxed italic text-zinc-400">"{project?.tagline || "No active tagline established for this project."}"</p>
                                </div>
                            </Card>

                            <Card className="border-border/10 bg-gradient-to-br from-violet-600/20 to-transparent backdrop-blur-xl rounded-[3rem] overflow-hidden p-8 space-y-4">
                                <h3 className="font-black uppercase tracking-widest text-[10px] text-violet-400">Identity Health</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black">94</span>
                                    <span className="text-sm font-bold text-violet-500 pb-1">/100</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">Your brand voice consistency is high across all generated content packs.</p>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={!!editingAsset} onOpenChange={(o) => !o && setEditingAsset(null)}>
                <DialogContent className="bg-zinc-950 border-white/5 rounded-[2.5rem] p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">Rename Asset</DialogTitle>
                        <DialogDescription className="text-zinc-500 italic tracking-tight">Update the registry entry name.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Asset Label</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-12 bg-zinc-900/50 border-white/5 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleUpdateAsset}
                            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest rounded-xl"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
