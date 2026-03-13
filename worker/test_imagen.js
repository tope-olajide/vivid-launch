require('dotenv').config({ path: '.env.local' });
const GCP_PROJECT = process.env.GCP_PROJECT_ID;
const location = 'us-central1';
const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;
console.log("Endpoint:", endpoint);

async function testImagen() {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
        credentials: {
            client_email: process.env.GCP_CLIENT_EMAIL,
            private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client  = await auth.getClient();
    const token   = (await client.getAccessToken()).token;

    const body = {
        instances: [{ prompt: "A glowing blue cube" }],
        parameters: { sampleCount: 1 }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        console.error("404 Error details:", await response.text());
    } else {
        console.log("Success! Imagen works.");
    }
}
testImagen().catch(console.error);
