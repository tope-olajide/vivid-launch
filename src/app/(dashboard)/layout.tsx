"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isProjectWorkspace = pathname?.includes("/project/");

    return (
        <div className="flex min-h-screen flex-col">
            {!isProjectWorkspace && <Navbar />}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
