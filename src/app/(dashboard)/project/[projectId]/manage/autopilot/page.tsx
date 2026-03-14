"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
    Rocket, Share2, Sparkles, Calendar, Clock, Lock, 
    CheckCircle2, AlertCircle, Loader2, Save,
    BarChart2, Zap, Palette, Hash, FileText, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/**
 * VividAuto Settings Page
 * Manages project-specific integrations, automation "pulse", and brand identity.
 */
export default function ProjectSettingsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form State
    const [enabledPlatforms, setEnabledPlatforms] = useState<string[]>([]);
    const [automationEnabled, setAutomationEnabled] = useState(false);
    const [pulse, setPulse] = useState({ videos: 1, blogs: 1, social: 7 });
    const [brandVoice, setBrandVoice] = useState({
        tone: 50,
        humor: 30,
        formality: 70,
        emojiDensity: 40,
        customPrompt: ""
    });

    useEffect(() => {
        if (projectId) {
            fetch(`/api/projects`)
                .then(res => res.json())
                .then(data => {
                    const project = data.projects.find((p: any) => p.id === projectId);
                    if (project) {
                        // In a real app, we'd map project.settings here
                        setIsLoading(false);
                    }
                });
        }
    }, [projectId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save to Firestore logic here
            toast.success("Settings saved successfully!");
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div 
            className="p-8 max-w-5xl mx-auto space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Rocket className="h-8 w-8 text-violet-500" />
                        Autopilot Settings
                    </h1>
                    <p className="text-muted-foreground italic text-sm">
                        Configure autonomous content generation and integration toggles for this project.
                    </p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2 h-11 px-6 shadow-lg shadow-violet-500/20"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="integrations" className="space-y-6">
                <TabsList className="bg-zinc-900/50 p-1 border border-border/10">
                    <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-violet-600">
                        <Share2 className="h-4 w-4" />
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="gap-2 data-[state=active]:bg-violet-600">
                        <Zap className="h-4 w-4" />
                        VividAuto
                    </TabsTrigger>
                    <TabsTrigger value="brand" className="gap-2 data-[state=active]:bg-violet-600">
                        <Palette className="h-4 w-4" />
                        Brand Voice
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB 1: INTEGRATIONS --- */}
                <TabsContent value="integrations">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: 'twitter', name: 'X / Twitter', color: 'bg-black' },
                            { id: 'linkedin', name: 'LinkedIn', color: 'bg-[#0A66C2]' },
                            { id: 'instagram', name: 'Instagram', color: 'bg-rose-500' },
                            { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
                            { id: 'devto', name: 'Dev.to', color: 'bg-zinc-900' },
                            { id: 'ghost', name: 'Ghost CMS', color: 'bg-white text-black' }
                        ].map((p) => (
                            <Card key={p.id} className="bg-card/40 border-border/10 backdrop-blur-xl group hover:border-violet-500/30 transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center shadow-lg`}>
                                            <Share2 className="h-5 w-5 opacity-80" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{p.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Global Connector</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[9px] bg-green-500/5 text-green-400 border-none">CONNECTED</Badge>
                                        <Switch 
                                            checked={enabledPlatforms.includes(p.id)}
                                            onCheckedChange={(checked) => {
                                                setEnabledPlatforms(prev => 
                                                    checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                                                )
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- TAB 2: AUTOMATION --- */}
                <TabsContent value="automation">
                    <div className="space-y-6">
                        <Card className="bg-card/40 border-border/10 backdrop-blur-xl overflow-hidden border-l-4 border-l-violet-600">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        Enable Autonomous Orchestration
                                        <Badge variant="secondary" className="bg-violet-500/10 text-violet-400 text-[10px] ml-2">AGENTIC</Badge>
                                    </h3>
                                    <p className="text-sm text-muted-foreground italic">
                                        When enabled, Gemini will monitor your project and auto-generate content matching the pulse.
                                    </p>
                                </div>
                                <Switch checked={automationEnabled} onCheckedChange={setAutomationEnabled} />
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Video Pulse', key: 'videos', icon: <Rocket className="h-4 w-4" />, sub: 'Videos per week' },
                                { label: 'Blog Pulse', key: 'blogs', icon: <FileText className="h-4 w-4" />, sub: 'Posts per week' },
                                { label: 'Social Pulse', key: 'social', icon: <Zap className="h-4 w-4" />, sub: 'Posts per day' }
                            ].map((item) => (
                                <Card key={item.key} className="bg-zinc-900/40 border-border/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            {item.icon}
                                            {item.label}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="text-4xl font-black text-violet-400">
                                            {pulse[item.key as keyof typeof pulse]}
                                        </div>
                                        <Slider 
                                            max={20} 
                                            step={1} 
                                            value={[pulse[item.key as keyof typeof pulse]]}
                                            onValueChange={([val]) => setPulse(prev => ({ ...prev, [item.key]: val }))}
                                        />
                                        <p className="text-[10px] italic text-muted-foreground">{item.sub}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="bg-card/40 border-border/10 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-violet-500" />
                                    Launch Schedule Preview
                                </CardTitle>
                                <CardDescription className="text-xs">Generated upcoming queue based on your current pulse</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border-t border-border/10 divide-y divide-border/10">
                                    {[1, 2, 3, 4].map((day) => (
                                        <div key={day} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 text-center">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase uppercase">Day</p>
                                                    <p className="text-xl font-black">{day}</p>
                                                </div>
                                                <div className="h-10 w-px bg-border/20" />
                                                <div className="space-y-0.5">
                                                    <div className="flex gap-2">
                                                        <Badge className="bg-violet-600/20 text-violet-400 text-[9px] px-1.5 h-4">VIDEO</Badge>
                                                        <Badge className="bg-sky-600/20 text-sky-400 text-[9px] px-1.5 h-4">X (TWITTER)</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground italic truncate max-w-xs">
                                                        "New feature reveal and viral hook generation..."
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                                                <ChevronRight className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- TAB 3: BRAND VOICE --- */}
                <TabsContent value="brand">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            {[
                                { label: 'Tone of Voice', sub: 'Playful vs Serious', key: 'tone' },
                                { label: 'Humor Level', sub: 'Dry vs High Energy', key: 'humor' },
                                { label: 'Formality', sub: 'Casual vs Corporate', key: 'formality' },
                                { label: 'Emoji Density', sub: 'Minimal vs Visual-First', key: 'emojiDensity' }
                            ].map((s) => (
                                <div key={s.key} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <Label className="font-bold flex flex-col gap-0.5">
                                            {s.label}
                                            <span className="text-[10px] font-normal text-muted-foreground tracking-tighter uppercase">{s.sub}</span>
                                        </Label>
                                        <span className="text-xs font-mono text-violet-400">{brandVoice[s.key as keyof typeof brandVoice]}%</span>
                                    </div>
                                    <Slider 
                                        value={[brandVoice[s.key as keyof typeof brandVoice] as number]}
                                        onValueChange={([val]) => setBrandVoice(prev => ({ ...prev, [s.key]: val }))}
                                        className="[&>span:first-child]:bg-zinc-800 [&>span:first-child]:h-2"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <Label className="font-bold flex flex-col gap-0.5">
                                Custom Prompt Injection
                                <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-tighter italic">Advanced AI Directives</span>
                            </Label>
                            <Textarea 
                                placeholder="e.g. 'Speak like a developer from the 90s' or 'Always mention we are eco-friendly'"
                                className="min-h-[300px] bg-zinc-900/50 border-zinc-800 focus-visible:ring-violet-500 font-medium italic text-sm p-6"
                                value={brandVoice.customPrompt}
                                onChange={(e) => setBrandVoice(prev => ({ ...prev, customPrompt: e.target.value }))}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
