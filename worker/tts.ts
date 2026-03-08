import * as textToSpeech from '@google-cloud/text-to-speech';

// Requires GOOGLE_APPLICATION_CREDENTIALS in environment
const client = new textToSpeech.TextToSpeechClient();

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

    const [response] = await client.synthesizeSpeech(request);
    if (!response.audioContent) {
        throw new Error('TTS Failed to return audio content');
    }
    
    return response.audioContent;
}
