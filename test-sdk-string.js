require('dotenv').config({ path: '.env.local' });
const { streamObject } = require('ai');
const { google } = require('@ai-sdk/google');
const { z } = require('zod');

async function testSDK() {
    try {
        const result = await streamObject({
            model: google('gemini-1.5-flash'),
            schema: z.object({a:z.string()}),
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: 'Hello' },
                    { type: 'file', data: 'gs://storage/vividlaunch-assets/test.mp4', mimeType: 'video/mp4' }
                ]
            }]
        });
        console.log("Validation passed! Stream object created.");
    } catch (error) {
        console.error("SDK Error:");
        console.error(error);
    }
}

testSDK();
