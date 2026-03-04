"use client";

import { motion } from "framer-motion";
import { Video, Sparkles, Play, Settings2, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VideoStudioPage() {
    return (
        <motion.div
            className="p-6 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Video Studio</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate promo videos powered by Gemini&apos;s Creative Director
                    </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Gemini Interleaved Output
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Project selector & controls */}
                <div className="space-y-4">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">Generation Settings</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Select a project to generate a promo video. The AI will use your assets, brand voice,
                                and campaign settings to create a full storyboard.
                            </p>
                            <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Storyboard
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">Scene Blocks</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Scene blocks will appear here after generation. Edit text, swap assets, or regenerate individual scenes.
                            </p>
                            <div className="h-48 rounded-lg border border-dashed border-border/50 flex items-center justify-center">
                                <span className="text-sm text-muted-foreground">No scenes yet</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center: Preview / Live Stream Panel */}
                <div className="lg:col-span-2">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
                        <CardContent className="p-5 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm">Live Preview</h3>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-xs">16:9</Badge>
                                    <Badge variant="outline" className="text-xs">9:16</Badge>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[400px] rounded-xl bg-black/5 dark:bg-white/5 border border-border/30 flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
                                        <Play className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Video Preview</p>
                                        <p className="text-sm text-muted-foreground">
                                            Generate a storyboard to see the live preview
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}
