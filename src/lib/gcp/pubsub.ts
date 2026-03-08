import { PubSub } from '@google-cloud/pubsub';

const getPubSubClient = () => {
    const projectId = process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
        return new PubSub({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });
    }

    return new PubSub();
};

export const pubsub = getPubSubClient();

// Pre-defined topics for connectors and workers
export const TOPICS = {
    FFMPEG_RENDER_QUEUE: 'ffmpeg-render-queue',
    PUBLISH_DEVTO: 'publish-devto',
    PUBLISH_YOUTUBE: 'publish-youtube',
    PUBLISH_TWITTER: 'publish-twitter',
};

/**
 * Publish a message to a Pub/Sub topic
 */
export async function publishMessage(topicName: string, data: object) {
    try {
        const dataBuffer = Buffer.from(JSON.stringify(data));
        const messageId = await pubsub.topic(topicName).publishMessage({ data: dataBuffer });
        return messageId;
    } catch (error) {
        console.error(`Error publishing to topic ${topicName}:`, error);
        throw error;
    }
}
