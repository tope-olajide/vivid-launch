"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FolderPlus,
    FolderOpen,
    Video,
    FileText,
    Share2,
    BarChart3,
    Settings,
    Zap,
    Sparkles,
    GitCompareArrows,
    Rocket,
    MessageCircle,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const mainNav = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Projects", href: "/projects", icon: FolderOpen },
    { title: "New Project", href: "/projects/new", icon: FolderPlus },
];

const createNav = [
    { title: "Video Studio", href: "/studio/video", icon: Video },
    { title: "Blog Engine", href: "/studio/blog", icon: FileText },
    { title: "Social Studio", href: "/studio/social", icon: MessageCircle },
    { title: "A/B Variants", href: "/studio/variants", icon: GitCompareArrows },
    { title: "Live Mode", href: "/studio/live", icon: Zap },
];

const manageNav = [
    { title: "Connectors", href: "/connectors", icon: Share2 },
    { title: "Autopilot", href: "/studio/settings", icon: Rocket },
    { title: "Analytics", href: "/analytics", icon: BarChart3 },
    { title: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar className="border-r border-border/50">
            <SidebarHeader className="p-4">
                <Link href="/dashboard" className="flex items-center group">
                    <img 
                        src="/logo.png" 
                        alt="VividLaunch Logo" 
                        className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
                    />
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Overview
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNav.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        className="transition-all duration-200"
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Create
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {createNav.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href || pathname?.startsWith(item.href)}
                                        className="transition-all duration-200"
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Manage
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {manageNav.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        className="transition-all duration-200"
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">v1.0.0</span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
