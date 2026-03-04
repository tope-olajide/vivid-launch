"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles, Eye, Code2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function BlogEnginePage() {
    return (
        <motion.div
            className="p-6 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Blog Engine</h1>
                    <p className="text-muted-foreground mt-1">
                        SEO-optimized long-form content with inline images
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select defaultValue="markdown">
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Output Format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="markdown">Markdown (Ghost/Dev.to)</SelectItem>
                            <SelectItem value="richtext">Rich Text JSON (Contentful)</SelectItem>
                            <SelectItem value="html">HTML (Strapi)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Post
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="editor" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="editor" className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="gap-1.5">
                        <Code2 className="h-3.5 w-3.5" />
                        Source
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        SEO
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="editor">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-8 min-h-[500px] flex items-center justify-center">
                            <div className="text-center space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">No content yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        Select a project and generate an SEO-optimized blog post
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preview">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-8 min-h-[500px] flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Preview will appear after generation</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="code">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-8 min-h-[500px] flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Source code will appear after generation</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seo">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-8 min-h-[500px] flex items-center justify-center">
                            <div className="text-center space-y-3">
                                <p className="font-medium">SEO Analysis</p>
                                <p className="text-sm text-muted-foreground">
                                    Meta title, description, headings analysis will appear here
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
