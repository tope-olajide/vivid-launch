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
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const storage_1 = require("@google-cloud/storage");
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
async function fixCors() {
    const storage = new storage_1.Storage({
        projectId: process.env.GCP_PROJECT_ID,
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL,
            private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
    });
    const bucketName = process.env.GCS_BUCKET_NAME || 'vividlaunch-assets';
    console.log(`Setting CORS for bucket: ${bucketName}`);
    const cors = [
        {
            origin: ['*'], // Allow all during development/hackathon for convenience
            method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            responseHeader: ['Content-Type', 'Authorization', 'Content-Range', 'Accept-Ranges', 'Range'],
            maxAgeSeconds: 3600
        }
    ];
    try {
        await storage.bucket(bucketName).setCorsConfiguration(cors);
        console.log('✅ CORS configuration updated successfully.');
        const [metadata] = await storage.bucket(bucketName).getMetadata();
        console.log('Updated CORS:', JSON.stringify(metadata.cors, null, 2));
    }
    catch (err) {
        console.error(`ERROR: ${err.message}`);
    }
}
fixCors();
