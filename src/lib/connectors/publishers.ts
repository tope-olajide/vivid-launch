/**
 * src/lib/connectors/publishers.ts
 *
 * Individual platform publishing functions.
 * Each function accepts credentials + content and calls the platform API.
 */

import type { PublishPayload, PublishResult, ConnectorId } from './types';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function post(url: string, body: unknown, headers: Record<string, string>): Promise<any> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`[${res.status}] ${text}`);
    }
    return res.json();
}

// ─────────────────────────────────────────────────────────────
// Dev.to
// ─────────────────────────────────────────────────────────────

export async function publishToDevto(
    creds: Record<string, string>,
    payload: PublishPayload,
): Promise<PublishResult> {
    const data = await post(
        'https://dev.to/api/articles',
        {
            article: {
                title: payload.title || 'Untitled',
                body_markdown: payload.body || '',
                published: true,
                tags: payload.tags?.slice(0, 4) || [],
                main_image: payload.coverImageUrl,
            },
        },
        { 'api-key': creds.apiKey },
    );
    return { success: true, url: data.url, id: String(data.id) };
}

// ─────────────────────────────────────────────────────────────
// Hashnode
// ─────────────────────────────────────────────────────────────

export async function publishToHashnode(
    creds: Record<string, string>,
    payload: PublishPayload,
): Promise<PublishResult> {
    const query = `
        mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) {
            post { id url }
          }
        }
    `;
    const res = await fetch('https://gql.hashnode.com/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: creds.apiKey,
        },
        body: JSON.stringify({
            query,
            variables: {
                input: {
                    title: payload.title || 'Untitled',
                    contentMarkdown: payload.body || '',
                    publicationId: creds.publicationId,
                    tags: [],
                    coverImageOptions: payload.coverImageUrl
                        ? { coverImageURL: payload.coverImageUrl }
                        : undefined,
                },
            },
        }),
    });
    const json = (await res.json()) as any;
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    const post = json.data?.publishPost?.post;
    return { success: true, url: post?.url, id: post?.id };
}

// ─────────────────────────────────────────────────────────────
// Medium
// ─────────────────────────────────────────────────────────────

export async function publishToMedium(
    creds: Record<string, string>,
    payload: PublishPayload,
): Promise<PublishResult> {
    // Get author ID first
    const userRes = await fetch('https://api.medium.com/v1/me', {
        headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
    if (!userRes.ok) throw new Error('Medium: failed to get user info');
    const user = (await userRes.json()) as any;
    const authorId: string = user.data?.id;

    const data = await post(
        `https://api.medium.com/v1/users/${authorId}/posts`,
        {
            title: payload.title || 'Untitled',
            contentFormat: 'markdown',
            content: payload.body || '',
            publishStatus: 'public',
            tags: payload.tags?.slice(0, 5) || [],
        },
        { Authorization: `Bearer ${creds.apiKey}` },
    );
    return { success: true, url: data.data?.url, id: data.data?.id };
}

// ─────────────────────────────────────────────────────────────
// Ghost
// ─────────────────────────────────────────────────────────────

function ghostJwt(key: string): string {
    // Ghost Admin API uses a split key: id:secret
    // For simplicity we use direct Admin API key auth (header: Ghost <key>)
    return key;
}

export async function publishToGhost(
    creds: Record<string, string>,
    payload: PublishPayload,
): Promise<PublishResult> {
    const baseUrl = creds.apiUrl.replace(/\/$/, '');
    const data = await post(
        `${baseUrl}/ghost/api/admin/posts/?source=html`,
        {
            posts: [{
                title: payload.title || 'Untitled',
                html: payload.body || '',
                status: 'published',
                tags: payload.tags?.map((t) => ({ name: t })) || [],
                feature_image: payload.coverImageUrl,
            }],
        },
        { Authorization: `Ghost ${creds.adminApiKey}` },
    );
    const post_ = data.posts?.[0];
    return { success: true, url: post_?.url, id: post_?.id };
}

// ─────────────────────────────────────────────────────────────
// YouTube  (Upload via resumable upload — returns upload link)
// In production this would use OAuth2. Here we use a service-account
// access token for a YouTube Data API v3 call.
// ─────────────────────────────────────────────────────────────

export async function publishToYouTube(
    creds: Record<string, string>,
    payload: PublishPayload,
): Promise<PublishResult> {
    // For now: create a metadata-only "snippet" entry so the user can
    // link the video. Full binary upload requires a resumable session.
    // This records intent and returns an upload URI.
    const uploadInitRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${creds.accessToken}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': 'video/mp4',
            },
            body: JSON.stringify({
                snippet: {
                    title: payload.videoTitle || payload.title || 'VividLaunch Video',
                    description: payload.videoDescription || '',
                    tags: payload.tags || [],
                    categoryId: '22', // People & Blogs
                },
                status: { privacyStatus: 'public' },
            }),
        },
    );
    if (!uploadInitRes.ok) {
        const err = await uploadInitRes.text();
        throw new Error(`YouTube upload init failed: ${err}`);
    }
    const uploadUri = uploadInitRes.headers.get('location');
    return {
        success: true,
        url: uploadUri || '',
        id: 'resumable-session-initiated',
    };
}

// ─────────────────────────────────────────────────────────────
// X (Twitter) — using v2 OAuth2 bearer
// ─────────────────────────────────────────────────────────────

export async function publishToTwitter(
    creds: Record<string, string>,
    payload: PublishPayload,
): Promise<PublishResult> {
    const text = payload.caption || payload.title || '';
    const data = await post(
        'https://api.twitter.com/2/tweets',
        { text: text.slice(0, 280) },
        { Authorization: `Bearer ${creds.bearerToken}` },
    );
    const tweetId: string = data.data?.id;
    return {
        success: true,
        url: `https://x.com/i/web/status/${tweetId}`,
        id: tweetId,
    };
}

// ─────────────────────────────────────────────────────────────
// Instagram — Basic Display API (caption-only; media upload via
// Graph API requires Facebook app review & server hosting)
// ─────────────────────────────────────────────────────────────

export async function publishToInstagram(
    creds: Record<string, string>,
    payload: PublishPayload,
): Promise<PublishResult> {
    const igUserId = creds.instagramUserId;
    const accessToken = creds.accessToken;

    if (!payload.mediaUrls?.[0]) {
        throw new Error('Instagram publish requires at least one media URL (publicly reachable image/video).');
    }

    const isVideo = payload.mediaUrls[0].endsWith('.mp4');

    // Step 1: Create media container
    const containerRes = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: accessToken,
                caption: payload.caption || payload.title || '',
                ...(isVideo
                    ? { media_type: 'REELS', video_url: payload.mediaUrls[0] }
                    : { image_url: payload.mediaUrls[0] }),
            }),
        },
    );
    if (!containerRes.ok) throw new Error(`Instagram container error: ${await containerRes.text()}`);
    const container = (await containerRes.json()) as any;

    // Step 2: Publish the container
    const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
        },
    );
    if (!publishRes.ok) throw new Error(`Instagram publish error: ${await publishRes.text()}`);
    const published = (await publishRes.json()) as any;

    return {
        success: true,
        id: published.id,
        url: `https://www.instagram.com/p/${published.id}`,
    };
}

// ─────────────────────────────────────────────────────────────
// Router — dispatches to the correct publisher
// ─────────────────────────────────────────────────────────────

export async function publishWithConnector(
    connectorId: ConnectorId,
    credentials: Record<string, string>,
    payload: PublishPayload,
): Promise<PublishResult> {
    switch (connectorId) {
        case 'devto':       return publishToDevto(credentials, payload);
        case 'hashnode':    return publishToHashnode(credentials, payload);
        case 'medium':      return publishToMedium(credentials, payload);
        case 'ghost':       return publishToGhost(credentials, payload);
        case 'youtube':     return publishToYouTube(credentials, payload);
        case 'twitter':     return publishToTwitter(credentials, payload);
        case 'instagram':   return publishToInstagram(credentials, payload);
        default:
            throw new Error(`Unknown connector: ${connectorId}`);
    }
}
