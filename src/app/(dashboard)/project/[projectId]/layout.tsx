import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProjectSidebar } from "@/components/project-sidebar";

export default function ProjectWorkspaceLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { projectId: string };
}) {
    return (
        <SidebarProvider>
            <ProjectSidebar />
            <SidebarInset>
                <main className="flex-1 overflow-auto bg-zinc-950/20">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
