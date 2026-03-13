import { downloadFromGCS } from './assets';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testAsset() {
    try {
        const testId = 'ovw9LcLil8HjnfJ3t33u';
        const dest = path.join(__dirname, 'tmp', `test_asset_${Date.now()}.jpg`);
        console.log(`Testing download for asset: ${testId}`);
        const resultPath = await downloadFromGCS(testId, dest);
        console.log(`Success! Saved to ${resultPath}`);
    } catch (e: any) {
        console.error('Error downloading asset:', e.message);
    }
}
testAsset();
