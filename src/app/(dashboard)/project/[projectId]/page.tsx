"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
    Sparkles, 
    Video, 
    FileText, 
    MessageCircle, 
    Clock, 
    ChevronRight,
    Loader2,
    Calendar,
    Target,
    Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Project {
    id: string;
    name: string;
    description: string;
    tagline?: string;
    targetAudience?: string;
    websiteUrl?: string;
    status?: string;
    createdAt?: string;
}

export default function ProjectOverviewPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects`); // We'll filter for this ID in client or update API
                const data = await res.json();
                const found = data.projects.find((p: Project) => p.id === projectId);
                setProject(found || null);
            } catch (err) {
                console.error("Failed to fetch project", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-xl font-bold">Project not found</p>
                <Button onClick={() => router.push("/projects")}>Return to Projects</Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Project Hero */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 px-3 py-1">
                        Active Workspace
                    </Badge>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight">{project.name}</h1>
                        <p className="text-xl text-muted-foreground italic">&ldquo;{project.tagline || project.description}&rdquo;</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 rounded-xl h-12 border-border/50 hover:bg-white/5">
                        <Calendar className="h-4 w-4" />
                        {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                    </Button>
                    <Button onClick={() => router.push(`/project/${projectId}/studio/video`)} className="bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold h-12 px-6 rounded-xl shadow-lg shadow-violet-500/20">
                        <Sparkles className="h-4 w-4" />
                        Launch AI Studio
                    </Button>
                </div>
            </div>

            {/* Quick Stats / Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Target Audience", value: project.targetAudience || "General", icon: <Target className="h-4 w-4 text-fuchsia-400" /> },
                    { label: "Source URL", value: project.websiteUrl || "No URL linked", icon: <Globe className="h-4 w-4 text-sky-400" /> },
                    { label: "Workspace Access", value: "Verified Owner", icon: <Clock className="h-4 w-4 text-amber-400" /> }
                ].map((stat, i) => (
                    <Card key={i} className="bg-card/40 border-border/10 backdrop-blur-xl">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                <p className="text-sm font-medium truncate max-w-[180px]">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Studio Entry Cards */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                    Available Studios
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { 
                            title: "Video Studio", 
                            desc: "Generate cinematic promo videos with voiceover and effects.", 
                            icon: <Video className="h-6 w-6" />, 
                            href: `/project/${projectId}/studio/video`,
                            color: "from-violet-600/20 to-violet-600/5",
                            border: "border-violet-500/20 hover:border-violet-400/50"
                        },
                        { 
                            title: "Blog Engine", 
                            desc: "Draft multi-format SEO blogs and update release notes.", 
                            icon: <FileText className="h-6 w-6" />, 
                            href: `/project/${projectId}/studio/blog`,
                            color: "from-fuchsia-600/20 to-fuchsia-600/5",
                            border: "border-fuchsia-500/20 hover:border-fuchsia-400/50"
                        },
                        { 
                            title: "Social Studio", 
                            desc: "Create viral post packs for X, LinkedIn, and Instagram.", 
                            icon: <MessageCircle className="h-6 w-6" />, 
                            href: `/project/${projectId}/studio/social`,
                            color: "from-sky-600/20 to-sky-600/5",
                            border: "border-sky-500/20 hover:border-sky-400/50"
                        }
                    ].map((studio, i) => (
                        <Card key={i} className={`bg-gradient-to-br ${studio.color} border ${studio.border} transition-all duration-300 group cursor-pointer h-full`} onClick={() => router.push(studio.href)}>
                            <CardContent className="p-6 space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                                    {studio.icon}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg">{studio.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed italic">{studio.desc}</p>
                                </div>
                                <div className="pt-2 flex items-center text-xs font-bold uppercase tracking-tight gap-1 group-hover:translate-x-1 transition-transform">
                                    Open Studio <ChevronRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
