import textToSpeech from '@google-cloud/text-to-speech';

// Initialize Cloud TTS
const getTtsClient = () => {
    const projectId = process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
        return new textToSpeech.TextToSpeechClient({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });
    }

    // Default to Application Default Credentials
    return new textToSpeech.TextToSpeechClient();
};

export const ttsClient = getTtsClient();

/**
 * Maps a Gemini-generated descriptive tone (e.g., "confident", "serious")
 * into a specific Google Cloud TTS voice configuration.
 */
function mapToneToVoice(tone: string): { languageCode: string; name: string; ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL' } {
    const t = tone.toLowerCase();
    
    // Choose from Journey and Studio voices for the best, most premium quality
    if (t.includes('professional') || t.includes('serious') || t.includes('authoritative')) {
        return { languageCode: 'en-US', name: 'en-US-Studio-Q', ssmlGender: 'MALE' }; 
    }
    
    if (t.includes('playful') || t.includes('friendly') || t.includes('warm') || t.includes('casual')) {
        return { languageCode: 'en-US', name: 'en-US-Journey-F', ssmlGender: 'FEMALE' };
    }

    if (t.includes('confident') || t.includes('empowering') || t.includes('inspiring')) {
        return { languageCode: 'en-US', name: 'en-US-Journey-D', ssmlGender: 'MALE' };
    }

    // Default to a high-quality Journey voice
    return { languageCode: 'en-US', name: 'en-US-Journey-O', ssmlGender: 'FEMALE' };
}

/**
 * Synthesizes text into an MP3 audio buffer using Google Cloud TTS.
 */
export async function generateTTS(text: string, tone: string): Promise<Uint8Array | string> {
    const voice = mapToneToVoice(tone);

    const request = {
        input: { text: text },
        voice: voice,
        audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    
    if (!response.audioContent) {
        throw new Error("Failed to generate TTS audio content from Google Cloud.");
    }

    return response.audioContent;
}
