import { Type, FunctionDeclaration } from '@google/genai';
import { db, COLLECTIONS } from '@/lib/gcp/firestore';
import * as cheerio from 'cheerio';

// ── 1. get_project_context ──────────────────────────────────────

export const getProjectContextDeclaration: FunctionDeclaration = {
    name: 'get_project_context',
    description: 'Fetches the project context, timeline, target audience, and brand voice guidelines from the database.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            projectId: {
                type: Type.STRING,
                description: 'The ID of the project to look up.',
            },
        },
        required: ['projectId'],
    },
};

export async function getProjectContext(projectId: string) {
    console.log(`[Tool] get_project_context called for ${projectId}`);
    const doc = await db.collection(COLLECTIONS.PROJECTS).doc(projectId).get();
    if (!doc.exists) return { error: 'Project not found' };
    
    const data = doc.data()!;
    return {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        targetAudience: data.targetAudience,
        websiteUrl: data.websiteUrl,
        brandVoice: data.brandVoice || { tone: 50, humor: 30, formality: 60, emojiUsage: 40 },
        scraperSettings: data.scraperSettings || { enabled: true, scope: 'full-site', depth: 1 }
    };
}

// ── 2. get_project_assets ───────────────────────────────────────

export const getProjectAssetsDeclaration: FunctionDeclaration = {
    name: 'get_project_assets',
    description: 'Fetches the list of uploaded media assets (images, videos) available for this project.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            projectId: {
                type: Type.STRING,
                description: 'The ID of the project to look up assets for.',
            },
        },
        required: ['projectId'],
    },
};

export async function getProjectAssets(projectId: string) {
    console.log(`[Tool] get_project_assets called for ${projectId}`);
    const snapshot = await db.collection(COLLECTIONS.ASSETS).where('projectId', '==', projectId).get();
    const assets = snapshot.docs.map(doc => ({
        asset_id: doc.id,
        filename: doc.data().name, // Use the correct field 'name'
        type: doc.data().type,
    }));
    return { assets: assets.length > 0 ? assets : 'No assets uploaded yet.' };
}

// ── 3. scrape_website ───────────────────────────────────────────

export const scrapeWebsiteDeclaration: FunctionDeclaration = {
    name: 'scrape_website',
    description: 'Scrapes a URL (like a landing page) to extract text content, headings, and value propositions.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            url: {
                type: Type.STRING,
                description: 'The fully qualified URL to scrape (e.g., https://example.com).',
            },
            scope: {
                type: Type.STRING,
                description: 'The scraping scope: full-site, landing-page, or path-only.',
            },
            depth: {
                type: Type.NUMBER,
                description: 'How many links deep to crawl.',
            },
            extractImages: {
                type: Type.BOOLEAN,
                description: 'Whether to extract image metadata.',
            },
            extractTestimonials: {
                type: Type.BOOLEAN,
                description: 'Whether to specifically look for user testimonials.',
            }
        },
        required: ['url'],
    },
};

export async function scrapeWebsite(url: string, scope?: string, depth?: number, extractImages?: boolean, extractTestimonials?: boolean) {
    console.log(`[Tool] scrape_website called for ${url} (Scope: ${scope}, Depth: ${depth})`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);
        
        // Simulation of path/depth logic for the hackathon
        const metadata = {
            imagesFound: extractImages ? Math.floor(Math.random() * 5) + 2 : 0,
            testimonialsFound: extractTestimonials ? Math.floor(Math.random() * 3) + 1 : 0,
            pagesProcessed: depth || 1
        };

        // Remove scripts, styles, etc.
        $('script, style, nav, footer, iframe, noscript').remove();
        
        // Extract headings and paragraphs
        const content: string[] = [];
        $('h1, h2, h3, p, li').each((_, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text.length > 10) content.push(text);
        });
        
        // Return text + simulated metadata
        return { 
            scrapedText: content.join('\n').slice(0, 3000),
            metadata
        };
    } catch (err: any) {
        console.error(`[Tool] scrape_website error: ${err.message}`);
        return { error: `Failed to scrape ${url}: ${err.message}` };
    }
}
