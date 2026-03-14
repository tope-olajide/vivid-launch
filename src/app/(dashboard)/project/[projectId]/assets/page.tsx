"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface Asset {
    id: string;
    name: string;
    type: string;
    gcsUrl: string;
    projectId: string;
    createdAt: string;
    status: string;
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
    const projectId = params.projectId as string;
    
    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
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
            } catch (err) {
                console.error("Failed to fetch assets data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [projectId]);

    const filteredAssets = assets.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <Button variant="outline" className="border-border/10 bg-card/40 backdrop-blur-xl h-11 px-6 rounded-xl hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]">
                        Export Bundle
                    </Button>
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white h-11 px-6 rounded-xl shadow-lg shadow-violet-500/20 font-black uppercase tracking-widest text-[10px] gap-2">
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        Analyze Assets
                    </Button>
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
                        <TabsTrigger value="brand" className="relative h-10 bg-transparent p-0 text-sm font-bold uppercase tracking-widest data-[state=active]:text-fuchsia-400 group">
                            <BrainCircuit className="h-4 w-4 mr-2" />
                            Brand Identity
                            <div className="absolute -bottom-4 left-0 right-0 h-1 bg-fuchsia-500 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-left rounded-full" />
                        </TabsTrigger>
                        <TabsTrigger value="knowledge" className="relative h-10 bg-transparent p-0 text-sm font-bold uppercase tracking-widest data-[state=active]:text-sky-400 group">
                            <FileText className="h-4 w-4 mr-2" />
                            Knowledge Base
                            <div className="absolute -bottom-4 left-0 right-0 h-1 bg-sky-500 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-left rounded-full" />
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
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-white/5">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Media Gallery Tab */}
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
                                            {asset.type.startsWith('image/') ? (
                                                <img 
                                                    src={asset.gcsUrl} 
                                                    alt={asset.name} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                    <Zap className="h-12 w-12 text-zinc-700" />
                                                </div>
                                            )}
                                            
                                            {/* Overlays */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                                            
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg bg-black/60 backdrop-blur-md border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 delay-75">
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg bg-black/60 backdrop-blur-md border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 delay-100">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            <Badge className="absolute bottom-4 left-4 bg-violet-600/80 backdrop-blur-md border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                                                {asset.type.split('/')[1] || asset.type}
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
                                <Button className="h-9 px-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                                    Import First Asset
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TabsContent>

                {/* Brand Identity Tab */}
                <TabsContent value="brand" className="mt-0 outline-none space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Profile Details */}
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

                        {/* Audience & Messaging */}
                        <div className="flex flex-col gap-8">
                             <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] overflow-hidden p-8 flex-1 space-y-6">
                                <div className="space-y-4">
                                    <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-400 text-[10px] font-black tracking-widest uppercase px-3">Target Node</Badge>
                                    <h2 className="text-xl font-black tracking-tighter">Audience Definition</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {project?.targetAudience?.split(',').map((tag, i) => (
                                        <div key={i} className="px-4 py-2 bg-zinc-900/80 rounded-2xl border border-white/10 text-xs font-bold text-zinc-300">
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

                {/* Knowledge Base Tab */}
                <TabsContent value="knowledge" className="mt-0 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] overflow-hidden">
                                <CardHeader className="p-8 border-b border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-sky-500/10 text-sky-400 border-none font-black text-[10px] uppercase tracking-widest">Scraped Source</Badge>
                                        <Link href={project?.websiteUrl || "#"} target="_blank" className="text-[10px] font-bold text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                                            Visit Live URL <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                    <CardTitle className="text-2xl font-black">Extracted Knowledge</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-zinc-400 leading-relaxed text-sm whitespace-pre-wrap">
                                            {project?.description || "Connect a website to initiate autonomic knowledge extraction."}
                                        </p>
                                    </div>
                                    
                                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-2">
                                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Research Depth</p>
                                            <p className="font-bold text-sm">Full-Site Scan</p>
                                        </div>
                                        <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-2">
                                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Last Synced</p>
                                            <p className="font-bold text-sm">2 hours ago</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] p-8 space-y-6">
                                <h3 className="text-lg font-black tracking-tight">AI Insights</h3>
                                <div className="space-y-4">
                                    {[
                                        "Focus on B2B scalability.",
                                        "Mention 'Seamless' 22% more.",
                                        "Visuals should be high-contrast."
                                    ].map((insight, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl group hover:bg-violet-500/10 transition-colors">
                                            <div className="h-2 w-2 rounded-full bg-violet-500 mt-1.5 shadow-[0_0_10px_#8b5cf6]" />
                                            <p className="text-xs font-bold text-zinc-300 italic">"{insight}"</p>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full h-11 bg-zinc-900 border border-white/10 hover:bg-white/5 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                    Recalibrate Model
                                </Button>
                            </Card>

                            <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] p-8 flex flex-col items-center justify-center text-center space-y-4 h-64 overflow-hidden group">
                                <div className="h-16 w-16 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                                    <Globe className="h-8 w-8 text-sky-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black uppercase tracking-widest text-xs">Origin Data</p>
                                    <p className="text-[10px] text-muted-foreground italic max-w-xs">{project?.websiteUrl || "No endpoint connected"}</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Link({ href, children, ...props }: any) {
    return (
        <a href={href} {...props} className={props.className}>
            {children}
        </a>
    );
}
