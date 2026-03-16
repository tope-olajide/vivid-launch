"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    Globe,
    Upload,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    ImageIcon,
    VideoIcon,
    FileImage,
    X,
    Rocket,
    Target,
    Users,
    MessageSquare,
    SmilePlus,
    GraduationCap,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const templates = [
    {
        id: "blank",
        name: "Blank Project",
        description: "Start from scratch",
        icon: Sparkles,
        gradient: "from-zinc-500/10 to-zinc-600/10",
        border: "border-zinc-500/20",
    },
    {
        id: "app-launch",
        name: "🚀 App Launch Blast",
        description: "Teaser video + blog + 5 social posts",
        icon: Rocket,
        gradient: "from-violet-500/10 to-fuchsia-500/10",
        border: "border-violet-500/20",
    },
    {
        id: "feature-update",
        name: "✨ Feature Update",
        description: "Highlight reel + changelog + social thread",
        icon: Sparkles,
        gradient: "from-cyan-500/10 to-blue-500/10",
        border: "border-cyan-500/20",
    },
    {
        id: "testimonial-push",
        name: "📣 Testimonial Push",
        description: "User quotes + review roundup blog",
        icon: MessageSquare,
        gradient: "from-amber-500/10 to-orange-500/10",
        border: "border-amber-500/20",
    },
    {
        id: "growth-sprint",
        name: "📈 Growth Sprint",
        description: "Weekly content schedule across platforms",
        icon: Target,
        gradient: "from-emerald-500/10 to-green-500/10",
        border: "border-emerald-500/20",
    },
    {
        id: "product-hunt",
        name: "🎯 Product Hunt",
        description: "Countdown + launch day + follow-up",
        icon: Rocket,
        gradient: "from-rose-500/10 to-pink-500/10",
        border: "border-rose-500/20",
    },
];

const steps = [
    { id: 1, title: "Foundation" },
    { id: 2, title: "Identity" },
    { id: 3, title: "Knowledge" },
    { id: 4, title: "Analysis" },
    { id: 5, title: "Assets" },
];

export default function NewProjectPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState("blank");
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [tagline, setTagline] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [tone, setTone] = useState([50]);
    const [humor, setHumor] = useState([30]);
    const [formality, setFormality] = useState([60]);
    const [emojiUsage, setEmojiUsage] = useState([40]);
    const [audienceLevel, setAudienceLevel] = useState("intermediate");
    const [uploadedFiles, setUploadedFiles] = useState<{ file: File; name: string; type: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Knowledge Source State
    const [knowledgeSource, setKnowledgeSource] = useState<"website" | "blog" | "file" | "manual">("website");
    const [sourceValue, setSourceValue] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Smart Scraper State (Advanced)
    const [useSmartScraper, setUseSmartScraper] = useState(false);
    const [scrapeScope, setScrapeScope] = useState("full-site");
    const [scrapePath, setScrapePath] = useState("");
    const [extractImages, setExtractImages] = useState(true);
    const [extractTestimonials, setExtractTestimonials] = useState(false);
    const [scrapeDepth, setScrapeDepth] = useState([1]);

    const router = useRouter();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).map((f) => ({
                file: f,
                name: f.name,
                type: f.type.startsWith("image") ? "image" : f.type.startsWith("video") ? "video" : "file",
            }));
            setUploadedFiles((prev) => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (!sourceValue && knowledgeSource !== 'manual') {
            toast.error("Please provide a source URL or content");
            return;
        }

        setIsAnalyzing(true);
        const loadingToast = toast.loading("AI is analyzing your content...");

        try {
            const res = await fetch("/api/projects/analyze-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: knowledgeSource,
                    value: sourceValue,
                }),
            });

            if (!res.ok) throw new Error("Analysis failed");
            const data = await res.json();
            
            setAnalysisResult(data.analysis);
            
            // Auto-populate fields
            if (data.analysis.name) setProjectName(data.analysis.name);
            if (data.analysis.description) setDescription(data.analysis.description);
            if (data.analysis.tagline) setTagline(data.analysis.tagline);
            if (data.analysis.targetAudience) setTargetAudience(data.analysis.targetAudience);
            
            if (data.analysis.brandVoice) {
                setTone([data.analysis.brandVoice.tone]);
                setHumor([data.analysis.brandVoice.humor]);
                setFormality([data.analysis.brandVoice.formality]);
                setEmojiUsage([data.analysis.brandVoice.emojiUsage]);
            }

            toast.success("Analysis complete! Brand DNA updated.", { id: loadingToast });
            setCurrentStep(4); // Move to Analysis step
        } catch (err: any) {
            toast.error(err.message, { id: loadingToast });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async () => {
        console.log("[Onboarding] Submission triggered...");
        if (!projectName || !description) {
            toast.error("Please fill in project name and description");
            console.warn("[Onboarding] Validation failed: missing name/description");
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Finalizing your campaign...");

        try {
            // 1. Create Project in Firestore
            const payload = {
                name: projectName,
                description,
                tagline,
                targetAudience,
                brandVoice: {
                    tone: tone[0],
                    humor: humor[0],
                    formality: formality[0],
                    emojiUsage: emojiUsage[0],
                    audienceLevel
                },
                templateId: selectedTemplate,
                knowledgeSource,
                sourceValue: sourceValue || "",
                isAnalyzed: !!analysisResult
            };

            console.log("[Onboarding] Posting to /api/projects:", payload);

            const projectResponse = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!projectResponse.ok) {
                const errorText = await projectResponse.text();
                throw new Error(`API Error (${projectResponse.status}): ${errorText}`);
            }

            const data = await projectResponse.json();
            console.log("[Onboarding] Project created successfully:", data);
            const { projectId } = data;

            // 2. Upload Assets to GCS and Register in Firestore
            if (uploadedFiles.length > 0) {
                for (const { file, type, name } of uploadedFiles) {
                    toast.loading(`Uploading ${name}...`, { id: loadingToast });

                    // Get Signed URL
                    const urlRes = await fetch("/api/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fileName: name,
                            contentType: file.type,
                            projectId
                        })
                    });

                    if (!urlRes.ok) throw new Error(`Failed to get upload URL for ${name}`);
                    const { url, publicUrl } = await urlRes.json();

                    // Upload directly to GCS via PUT
                    const uploadRes = await fetch(url, {
                        method: "PUT",
                        headers: { "Content-Type": file.type },
                        body: file
                    });

                    if (!uploadRes.ok) throw new Error(`Failed to upload ${name} to Storage`);

                    // Register asset in Firestore
                    const assetRes = await fetch("/api/assets", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            projectId,
                            name,
                            type,
                            gcsUrl: publicUrl
                        })
                    });

                    if (!assetRes.ok) throw new Error(`Failed to register ${name} in Firestore`);
                }
            }

            toast.success("Project created! Launching Workspace...", { id: loadingToast });
            
            // 3. Generate Campaign Strategy (New Feature)
            if (selectedTemplate !== 'blank') {
                toast.loading("Generating Campaign Strategy...", { id: loadingToast });
                try {
                    await fetch(`/api/projects/${projectId}/strategy`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            templateId: selectedTemplate,
                            name: projectName,
                            description
                        }),
                    });
                } catch (strategyErr) {
                    console.error("Strategy generation failed but project was created:", strategyErr);
                }
            }
            
            // Wait slightly for Firestore consistency before redirecting
            setTimeout(() => {
                window.location.href = `/project/${projectId}`;
            }, 1000);

        } catch (error: any) {
            console.error("[Onboarding] Submission Error:", error);
            toast.error(error.message || "An error occurred", { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="p-6 max-w-4xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
                <p className="text-muted-foreground mt-1">
                    Set up your project and let AI handle the rest
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
                {steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentStep(step.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currentStep === step.id
                                ? "bg-primary text-primary-foreground"
                                : currentStep > step.id
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                        >
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-background/20">
                                {step.id}
                            </span>
                            {step.title}
                        </button>
                        {i < steps.length - 1 && (
                            <div className={`w-8 h-px ${currentStep > step.id ? "bg-primary" : "bg-border"}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Foundation */}
            {currentStep === 1 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                            <Rocket className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Select Your Launch Arc</h2>
                            <p className="text-sm text-muted-foreground">Choose a template to pre-configure your campaign strategy.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templates.map((template) => (
                            <Card
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`cursor-pointer transition-all duration-300 border-2 ${selectedTemplate === template.id
                                    ? "border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/10"
                                    : "border-border/40 hover:border-border"
                                    } bg-gradient-to-br ${template.gradient}`}
                            >
                                <CardContent className="p-5">
                                    <template.icon className={`h-6 w-6 mb-3 ${selectedTemplate === template.id ? 'text-violet-500' : 'text-muted-foreground'}`} />
                                    <h3 className="font-bold text-sm tracking-tight">{template.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 2: Identity */}
            {currentStep === 2 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                            <Target className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Product Identity</h2>
                            <p className="text-sm text-muted-foreground">Give your project a name and define its core mission.</p>
                        </div>
                    </div>

                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project Name *</Label>
                            <Input
                                id="projectName"
                                placeholder="e.g. Acme AI"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="h-12 bg-muted/30 border-border/40 focus:ring-violet-500"
                                autoComplete="off"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tagline" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tagline</Label>
                            <Input
                                id="tagline"
                                placeholder="e.g. The future of creative automation"
                                value={tagline}
                                onChange={(e) => setTagline(e.target.value)}
                                className="h-12 bg-muted/30 border-border/40 focus:ring-violet-500"
                                autoComplete="off"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Briefly explain what your product does..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="bg-muted/30 border-border/40 focus:ring-violet-500 resize-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="audience" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Audience</Label>
                            <Input
                                id="targetAudience"
                                placeholder="e.g. Marketing Teams, SaaS Founders"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="h-12 bg-muted/30 border-border/40 focus:ring-violet-500"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 3: Knowledge Source */}
            {currentStep === 3 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Knowledge Source</h2>
                            <p className="text-sm text-muted-foreground">How should VividLaunch learn about your product?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { id: 'website', icon: Globe, label: 'Website' },
                            { id: 'blog', icon: MessageSquare, label: 'Blog Post' },
                            { id: 'file', icon: Upload, label: 'Document' },
                            { id: 'manual', icon: FileImage, label: 'Manual' },
                        ].map((source) => (
                            <button
                                key={source.id}
                                onClick={() => setKnowledgeSource(source.id as any)}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${knowledgeSource === source.id
                                    ? 'border-violet-500 bg-violet-500/10 text-violet-500'
                                    : 'border-border/40 hover:border-border text-muted-foreground'
                                    }`}
                            >
                                <source.icon className="h-6 w-6" />
                                <span className="text-xs font-bold uppercase tracking-widest">{source.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {knowledgeSource === 'website' && (
                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Website URL</Label>
                                <Input
                                    id="knowledgeSourceValue"
                                    type="url"
                                    placeholder="https://yourproduct.com"
                                    value={sourceValue}
                                    onChange={(e) => setSourceValue(e.target.value)}
                                    className="h-12 bg-muted/30 border-border/40 focus:ring-violet-500"
                                    autoComplete="off"
                                />
                                <div className="p-4 rounded-xl bg-violet-600/5 border border-violet-500/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-violet-500" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Advanced Scraper Settings</span>
                                        </div>
                                        <Switch checked={useSmartScraper} onCheckedChange={setUseSmartScraper} />
                                    </div>
                                    {useSmartScraper && (
                                        <div className="space-y-4 pt-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Scope</Label>
                                                    <Select value={scrapeScope} onValueChange={setScrapeScope}>
                                                        <SelectTrigger className="h-9 bg-background">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="full-site">Full Site</SelectItem>
                                                            <SelectItem value="landing-page">Landing Only</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Depth</Label>
                                                    <Slider value={scrapeDepth} onValueChange={setScrapeDepth} min={1} max={3} step={1} className="py-2" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {knowledgeSource === 'blog' && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Post/Article URL</Label>
                                <Input
                                    type="url"
                                    placeholder="https://medium.com/your-article"
                                    value={sourceValue}
                                    onChange={(e) => setSourceValue(e.target.value)}
                                    className="h-12 bg-muted/30 border-border/40 focus:ring-violet-500"
                                />
                                <p className="text-[10px] text-muted-foreground italic">We'll perform a focused extraction of this specific page.</p>
                            </div>
                        )}

                        {knowledgeSource === 'file' && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Paste Document Content</Label>
                                <Textarea
                                    placeholder="Paste the text from your PDF, DOCX, or Research paper here..."
                                    value={sourceValue}
                                    onChange={(e) => setSourceValue(e.target.value)}
                                    rows={8}
                                    className="bg-muted/30 border-border/40 focus:ring-violet-500 resize-none"
                                />
                            </div>
                        )}

                        {knowledgeSource === 'manual' && (
                            <div className="p-8 border-2 border-dashed border-border/40 rounded-3xl text-center space-y-3">
                                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="font-bold">Manual Mode</h3>
                                <p className="text-xs text-muted-foreground">Progress to the next step to manually configure your Brand DNA.</p>
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={knowledgeSource === 'manual' ? () => setCurrentStep(4) : handleAnalyze}
                        disabled={isAnalyzing || (!sourceValue && knowledgeSource !== 'manual')}
                        className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-violet-600/20"
                    >
                        {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                        {isAnalyzing ? "Analyzing Product..." : "Unlock Brand DNA"}
                    </Button>
                </motion.div>
            )}

            {/* Step 4: Smart Analysis */}
            {currentStep === 4 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-violet-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Brand DNA Analysis</h2>
                                <p className="text-sm text-muted-foreground">AI has analyzed your source. Refine the identity below.</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-3 py-1 font-bold">
                            Analysis Verified
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-border/40 bg-muted/10 p-6 space-y-6 rounded-3xl">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-500">Identity Sliders</h3>
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <span>Safe</span>
                                        <span>Bold</span>
                                    </div>
                                    <Slider value={tone} onValueChange={setTone} max={100} step={1} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <span>Serious</span>
                                        <span>Playful</span>
                                    </div>
                                    <Slider value={humor} onValueChange={setHumor} max={100} step={1} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <span>Casual</span>
                                        <span>Professional</span>
                                    </div>
                                    <Slider value={formality} onValueChange={setFormality} max={100} step={1} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <span>Minimal Emoji</span>
                                        <span>Emoji Heavy</span>
                                    </div>
                                    <Slider value={emojiUsage} onValueChange={setEmojiUsage} max={100} step={1} />
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Audience Sophistication</Label>
                                <Select value={audienceLevel} onValueChange={setAudienceLevel}>
                                    <SelectTrigger className="h-12 bg-muted/30 rounded-2xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner — Explain concepts</SelectItem>
                                        <SelectItem value="intermediate">Intermediate — Balanced</SelectItem>
                                        <SelectItem value="advanced">Advanced — Deep technical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {analysisResult?.keyFeatures && (
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Extracted Features</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.keyFeatures.map((f: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="bg-violet-500/5 border-violet-500/20 text-violet-400 py-1.5 px-3 rounded-lg text-[10px] uppercase font-black">
                                                {f}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <p className="text-[10px] text-muted-foreground leading-relaxed italic border-l-2 border-violet-500/20 pl-4 py-2 bg-violet-500/5 rounded-r-xl">
                                "Our AI extracted these traits from your source. Moving these sliders will influence the vocabulary, sentence structure, and visual style of all generated content."
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 5: Asset Upload */}
            {currentStep === 5 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Visual Assets</h2>
                            <p className="text-sm text-muted-foreground">Upload your brand's unique media for AI resolution.</p>
                        </div>
                    </div>

                    <Card className="border-dashed border-2 border-border/40 hover:border-violet-500/40 bg-muted/10 transition-all rounded-[2rem] group">
                        <CardContent className="p-12">
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center gap-4 cursor-pointer"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-500 group-hover:scale-110 transition-transform">
                                    <Upload className="h-8 w-8" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black uppercase tracking-widest text-sm">Drop Brand assets here</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        PNG, JPG, MP4, MOV • Transparent Logos preferred
                                    </p>
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </CardContent>
                    </Card>

                    {uploadedFiles.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {uploadedFiles.map((file, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/40 relative group"
                                >
                                    {file.type === "image" ? (
                                        <ImageIcon className="h-4 w-4 text-blue-500" />
                                    ) : (
                                        <VideoIcon className="h-4 w-4 text-violet-500" />
                                    )}
                                    <span className="text-[10px] font-bold truncate flex-1">{file.name}</span>
                                    <button 
                                        onClick={() => removeFile(i)}
                                        className="h-6 w-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-border/20 flex gap-4 items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <ImageIcon className="h-5 w-5 text-blue-400" />
                        </div>
                        <p className="text-[10px] text-zinc-400 italic font-medium">
                            Pro Tip: Uploading your raw product UI screenshots allows Gemini to "describe" them accurately when generating scene scripts.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                    disabled={currentStep === 1}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                {currentStep !== 3 && currentStep < 5 && (
                    <Button onClick={() => setCurrentStep((s) => s + 1)}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}

                {currentStep === 5 && (
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Finalizing..." : "Create Project & Generate"}
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
