"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
    LayoutDashboard, 
    FolderOpen, 
    FolderPlus, 
    Settings, 
    Sparkles, 
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Projects", href: "/projects", icon: FolderOpen },
    { title: "Settings", href: "/settings", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="container flex h-16 items-center justify-between px-6 mx-auto">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            VividLaunch
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-lg transition-all relative",
                                    pathname === item.href 
                                        ? "text-white" 
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                {item.title}
                                {pathname === item.href && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-full"
                                    />
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <Button asChild className="hidden sm:flex bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold gap-2 rounded-xl shadow-lg shadow-violet-500/20">
                        <Link href="/projects/new">
                            <Plus className="h-4 w-4" />
                            New Project
                        </Link>
                    </Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
