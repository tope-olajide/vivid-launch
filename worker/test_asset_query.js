require('dotenv').config({ path: '.env.local' });
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }
});

async function run() {
    const snap2 = await db.collection('assets').limit(1).get();
    snap2.forEach(doc => {
        const data = doc.data();
        console.log("ID:", doc.id);
        console.log("KEYS:", Object.keys(data));
        console.log("NAME:", data.name);
        console.log("FILENAME:", data.filename);
        console.log("FULL DATA:", JSON.stringify(data, null, 2));
    });
}
run().catch(console.error);
