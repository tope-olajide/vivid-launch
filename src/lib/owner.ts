/**
 * src/lib/owner.ts
 * 
 * Unified identity system for VividLaunch.
 * Since authentication is not yet implemented, we use a single constant OWNER_ID.
 * This ensures that all projects, connectors, and credits are tied to a single 
 * "forward-compatible" identity.
 * 
 * Migration path: Once auth is enabled, replace OWNER_ID with auth.user.id.
 */

// TODO: Replace with auth.user.id when authentication is implemented
export const OWNER_ID = "local-user";

/**
 * Credit thresholds for different operations.
 * These are ready for future billing enforcement.
 */
export const CREDIT_COSTS = {
    VIDEO_GENERATION: 10,
    BLOG_GENERATION: 3,
    SOCIAL_POST_SINGLE: 1,
    CONTENT_PACK: 5,
    LAUNCH_CAMPAIGN: 15,
};

export type UserProfile = {
    id: string;
    displayName: string;
    credits: number;
    plan: 'free' | 'pro' | 'enterprise';
    updatedAt: string;
};
