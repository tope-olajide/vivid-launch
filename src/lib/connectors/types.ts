/**
 * src/lib/connectors/types.ts
 *
 * Shared types for all distribution connectors.
 */

export type ConnectorId =
    | 'devto'
    | 'hashnode'
    | 'medium'
    | 'ghost'
    | 'contentful'
    | 'youtube'
    | 'twitter'
    | 'instagram';

export interface ConnectorConfig {
    id: ConnectorId;
    /** User-supplied credential fields for this connector */
    credentials: Record<string, string>;
    connectedAt: string; // ISO date string
}

/** What we save to Firestore under projects/{projectId}/connectors/{connectorId} */
export interface StoredConnector extends ConnectorConfig {
    projectId: string;
}

/** The content payload sent to each publish endpoint */
export interface PublishPayload {
    projectId: string;
    connectorId: ConnectorId;
    /** For blog/CMS connectors */
    title?: string;
    body?: string;         // Markdown or HTML
    tags?: string[];
    coverImageUrl?: string;
    /** For video connectors */
    videoGcsPath?: string; // gs:// path in GCS
    videoTitle?: string;
    videoDescription?: string;
    /** For social connectors */
    caption?: string;
    mediaUrls?: string[];
}

export interface PublishResult {
    success: boolean;
    url?: string;       // URL of the published post/video
    id?: string;        // Platform ID of the published item
    error?: string;
}
