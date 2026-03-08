import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const getSecretManagerClient = () => {
    const projectId = process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
        return new SecretManagerServiceClient({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });
    }

    // Default to Application Default Credentials
    return new SecretManagerServiceClient();
};

export const secretManager = getSecretManagerClient();

/**
 * Access a secret version from Google Cloud Secret Manager
 */
export async function accessSecretVersion(secretName: string, version: string = 'latest'): Promise<string> {
    const projectId = process.env.GCP_PROJECT_ID || await secretManager.getProjectId();
    const name = `projects/${projectId}/secrets/${secretName}/versions/${version}`;

    try {
        const [response] = await secretManager.accessSecretVersion({ name });
        const secretPayload = response.payload?.data?.toString();

        if (!secretPayload) {
            throw new Error(`Secret payload for ${name} is empty.`);
        }

        return secretPayload;
    } catch (error) {
        console.error(`Failed to access secret ${name}:`, error);
        throw new Error(`Could not access secret ${secretName}`);
    }
}
