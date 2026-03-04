"use client";

import { motion } from "framer-motion";
import {
    BarChart3,
    TrendingUp,
    Eye,
    MousePointerClick,
    Share2,
    ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const metrics = [
    { label: "Total Views", value: "0", change: "+0%", icon: Eye, color: "text-blue-500" },
    { label: "Engagement Rate", value: "0%", change: "+0%", icon: MousePointerClick, color: "text-violet-500" },
    { label: "Total Shares", value: "0", change: "+0%", icon: Share2, color: "text-amber-500" },
    { label: "Growth Rate", value: "0%", change: "+0%", icon: TrendingUp, color: "text-emerald-500" },
];

export default function AnalyticsPage() {
    return (
        <motion.div
            className="p-6 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Track performance across all platforms. The AI optimizes based on these metrics.
                    </p>
                </div>
                <Badge variant="outline" className="gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Real-time
                </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                    <Card key={metric.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">{metric.label}</p>
                                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                            </div>
                            <p className="text-2xl font-bold mt-2">{metric.value}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                <span className="text-xs text-emerald-500">{metric.change}</span>
                                <span className="text-xs text-muted-foreground">vs last period</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
                    <TabsTrigger value="platforms">Platforms</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
                                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="font-medium mt-3">No analytics data yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Connect your platforms and publish content to start tracking performance
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ab-testing">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <p className="font-medium">A/B Variant Comparison</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Generate variants to start split testing. The AI will auto-promote winners.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="platforms">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <p className="font-medium">Platform Breakdown</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Per-platform metrics will appear once content is published
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
