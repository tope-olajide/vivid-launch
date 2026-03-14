"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
    Video,
    FileText,
    MessageCircle,
    GitCompareArrows,
    Zap,
    Share2,
    Rocket,
    LayoutDashboard,
    ChevronLeft,
    BarChart3
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

const createNav = [
    { title: "Video Studio", href: "/studio/video", icon: Video },
    { title: "Blog Engine", href: "/studio/blog", icon: FileText },
    { title: "Social Studio", href: "/studio/social", icon: MessageCircle },
    { title: "A/B Variants", href: "/studio/variants", icon: GitCompareArrows },
    { title: "Live Mode", href: "/studio/live", icon: Zap },
];

const manageNav = [
    { title: "Assets", href: "/assets", icon: LayoutDashboard },
    { title: "Connectors", href: "/manage/connectors", icon: Share2 },
    { title: "Autopilot", href: "/manage/autopilot", icon: Rocket },
    { title: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function ProjectSidebar() {
    const pathname = usePathname();
    const params = useParams();
    const projectId = params.projectId as string;

    const getFullHref = (href: string) => `/project/${projectId}${href}`;

    return (
        <Sidebar className="border-r border-border/50 top-16 h-[calc(100vh-64px)]">
            <SidebarHeader className="p-4 border-b border-border/20">
                <Link 
                    href="/projects" 
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Back to Projects
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === `/project/${projectId}`}
                                    className="transition-all duration-200"
                                >
                                    <Link href={`/project/${projectId}`}>
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span>Overview</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] px-4">
                        Create
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {createNav.map((item) => {
                                const fullHref = getFullHref(item.href);
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === fullHref || pathname?.startsWith(fullHref)}
                                            className="transition-all duration-200"
                                        >
                                            <Link href={fullHref}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] px-4">
                        Manage
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {manageNav.map((item) => {
                                const fullHref = getFullHref(item.href);
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === fullHref}
                                            className="transition-all duration-200"
                                        >
                                            <Link href={fullHref}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-border/20">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/30 tracking-widest">
                        Workspace v1
                    </span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
