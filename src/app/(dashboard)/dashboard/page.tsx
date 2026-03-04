"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    FolderPlus,
    Video,
    FileText,
    Zap,
    Share2,
    BarChart3,
    ArrowRight,
    Sparkles,
    TrendingUp,
    Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 },
    },
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const stats = [
    {
        label: "Videos Generated",
        value: "0",
        icon: Video,
        gradient: "from-violet-500 to-fuchsia-500",
    },
    {
        label: "Blog Posts",
        value: "0",
        icon: FileText,
        gradient: "from-cyan-500 to-blue-500",
    },
    {
        label: "Social Posts",
        value: "0",
        icon: Share2,
        gradient: "from-amber-500 to-orange-500",
    },
    {
        label: "Total Reach",
        value: "0",
        icon: TrendingUp,
        gradient: "from-emerald-500 to-green-500",
    },
];

const quickActions = [
    {
        title: "Create New Project",
        description: "Start from scratch or use a template",
        icon: FolderPlus,
        href: "/projects/new",
        gradient: "from-violet-500/10 to-fuchsia-500/10",
        border: "border-violet-500/20",
    },
    {
        title: "Video Studio",
        description: "Generate promo videos with AI",
        icon: Video,
        href: "/studio/video",
        gradient: "from-cyan-500/10 to-blue-500/10",
        border: "border-cyan-500/20",
    },
    {
        title: "Blog Engine",
        description: "SEO-optimized long-form content",
        icon: FileText,
        href: "/studio/blog",
        gradient: "from-amber-500/10 to-orange-500/10",
        border: "border-amber-500/20",
    },
    {
        title: "Live Mode",
        description: "One command → full campaign",
        icon: Zap,
        href: "/studio/live",
        gradient: "from-emerald-500/10 to-green-500/10",
        border: "border-emerald-500/20",
    },
];

export default function DashboardPage() {
    return (
        <motion.div
            className="p-6 space-y-8 max-w-7xl mx-auto"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Hero Banner */}
            <motion.div variants={item}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 p-8 text-white">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZyIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-30" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-5 w-5" />
                            <Badge variant="secondary" className="bg-white/20 text-white border-white/20 hover:bg-white/30">
                                Powered by Gemini AI
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            Welcome to VividLaunch
                        </h1>
                        <p className="text-white/80 max-w-xl text-base">
                            Build the product. VividLaunch handles the launch. Generate promo videos,
                            blog posts, and social content — then auto-publish everywhere.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <Button
                                asChild
                                className="bg-white text-violet-700 hover:bg-white/90 font-semibold"
                            >
                                <Link href="/projects/new">
                                    <FolderPlus className="mr-2 h-4 w-4" />
                                    New Project
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                            >
                                <Link href="/studio/live">
                                    <Zap className="mr-2 h-4 w-4" />
                                    Try Live Mode
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card
                        key={stat.label}
                        className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-colors"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}
                                >
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link key={action.href} href={action.href}>
                            <Card
                                className={`group relative overflow-hidden border ${action.border} bg-gradient-to-br ${action.gradient} hover:shadow-lg transition-all duration-300 cursor-pointer h-full`}
                            >
                                <CardContent className="p-5">
                                    <action.icon className="h-8 w-8 mb-3 text-foreground/80" />
                                    <h3 className="font-semibold mb-1">{action.title}</h3>
                                    <p className="text-sm text-muted-foreground">{action.description}</p>
                                    <ArrowRight className="h-4 w-4 mt-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* Recent Projects */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold tracking-tight">Recent Projects</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/projects">View All</Link>
                    </Button>
                </div>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium">No projects yet</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create your first project to start generating content
                                </p>
                            </div>
                            <Button asChild className="mt-2">
                                <Link href="/projects/new">
                                    <FolderPlus className="mr-2 h-4 w-4" />
                                    Create Project
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
