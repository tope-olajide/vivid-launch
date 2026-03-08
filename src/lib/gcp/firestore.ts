import { Firestore } from "@google-cloud/firestore";

// Initialize Firestore
// It automatically picks up credentials from GOOGLE_APPLICATION_CREDENTIALS environment variable
// or parses them if provided explicitly.
const getFirestoreDb = () => {
    // We check if we're in production or development to decide how to load credentials.
    // In Vercel, we can set GCP_PRIVATE_KEY, GCP_CLIENT_EMAIL, and GCP_PROJECT_ID.
    const projectId = process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"); // Handle escaped newlines

    if (projectId && clientEmail && privateKey) {
        return new Firestore({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });
    }

    // Default to Application Default Credentials
    return new Firestore();
};

export const db = getFirestoreDb();

// Collections
export const COLLECTIONS = {
    PROJECTS: "projects",
    ASSETS: "assets",
    CAMPAIGNS: "campaigns",
};
