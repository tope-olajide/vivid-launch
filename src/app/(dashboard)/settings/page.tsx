"use client";

import { motion } from "framer-motion";
import { Settings, Key, User, Bell, Palette, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
    return (
        <motion.div
            className="p-6 max-w-3xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your account, API keys, and preferences
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general" className="gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="api-keys" className="gap-1.5">
                        <Key className="h-3.5 w-3.5" />
                        API Keys
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-1.5">
                        <Bell className="h-3.5 w-3.5" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card className="border-border/50">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="display-name">Display Name</Label>
                                    <Input id="display-name" placeholder="Your name" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="you@example.com" />
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">Dark Mode</p>
                                    <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
                                </div>
                                <Switch />
                            </div>
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api-keys">
                    <Card className="border-border/50">
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                API keys are stored securely via Google Cloud Secret Manager.
                            </p>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                                    <Input id="gemini-key" type="password" placeholder="AIza..." />
                                </div>
                            </div>
                            <Button>Save Keys</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="border-border/50">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">Publishing Alerts</p>
                                    <p className="text-xs text-muted-foreground">Get notified when content is auto-published</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">Performance Reports</p>
                                    <p className="text-xs text-muted-foreground">Weekly analytics digest via email</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">A/B Test Results</p>
                                    <p className="text-xs text-muted-foreground">Get notified when a variant wins</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div >
    );
}
