"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Check, Plus, Trash2, Loader2, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ConnectorId } from "@/lib/connectors/types";

// ─────────────────────────────────────────────────────────────
// Connector definitions (static UI metadata)
// ─────────────────────────────────────────────────────────────

interface CredField {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
}

interface ConnectorMeta {
    id: ConnectorId;
    name: string;
    icon: string;
    description: string;
    docsUrl: string;
    fields: CredField[];
}

const CONNECTORS: { category: string; items: ConnectorMeta[] }[] = [
    {
        category: "Blogs",
        items: [
            {
                id: "devto",
                name: "Dev.to",
                icon: "📝",
                description: "Developer-focused blogging platform",
                docsUrl: "https://dev.to/settings/extensions",
                fields: [
                    { key: "apiKey", label: "API Key", placeholder: "your Dev.to API key" },
                ],
            },
            {
                id: "hashnode",
                name: "Hashnode",
                icon: "📘",
                description: "Blogging for developers",
                docsUrl: "https://hashnode.com/settings/developer",
                fields: [
                    { key: "apiKey", label: "Personal Access Token", placeholder: "your Hashnode PAT" },
                    { key: "publicationId", label: "Publication ID", placeholder: "e.g. 65c0...abc" },
                ],
            },
            {
                id: "medium",
                name: "Medium",
                icon: "📰",
                description: "Publishing platform for ideas",
                docsUrl: "https://medium.com/me/settings/security",
                fields: [
                    { key: "apiKey", label: "Integration Token", placeholder: "your Medium integration token" },
                ],
            },
        ],
    },
    {
        category: "Headless CMS",
        items: [
            {
                id: "ghost",
                name: "Ghost",
                icon: "👻",
                description: "Markdown via Admin API",
                docsUrl: "https://ghost.org/docs/admin-api/",
                fields: [
                    { key: "apiUrl", label: "Ghost URL", placeholder: "https://your-blog.ghost.io" },
                    { key: "adminApiKey", label: "Admin API Key", placeholder: "id:secret from Ghost admin" },
                ],
            },
        ],
    },
    {
        category: "Video Platforms",
        items: [
            {
                id: "youtube",
                name: "YouTube",
                icon: "▶️",
                description: "Upload promo videos to your channel",
                docsUrl: "https://console.cloud.google.com/apis/credentials",
                fields: [
                    { key: "accessToken", label: "OAuth2 Access Token", placeholder: "ya29.a0..." },
                ],
            },
        ],
    },
    {
        category: "Social Media",
        items: [
            {
                id: "twitter",
                name: "X (Twitter)",
                icon: "𝕏",
                description: "Posts & threads via API v2",
                docsUrl: "https://developer.twitter.com/en/portal/dashboard",
                fields: [
                    { key: "bearerToken", label: "Bearer Token", placeholder: "AAAA..." },
                ],
            },
            {
                id: "instagram",
                name: "Instagram",
                icon: "📸",
                description: "Reels & posts via Instagram Graph API",
                docsUrl: "https://developers.facebook.com/docs/instagram-api/",
                fields: [
                    { key: "instagramUserId", label: "Instagram User ID", placeholder: "17841..." },
                    { key: "accessToken", label: "Graph API Access Token", placeholder: "EAA..." },
                ],
            },
        ],
    },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

// ─────────────────────────────────────────────────────────────

export default function ConnectorsPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const [selectedConnector, setSelectedConnector] = useState<ConnectorMeta | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Load connected connectors on mount
    useEffect(() => {
        if (!projectId) return;
        fetch(`/api/connectors?projectId=${projectId}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.connectors) {
                    setConnectedIds(new Set(data.connectors.map((c: any) => c.id)));
                }
            })
            .catch(() => { /* silently fail if not connected */ });
    }, [projectId]);

    const openDialog = (connector: ConnectorMeta) => {
        setSelectedConnector(connector);
        setFormValues({});
    };

    const handleSave = async () => {
        if (!projectId || !selectedConnector) {
            toast.error("Invalid project context.");
            return;
        }
        // Validate all fields are filled
        for (const field of selectedConnector.fields) {
            if (!formValues[field.key]?.trim()) {
                toast.error(`Please fill in "${field.label}".`);
                return;
            }
        }
        setIsSaving(true);
        try {
            const res = await fetch("/api/connectors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    connectorId: selectedConnector.id,
                    credentials: formValues,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setConnectedIds((prev) => new Set([...prev, selectedConnector.id]));
            toast.success(`${selectedConnector.name} connected!`);
            setSelectedConnector(null);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDisconnect = async (connectorId: ConnectorId) => {
        if (!projectId) return;
        setLoadingIds((prev) => new Set([...prev, connectorId]));
        try {
            const res = await fetch(
                `/api/connectors?projectId=${projectId}&connectorId=${connectorId}`,
                { method: "DELETE" },
            );
            if (!res.ok) throw new Error("Disconnect failed.");
            setConnectedIds((prev) => { const n = new Set(prev); n.delete(connectorId); return n; });
            toast.success("Connector disconnected.");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingIds((prev) => { const n = new Set(prev); n.delete(connectorId); return n; });
        }
    };

    return (
        <div className="bg-zinc-950/20 min-h-full">
            <motion.div
                className="p-8 max-w-4xl mx-auto space-y-8"
                variants={container}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={item}>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <ExternalLink className="h-8 w-8 text-violet-500" />
                        Platform Connectors
                    </h1>
                    <p className="text-muted-foreground mt-1 italic">
                        Connect your platforms to enable autonomous multi-channel distribution.
                    </p>
                </motion.div>

                {CONNECTORS.map((group) => (
                    <motion.div key={group.category} variants={item} className="space-y-4">
                        <h2 className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] pl-1">
                            {group.category}
                        </h2>
                        <div className="grid gap-3">
                            {group.items.map((connector) => {
                                const isConnected = connectedIds.has(connector.id);
                                const isLoadingThis = loadingIds.has(connector.id);
                                return (
                                    <Card
                                        key={connector.id}
                                        className="border-border/10 bg-card/40 backdrop-blur-xl hover:border-violet-500/20 transition-all group lg:p-2"
                                    >
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-xl shadow-xl group-hover:scale-110 transition-transform">
                                                    {connector.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm tracking-tight">{connector.name}</h3>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{connector.description}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {isConnected ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="gap-1 bg-green-500/5 text-green-400 border-none text-[9px] font-bold uppercase tracking-widest">
                                                            <Check className="h-3 w-3" />
                                                            Active
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDisconnect(connector.id)}
                                                            disabled={isLoadingThis}
                                                        >
                                                            {isLoadingThis
                                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2 border-border/50 hover:bg-white/5 h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-tight"
                                                        onClick={() => openDialog(connector)}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Connect
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Connect Dialog */}
            <Dialog open={!!selectedConnector} onOpenChange={(open) => !open && setSelectedConnector(null)}>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-border/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <span>{selectedConnector?.icon}</span>
                            Connect {selectedConnector?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Enter your {selectedConnector?.name} credentials to authorize VividLaunch.{" "}
                            <a
                                href={selectedConnector?.docsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-violet-400 hover:underline font-bold"
                            >
                                Guide <ExternalLink className="h-3 w-3" />
                            </a>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedConnector?.fields.map((field) => (
                            <div key={field.key} className="space-y-2">
                                <Label htmlFor={field.key} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{field.label}</Label>
                                <Input
                                    id={field.key}
                                    type={field.type || "password"}
                                    placeholder={field.placeholder}
                                    className="bg-zinc-900/50 border-border/20 focus-visible:ring-violet-500 rounded-xl"
                                    value={formValues[field.key] || ""}
                                    onChange={(e) =>
                                        setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedConnector(null)} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-6">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Secure Connect
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
