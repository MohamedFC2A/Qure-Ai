/**
 * MedVision API Tester
 * 
 * Usage:
 * 1. Set your API Key below or export it as env var MEDVISION_API_KEY
 * 2. Run: node scripts/test-medvision.js
 */

const https = require('https');

// CONFIGURATION
const API_KEY = process.env.MEDVISION_API_KEY || "mv_sk_REPLACE_WITH_YOUR_KEY"; // <--- PUT YOUR KEY HERE
const BASE_URL = "http://localhost:3000"; // Change to your production URL if needed

const post = (path, data) => {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const body = JSON.stringify(data);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'Content-Length': body.length
            }
        };

        const req = (url.protocol === 'https:' ? require('https') : require('http')).request(url, options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseBody));
                } catch (e) {
                    resolve({ raw: responseBody, error: "Failed to parse JSON" });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.write(body);
        req.end();
    });
};

async function runTests() {
    console.log(`\n🧪 MedVision API Tester`);
    console.log(`   Target: ${BASE_URL}`);
    console.log(`   Key:    ${API_KEY.substring(0, 10)}...`);
    console.log('---------------------------------------------------\n');

    // TEST 1: INPUT MODE
    try {
        console.log(`[TEST 1] Input Mode: "Panadol Extra"`);
        const result = await post('/api/v1/analyze', { text: "Panadol Extra" });
        console.log(`Status: ${result.error ? '❌ FAIL' : '✅ PASS'}`);
        if (result.error) console.error("Error:", result.error);
        else console.log("Result:", JSON.stringify(result, null, 2).substring(0, 200) + "...");
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }

    console.log('\n---------------------------------------------------\n');

    // TEST 2: SIMULATED OCR
    try {
        console.log(`[TEST 2] OCR Mode (Simulated Text)`);
        console.log(`   - Simulating text extracted from image: "Ibuprofen 200mg twice daily"`);
        const result = await post('/api/v1/analyze', { text: "Ibuprofen 200mg twice daily", mode: "ocr_simulation" });
        console.log(`Status: ${result.error ? '❌ FAIL' : '✅ PASS'}`);
        if (result.error) console.error("Error:", result.error);
        else console.log("Result:", JSON.stringify(result, null, 2).substring(0, 200) + "...");
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }

    console.log('\n---------------------------------------------------\n');
}

runTests();
