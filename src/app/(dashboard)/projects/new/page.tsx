"use client";

import { useState } from "react";
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
    { id: 1, title: "Template" },
    { id: 2, title: "Details" },
    { id: 3, title: "Brand Voice" },
    { id: 4, title: "Assets" },
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
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string }[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).map((f) => ({
                name: f.name,
                type: f.type.startsWith("image") ? "image" : f.type.startsWith("video") ? "video" : "file",
            }));
            setUploadedFiles((prev) => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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

            {/* Step 1: Template Selection */}
            {currentStep === 1 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <h2 className="text-lg font-semibold">Choose a Campaign Template</h2>
                    <p className="text-sm text-muted-foreground">
                        Pick a template to pre-fill your campaign arc, or start blank.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templates.map((template) => (
                            <Card
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`cursor-pointer transition-all duration-200 border ${selectedTemplate === template.id
                                        ? "ring-2 ring-primary border-primary"
                                        : template.border
                                    } bg-gradient-to-br ${template.gradient} hover:shadow-md`}
                            >
                                <CardContent className="p-4">
                                    <template.icon className="h-6 w-6 mb-2 text-foreground/70" />
                                    <h3 className="font-semibold text-sm">{template.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 2: Project Details */}
            {currentStep === 2 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                >
                    <h2 className="text-lg font-semibold">Project Details</h2>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Project Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. My Awesome SaaS App"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tagline">Tagline</Label>
                            <Input
                                id="tagline"
                                placeholder="e.g. The fastest way to ship your MVP"
                                value={tagline}
                                onChange={(e) => setTagline(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your app, its key features, and what makes it unique..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="website" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Website URL
                            </Label>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://yourapp.com"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                We&apos;ll scrape your website to understand your product and extract images
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="audience" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Target Audience
                            </Label>
                            <Input
                                id="audience"
                                placeholder="e.g. Indie developers, small startup teams"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 3: Brand Voice */}
            {currentStep === 3 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div>
                        <h2 className="text-lg font-semibold">Brand Voice Configuration</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Define your brand&apos;s personality. The AI uses this for every piece of content.
                        </p>
                    </div>

                    <Card className="border-border/50">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Tone</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {tone[0] < 30 ? "Safe & Conservative" : tone[0] > 70 ? "Bold & Provocative" : "Balanced"}
                                    </span>
                                </div>
                                <Slider value={tone} onValueChange={setTone} max={100} step={1} className="w-full" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Safe</span>
                                    <span>Bold</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <SmilePlus className="h-4 w-4" /> Humor Level
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {humor[0] < 30 ? "Serious" : humor[0] > 70 ? "Very Playful" : "Light"}
                                    </span>
                                </div>
                                <Slider value={humor} onValueChange={setHumor} max={100} step={1} className="w-full" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Serious</span>
                                    <span>Playful</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Formality</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {formality[0] < 30 ? "Casual" : formality[0] > 70 ? "Very Professional" : "Semi-Formal"}
                                    </span>
                                </div>
                                <Slider value={formality} onValueChange={setFormality} max={100} step={1} className="w-full" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Casual</span>
                                    <span>Professional</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Emoji Usage</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {emojiUsage[0] < 30 ? "None" : emojiUsage[0] > 70 ? "Emoji Heavy 🚀🎉" : "Moderate"}
                                    </span>
                                </div>
                                <Slider value={emojiUsage} onValueChange={setEmojiUsage} max={100} step={1} className="w-full" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>None</span>
                                    <span>Heavy</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Audience Sophistication
                                </Label>
                                <Select value={audienceLevel} onValueChange={setAudienceLevel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner — Simple language, explain concepts</SelectItem>
                                        <SelectItem value="intermediate">Intermediate — Some tech jargon is OK</SelectItem>
                                        <SelectItem value="advanced">Advanced — Full technical depth</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Step 4: Asset Upload */}
            {currentStep === 4 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                >
                    <div>
                        <h2 className="text-lg font-semibold">Upload Assets</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Upload screenshots, logos, videos — they&apos;ll be registered and available for the AI to use in your content.
                        </p>
                    </div>

                    <Card className="border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors">
                        <CardContent className="p-8">
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center gap-3 cursor-pointer"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium">Drop files here or click to upload</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Images (PNG, JPG, SVG) · Videos (MP4, MOV) · Logos
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
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Uploaded Assets ({uploadedFiles.length})</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {uploadedFiles.map((file, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                                    >
                                        {file.type === "image" ? (
                                            <ImageIcon className="h-4 w-4 text-blue-500" />
                                        ) : file.type === "video" ? (
                                            <VideoIcon className="h-4 w-4 text-violet-500" />
                                        ) : (
                                            <FileImage className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="text-sm flex-1 truncate">{file.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {file.type}
                                        </Badge>
                                        <button onClick={() => removeFile(i)}>
                                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

                {currentStep < 4 ? (
                    <Button onClick={() => setCurrentStep((s) => s + 1)}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Project & Generate
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
