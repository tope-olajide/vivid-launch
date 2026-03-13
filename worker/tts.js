"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTTS = generateTTS;
const textToSpeech = __importStar(require("@google-cloud/text-to-speech"));
let client = null;
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
const VOICE_MAP = {
    'professional': { languageCode: 'en-US', name: 'en-US-Journey-D' },
    'energetic': { languageCode: 'en-US', name: 'en-US-Journey-F' },
    'serious': { languageCode: 'en-GB', name: 'en-GB-News-J' },
    'casual': { languageCode: 'en-US', name: 'en-US-Casual-K' }
};
async function generateTTS(text, tone) {
    const voiceSettings = VOICE_MAP[tone] || VOICE_MAP['professional'];
    const request = {
        input: { text: text },
        voice: voiceSettings,
        audioConfig: { audioEncoding: 'MP3' },
    };
    const ttsClient = getClient();
    const [response] = await ttsClient.synthesizeSpeech(request);
    if (!response.audioContent) {
        throw new Error('TTS Failed to return audio content');
    }
    return response.audioContent;
}
