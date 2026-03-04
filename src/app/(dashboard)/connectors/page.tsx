"use client";

import { motion } from "framer-motion";
import {
    Share2,
    Link2,
    ExternalLink,
    Check,
    Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const connectors = [
    {
        category: "Blogs",
        items: [
            { name: "Dev.to", icon: "📝", connected: false, description: "Developer-focused blogging platform" },
            { name: "Hashnode", icon: "📘", connected: false, description: "Blogging for developers" },
            { name: "Medium", icon: "📰", connected: false, description: "Publishing platform" },
        ],
    },
    {
        category: "Headless CMS",
        items: [
            { name: "Ghost", icon: "👻", connected: false, description: "Markdown via Admin API" },
            { name: "Contentful", icon: "📦", connected: false, description: "Rich Text JSON content" },
            { name: "Strapi", icon: "🚀", connected: false, description: "HTML/Markdown content" },
        ],
    },
    {
        category: "Video Platforms",
        items: [
            { name: "YouTube", icon: "▶️", connected: false, description: "Upload promo videos" },
            { name: "TikTok", icon: "🎵", connected: false, description: "Short-form vertical video" },
        ],
    },
    {
        category: "Social Media",
        items: [
            { name: "X (Twitter)", icon: "𝕏", connected: false, description: "Posts & threads" },
            { name: "Instagram", icon: "📸", connected: false, description: "Reels & posts" },
            { name: "Facebook", icon: "📘", connected: false, description: "Pages & posts" },
        ],
    },
];

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
};

export default function ConnectorsPage() {
    return (
        <motion.div
            className="p-6 max-w-4xl mx-auto space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item}>
                <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
                <p className="text-muted-foreground mt-1">
                    Connect your platforms to auto-publish content everywhere
                </p>
            </motion.div>

            {connectors.map((group) => (
                <motion.div key={group.category} variants={item} className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.category}
                    </h2>
                    <div className="grid gap-3">
                        {group.items.map((connector) => (
                            <Card
                                key={connector.name}
                                className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-colors"
                            >
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                                            {connector.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-sm">{connector.name}</h3>
                                            <p className="text-xs text-muted-foreground">{connector.description}</p>
                                        </div>
                                    </div>
                                    {connector.connected ? (
                                        <Badge variant="secondary" className="gap-1 text-green-600 dark:text-green-400">
                                            <Check className="h-3 w-3" />
                                            Connected
                                        </Badge>
                                    ) : (
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <Plus className="h-3.5 w-3.5" />
                                            Connect
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
