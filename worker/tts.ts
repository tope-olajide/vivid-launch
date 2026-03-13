import * as textToSpeech from '@google-cloud/text-to-speech';

let client: textToSpeech.TextToSpeechClient | null = null;

function getClient() {
    if (!client) {
        client = new textToSpeech.TextToSpeechClient({
            projectId: process.env.GCP_PROJECT_ID,
            credentials: {
                client_email: process.env.GCP_CLIENT_EMAIL,
                private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            }
        });
    }
    return client;
}

/**
 * Maps our semantic tones to specific GCP voices.
 */
const VOICE_MAP: Record<string, any> = {
    'professional': { languageCode: 'en-US', name: 'en-US-Journey-D' }, 
    'energetic': { languageCode: 'en-US', name: 'en-US-Journey-F' },
    'serious': { languageCode: 'en-GB', name: 'en-GB-News-J' },
    'casual': { languageCode: 'en-US', name: 'en-US-Casual-K' }
};

export async function generateTTS(text: string, tone: string): Promise<Uint8Array | string> {
    const voiceSettings = VOICE_MAP[tone] || VOICE_MAP['professional'];
    
    const request = {
        input: { text: text },
        voice: voiceSettings,
        audioConfig: { audioEncoding: 'MP3' as const },
    };

    const ttsClient = getClient();
    const [response] = await ttsClient.synthesizeSpeech(request);
    if (!response.audioContent) {
        throw new Error('TTS Failed to return audio content');
    }
    
    return response.audioContent;
}
