import { NextResponse } from "next/server";
import { db, COLLECTIONS } from "@/lib/gcp/firestore";
import { OWNER_ID } from "@/lib/owner";

export async function GET() {
    try {
        // 1. Fetch all projects for the owner
        const projectsSnapshot = await db.collection(COLLECTIONS.PROJECTS)
            .where('ownerId', '==', OWNER_ID)
            .get();

        const projects = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 2. Count "Videos Generated" (projects with a rendered video)
        const videosGenerated = projects.filter((p: any) => p.lastRenderedVideoGcsPath).length;

        // 3. Fetch connectors to count Social and Blog posts via usageCount
        // Connectors are stored in owners/{ownerId}/connectors/
        const connectorsSnapshot = await db
            .collection(COLLECTIONS.OWNERS)
            .doc(OWNER_ID)
            .collection('connectors')
            .get();

        const connectors = connectorsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
        }));

        const socialPlatforms = ['twitter', 'linkedin', 'instagram', 'tiktok', 'facebook', 'reddit'];
        const blogPlatforms = ['medium', 'ghost', 'devto', 'hashnode'];

        let socialPosts = 0;
        let blogPosts = 0;

        connectors.forEach(conn => {
            if (socialPlatforms.includes(conn.id)) {
                socialPosts += (conn.usageCount || 0);
            } else if (blogPlatforms.includes(conn.id)) {
                blogPosts += (conn.usageCount || 0);
            }
        });

        // 4. Get 3 most recent projects
        const recentProjects = [...projects]
            .sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, 3);

        return NextResponse.json({
            stats: {
                projectsCount: projects.length,
                videosGenerated,
                blogPosts,
                socialPosts,
            },
            recentProjects
        });

    } catch (error: any) {
        console.error("[Dashboard Stats API Error]", error);
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }
}
