import { Storage } from "@google-cloud/storage";

// Initialize Cloud Storage
const getStorageClient = () => {
    const projectId = process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
        return new Storage({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });
    }

    // Default to Application Default Credentials
    return new Storage();
};

export const storage = getStorageClient();

export const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "vividlaunch-assets";

/**
 * Generates a signed URL for uploading a file directly to Cloud Storage.
 * This lets the client bypass the Next.js API payload limits.
 */
export async function generateV4UploadSignedUrl(
    fileName: string,
    contentType: string,
    projectId: string
) {
    // We prefix the file with the project ID to keep assets grouped
    const filePath = `projects/${projectId}/${Date.now()}_${fileName}`;

    const options = {
        version: "v4" as const,
        action: "write" as const,
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType,
    };

    const [url] = await storage
        .bucket(BUCKET_NAME)
        .file(filePath)
        .getSignedUrl(options);

    return {
        url,
        filePath,
        publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`,
    };
}

/**
 * Generates a signed URL for reading a file from Cloud Storage.
 * This lets the server-side AI SDK fetch private bucket files temporarily.
 */
export async function generateV4ReadSignedUrl(gcsUrl: string) {
    if (!gcsUrl) return "";

    let bucketName = BUCKET_NAME;
    let filePath = "";

    if (gcsUrl.startsWith("gs://")) {
        const parts = gcsUrl.replace("gs://", "").split("/");
        bucketName = parts.shift() || BUCKET_NAME;
        filePath = parts.join("/");
    } else {
        // Extract the filePath from the public URL
        const baseUrl = `https://storage.googleapis.com/${BUCKET_NAME}/`;
        if (!gcsUrl.startsWith(baseUrl)) {
            return gcsUrl; // Fallback if it's already a different URL format
        }
        filePath = gcsUrl.replace(baseUrl, "");
    }

    const options = {
        version: "v4" as const,
        action: "read" as const,
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    const [url] = await storage
        .bucket(bucketName)
        .file(filePath)
        .getSignedUrl(options);

    return url;
}
