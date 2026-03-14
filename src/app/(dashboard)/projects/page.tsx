"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FolderPlus,
    Sparkles,
    ExternalLink,
    Video,
    FileText,
    Clock,
    Loader2,
    Settings,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Project {
    id: string;
    name: string;
    description: string;
    tagline?: string;
    targetAudience?: string;
    status?: string;
    template?: string;
    createdAt?: string;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/projects");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to fetch projects");
                setProjects(data.projects || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
        });
    };

    return (
        <motion.div
            className="p-6 max-w-6xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all your VividLaunch campaigns in one place
                    </p>
                </div>
                <Button asChild className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white">
                    <Link href="/projects/new">
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Project
                    </Link>
                </Button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading projects...</p>
                </div>
            )}

            {/* Error */}
            {!isLoading && error && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="p-6 text-center">
                        <p className="text-destructive font-medium">{error}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Make sure your Firestore credentials are configured in <code>.env.local</code>.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {!isLoading && !error && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 space-y-4 border-2 border-dashed border-border/30 rounded-xl">
                    <Sparkles className="h-12 w-12 text-muted-foreground/30" />
                    <div className="text-center">
                        <p className="font-medium text-muted-foreground">No projects yet</p>
                        <p className="text-sm text-muted-foreground/70">
                            Create your first project to start generating content
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/projects/new">
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Create Project
                        </Link>
                    </Button>
                </div>
            )}

            {/* Project grid */}
            {!isLoading && !error && projects.length > 0 && (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >                    {projects.map((project) => (
                        <motion.div key={project.id} variants={item}>
                            <Card className="relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300 group h-full shadow-lg shadow-black/5 hover:shadow-violet-500/10 active:scale-[0.98]">
                                <Link href={`/project/${project.id}`} className="block h-full">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    
                                    <CardContent className="p-6 space-y-5 flex flex-col h-full relative z-10">
                                        {/* Top: Name & Status */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <h3 className="font-bold text-lg leading-tight tracking-tight group-hover:text-violet-400 transition-colors truncate">
                                                    {project.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed italic">
                                                    "{project.tagline || project.description}"
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge
                                                    variant={project.status === "active" ? "default" : "secondary"}
                                                    className={`text-[10px] px-2 py-0 border-none uppercase font-bold tracking-wider ${
                                                        project.status === 'active' 
                                                            ? 'bg-green-500/20 text-green-400 animate-pulse' 
                                                            : 'bg-amber-500/20 text-amber-400'
                                                    }`}
                                                >
                                                    {project.status || "draft"}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Flowing Tags: Individual badges for audience */}
                                        <div className="flex flex-wrap gap-1.5 h-12 overflow-hidden items-start">
                                            {project.targetAudience?.split(',').map((tag, idx) => (
                                                <Badge 
                                                    key={idx} 
                                                    variant="outline" 
                                                    className="text-[10px] py-0 bg-violet-500/5 border-violet-500/20 text-violet-300 whitespace-nowrap"
                                                >
                                                    {tag.trim()}
                                                </Badge>
                                            ))}
                                            {(!project.targetAudience || project.targetAudience.length === 0) && (
                                                <Badge variant="outline" className="text-[10px] py-0 opacity-30 italic">No audience set</Badge>
                                            )}
                                        </div>

                                        {/* Action Bar (Strong Persistent Buttons) */}
                                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/20" onClick={(e) => e.stopPropagation()}>
                                            <Button asChild variant="secondary" className="flex-1 h-9 gap-2 bg-violet-600/10 hover:bg-violet-600 hover:text-white transition-all border-none">
                                                <Link href={`/project/${project.id}/studio/video`}>
                                                    <Video className="h-4 w-4" />
                                                    <span className="text-xs font-bold uppercase tracking-tight">Video</span>
                                                </Link>
                                            </Button>
                                            <Button asChild variant="secondary" className="flex-1 h-9 gap-2 bg-fuchsia-600/10 hover:bg-fuchsia-600 hover:text-white transition-all border-none">
                                                <Link href={`/project/${project.id}/studio/blog`}>
                                                    <FileText className="h-4 w-4" />
                                                    <span className="text-xs font-bold uppercase tracking-tight">Blog</span>
                                                </Link>
                                            </Button>
                                            <Button asChild size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground/60 hover:text-white hover:bg-white/10 shrink-0">
                                                <Link href={`/project/${project.id}/manage/autopilot`}>
                                                    <Settings className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1 uppercase tracking-tighter">
                                                <Clock className="h-2.5 w-2.5" />
                                                Last Updated: {formatDate(project.createdAt)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        </motion.div>
                    ))}

                </motion.div>
            )}
        </motion.div>
    );
}
