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
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {projects.map((project) => (
                        <motion.div key={project.id} variants={item}>
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-violet-500/30 transition-all duration-200 group h-full">
                                <CardContent className="p-5 space-y-3 flex flex-col h-full">
                                    {/* Top */}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{project.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {project.description}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={project.status === "active" ? "default" : "secondary"}
                                            className="ml-2 shrink-0 text-[10px]"
                                        >
                                            {project.status || "draft"}
                                        </Badge>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.template && project.template !== "blank" && (
                                            <Badge variant="outline" className="text-[10px] py-0">
                                                {project.template}
                                            </Badge>
                                        )}
                                        {project.targetAudience && (
                                            <Badge variant="outline" className="text-[10px] py-0 border-blue-500/30 text-blue-500">
                                                {project.targetAudience}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(project.createdAt)}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                                                <Link href={`/studio/video?projectId=${project.id}`}>
                                                    <Video className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                            <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                                                <Link href={`/studio/blog?projectId=${project.id}`}>
                                                    <FileText className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                            <Button asChild size="icon" variant="ghost" className="h-7 w-7 text-violet-400">
                                                <Link href={`/studio/video?projectId=${project.id}`}>
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
