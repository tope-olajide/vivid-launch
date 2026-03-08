import { CloudTasksClient } from '@google-cloud/tasks';

const getTasksClient = () => {
    const projectId = process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
        return new CloudTasksClient({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });
    }

    return new CloudTasksClient();
};

export const tasksClient = getTasksClient();

/**
 * Schedule an HTTP task to be executed at a specific time in the future.
 * Useful for delaying publishing.
 */
export async function createHttpTask(
    queueId: string,
    locationId: string,
    url: string,
    payload: object,
    inSeconds: number = 0
) {
    const projectId = process.env.GCP_PROJECT_ID || await tasksClient.getProjectId();

    // Construct the fully qualified queue name.
    const parent = tasksClient.queuePath(projectId, locationId, queueId);

    const task = {
        httpRequest: {
            httpMethod: 'POST' as const,
            url,
            headers: {
                'Content-Type': 'application/json',
            },
            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        },
        scheduleTime: {
            seconds: inSeconds > 0 ? inSeconds + Math.floor(Date.now() / 1000) : undefined,
        },
    };

    try {
        const [response] = await tasksClient.createTask({ parent, task });
        return response.name;
    } catch (error) {
        console.error("Error creating Cloud Task:", error);
        throw error;
    }
}
