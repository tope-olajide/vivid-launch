"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Sparkles, Send, Bot, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LiveModePage() {
    const params = useParams();
    const projectId = params.projectId as string;
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
                        "I'm analyzing your request and building a campaign plan for this project. In the full implementation, scene blocks will stream here in real-time with inline previews...",
                },
            ]);
        }, 500);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Zap className="h-8 w-8 text-amber-500" />
                        Live Mode
                    </h1>
                    <p className="text-muted-foreground italic text-sm">
                        One command → full campaign orchestration, streamed in real-time.
                    </p>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none font-bold uppercase tracking-widest text-[10px] px-3">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Neural Stream
                </Badge>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 border-border/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden flex flex-col border-t-4 border-t-amber-500 shadow-2xl">
                <ScrollArea className="flex-1 p-8">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center min-h-[400px]">
                            <div className="text-center space-y-6 max-w-md">
                                <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-amber-500/10 border border-amber-500/20 mx-auto">
                                    <Zap className="h-10 w-10 text-amber-500" />
                                </div>
                                <div>
                                    <p className="font-black text-xl tracking-tight mb-2">Initialize Campaign</p>
                                    <div className="space-y-3">
                                        {[
                                            '"Launch my AI fitness app next Friday"',
                                            '"Create a Product Hunt campaign for my SaaS"',
                                            '"Generate a 30-second TikTok promo for my todo app"',
                                        ].map((example) => (
                                            <button
                                                key={example}
                                                onClick={() => setInput(example.replace(/"/g, ""))}
                                                className="block w-full text-left px-5 py-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800 border border-border/5 text-xs font-bold text-zinc-500 hover:text-white transition-all uppercase tracking-widest leading-relaxed"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
                                >
                                    {msg.role === "ai" && (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg">
                                            <Bot className="h-5 w-5 text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`rounded-[1.5rem] px-6 py-4 max-w-[80%] text-sm font-medium leading-relaxed ${msg.role === "user"
                                                ? "bg-violet-600 text-white shadow-xl"
                                                : "bg-zinc-900/80 backdrop-blur-sm border border-border/10 text-zinc-300"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 border border-border/10">
                                            <User className="h-5 w-5 text-zinc-400" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-6 border-t border-border/10 bg-zinc-950/50">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-3"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Instruct the Orchestrator..."
                            className="flex-1 bg-zinc-900/50 border-border/20 rounded-2xl h-12 px-6 focus-visible:ring-amber-500 font-bold placeholder:italic placeholder:font-normal"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="h-12 w-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
