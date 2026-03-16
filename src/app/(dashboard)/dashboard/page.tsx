"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    FolderPlus,
    Video,
    FileText,
    Share2,
    ArrowRight,
    Sparkles,
    Clock,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.04 },
    },
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface Stats {
    projectsCount: number;
    videosGenerated: number;
    blogPosts: number;
    socialPosts: number;
}

interface Project {
    id: string;
    name: string;
    description: string;
    tagline?: string;
    createdAt?: string;
    status?: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentProjects, setRecentProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch("/api/dashboard/stats");
                const data = await res.json();
                if (res.ok) {
                    setStats(data.stats);
                    setRecentProjects(data.recentProjects);
                }
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const metricCards = [
        {
            label: "Videos Generated",
            value: stats?.videosGenerated ?? 0,
            icon: Video,
            gradient: "from-violet-500 to-fuchsia-500",
        },
        {
            label: "Blog Posts",
            value: stats?.blogPosts ?? 0,
            icon: FileText,
            gradient: "from-cyan-500 to-blue-500",
        },
        {
            label: "Social Posts",
            value: stats?.socialPosts ?? 0,
            icon: Share2,
            gradient: "from-amber-500 to-orange-500",
        },
    ];

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short", day: "numeric"
        });
    };

    return (
        <motion.div
            className="p-6 space-y-10 max-w-7xl mx-auto"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Hero Section */}
            <motion.div variants={item}>
                <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/5 p-10 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-fuchsia-600/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/4" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="space-y-6 max-w-2xl text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-4">
                                <img src="/logo.png" alt="VividLaunch" className="h-16 w-auto object-contain" />
                                <Badge variant="secondary" className="bg-white/10 text-white border-white/20 px-3 py-1 font-bold uppercase tracking-widest text-[9px] backdrop-blur-md">
                                    Creative Director Powered by Gemini 3.1 Pro
                                </Badge>
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    Build the Product.<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">AI Handles the Launch.</span>
                                </h1>
                                <p className="text-zinc-400 text-lg font-medium leading-relaxed">
                                    Generate cinematic promo videos, long-form blogs, and platform-optimized 
                                    social content in one unified creative flow.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-black hover:bg-zinc-200 font-bold px-8 rounded-full shadow-xl shadow-white/5"
                                >
                                    <Link href="/projects/new">
                                        <FolderPlus className="mr-2 h-5 w-5" />
                                        Create New Project
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/10 text-white hover:bg-white/5 rounded-full px-8 bg-black/40 backdrop-blur-sm"
                                >
                                    <Link href="/projects">
                                        All Projects
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Quick Action Card (Simplified) */}
                        <div className="hidden lg:block">
                            <Link href="/projects/new">
                                <Card className="w-72 bg-white/5 backdrop-blur-md border-white/10 hover:border-violet-500/50 transition-all duration-500 group cursor-pointer rotate-2 hover:rotate-0">
                                    <CardContent className="p-8 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-3xl bg-violet-600 flex items-center justify-center mx-auto shadow-2xl shadow-violet-600/40 group-hover:scale-110 transition-transform">
                                            <FolderPlus className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black uppercase tracking-tighter text-lg">New Launch</p>
                                            <p className="text-xs text-white/50 italic">Start an autonomous campaign in seconds.</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 mx-auto text-violet-400 mt-2 group-hover:translate-x-1 transition-transform" />
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metricCards.map((card, idx) => (
                    <Card
                        key={idx}
                        className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-xl group hover:border-violet-500/30 transition-all duration-300"
                    >
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{card.label}</p>
                                {isLoading ? (
                                    <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                                ) : (
                                    <p className="text-4xl font-black tabular-nums tracking-tighter">{card.value}</p>
                                )}
                            </div>
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-500",
                                card.gradient
                            )}>
                                <card.icon className="h-7 w-7 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Recent Table / Grid */}
            <motion.div variants={item} className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Clock className="h-5 w-5 text-violet-500" />
                        Recent Projects
                    </h2>
                    <Button variant="ghost" size="sm" asChild className="text-violet-500 hover:text-violet-400 font-bold uppercase tracking-widest text-[10px] gap-2">
                        <Link href="/projects">
                            View All <ArrowRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="border-border/10 bg-card/40 h-40 animate-pulse" />
                            ))
                        ) : recentProjects.length > 0 ? (
                            recentProjects.map((project, idx) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Link href={`/project/${project.id}`}>
                                        <Card className="group relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-xl hover:border-violet-500/50 transition-all duration-300 h-full shadow-xl shadow-black/5 hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            <CardContent className="p-6 flex flex-col h-full relative z-10">
                                                {/* Header: Avatar & Name */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/20 group-hover:scale-110 transition-transform">
                                                        <span className="text-sm font-black text-white uppercase select-none">
                                                            {project.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h3 className="font-bold text-sm truncate group-hover:text-violet-400 transition-colors">{project.name}</h3>
                                                            <Badge className="bg-violet-500/10 text-violet-400 border-none text-[8px] font-black uppercase shrink-0">
                                                                {project.status || "draft"}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground/60 italic truncate mt-0.5">
                                                            {project.tagline || "Creative Launch Campaign"}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed h-8">
                                                    {project.description}
                                                </p>

                                                <div className="flex items-center justify-between pt-3 border-t border-border/10 mt-auto">
                                                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        <span>{formatDate(project.createdAt)}</span>
                                                    </div>
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-border/20 rounded-[2rem] bg-zinc-900/10">
                                <div className="h-16 w-16 rounded-full bg-zinc-900 border border-border/10 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-zinc-800" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-zinc-400 text-lg">No projects yet</p>
                                    <p className="text-zinc-500 text-sm italic">Unlock Gemini's creative power by creating your first launch.</p>
                                </div>
                                <Button asChild className="bg-violet-600 hover:bg-violet-700 rounded-full px-8 h-11 font-bold">
                                    <Link href="/projects/new">
                                        <FolderPlus className="mr-2 h-4 w-4" />
                                        Get Started
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
