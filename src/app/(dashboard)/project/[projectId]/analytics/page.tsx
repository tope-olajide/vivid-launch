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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-violet-500" />
                        Intelligence Panel
                    </h1>
                    <p className="text-muted-foreground italic text-sm">
                        Neural analytics and performance telemetry across all channels.
                    </p>
                </div>
                <Badge variant="outline" className="gap-2 bg-zinc-900 border-border/10 rounded-xl px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    Live Feed
                </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric) => (
                    <Card key={metric.label} className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-violet-500/20 transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{metric.label}</p>
                                <div className={`p-2 rounded-xl bg-zinc-900 shadow-inner group-hover:scale-110 transition-transform`}>
                                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                                </div>
                            </div>
                            <p className="text-3xl font-black mt-4 tracking-tighter">{metric.value}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-500">{metric.change}</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter italic">vs baseline</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-zinc-900/50 p-1 border border-border/10 rounded-xl">
                    <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-violet-600 rounded-lg text-xs font-bold uppercase tracking-widest px-8">Overview</TabsTrigger>
                    <TabsTrigger value="ab-testing" className="gap-2 data-[state=active]:bg-violet-600 rounded-lg text-xs font-bold uppercase tracking-widest px-8">A/B Intelligence</TabsTrigger>
                    <TabsTrigger value="platforms" className="gap-2 data-[state=active]:bg-violet-600 rounded-lg text-xs font-bold uppercase tracking-widest px-8">Platform Nodes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] border-t-4 border-t-violet-500 h-96 flex items-center justify-center">
                        <CardContent className="p-12 text-center space-y-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-zinc-900 border border-border/10 mx-auto shadow-2xl animate-pulse">
                                <BarChart3 className="h-10 w-10 text-zinc-700" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-black text-zinc-400 uppercase tracking-widest">Awaiting Telemetry</p>
                                <p className="text-xs text-muted-foreground italic max-w-xs mx-auto">
                                    Connect your platform nodes and initiate a campaign to populate neural performance data.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ab-testing">
                    <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] h-96 flex items-center justify-center">
                        <CardContent className="p-12 text-center opacity-40">
                            <p className="font-black uppercase tracking-widest">Differential Engine Standby</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="platforms">
                    <Card className="border-border/10 bg-card/40 backdrop-blur-xl rounded-[3rem] h-96 flex items-center justify-center">
                        <CardContent className="p-12 text-center opacity-40">
                            <p className="font-black uppercase tracking-widest">Node Connectivity Pending</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
