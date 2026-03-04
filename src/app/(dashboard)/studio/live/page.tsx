"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles, Send, Bot, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LiveModePage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<
        { role: "user" | "ai"; content: string }[]
    >([]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages((prev) => [...prev, { role: "user", content: input }]);
        setInput("");
        // AI response will be streamed here in the real implementation
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content:
                        "I'm analyzing your request and building a campaign plan. In the full implementation, scene blocks will stream here in real-time with inline previews...",
                },
            ]);
        }, 500);
    };

    return (
        <motion.div
            className="p-6 max-w-4xl mx-auto space-y-6 h-[calc(100vh-3.5rem)] flex flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Zap className="h-6 w-6 text-amber-500" />
                        Live Mode
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        One command → full campaign, streamed in real-time
                    </p>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Streaming
                </Badge>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center min-h-[300px]">
                            <div className="text-center space-y-4 max-w-md">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 mx-auto">
                                    <Zap className="h-8 w-8 text-amber-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Try saying something like:</p>
                                    <div className="mt-3 space-y-2">
                                        {[
                                            '"Launch my AI fitness app next Friday"',
                                            '"Create a Product Hunt campaign for my SaaS"',
                                            '"Generate a 30-second TikTok promo for my todo app"',
                                        ].map((example) => (
                                            <button
                                                key={example}
                                                onClick={() => setInput(example.replace(/"/g, ""))}
                                                className="block w-full text-left px-4 py-2.5 rounded-lg bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                                >
                                    {msg.role === "ai" && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`rounded-xl px-4 py-3 max-w-[80%] text-sm ${msg.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t border-border/50">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe your campaign in one sentence..."
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </motion.div>
    );
}
