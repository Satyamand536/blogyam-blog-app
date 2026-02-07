const axios = require('axios');

const API_URL = 'http://localhost:8000/api/ai/assist';

async function testRealtimeDisclaimer() {
    console.log("Testing Real-time Disclaimer...");
    console.log("\n--- Test: 'What is the stock price of Apple?' ---");
    try {
        const res = await axios.post(API_URL, {
            type: 'chat',
            content: 'What is the stock price of Apple right now?',
            messages: [{ role: 'user', content: 'What is the stock price of Apple right now?' }]
        });
        console.log("Response:", res.data.response);
        
        if (res.data.response.includes("I do not have access to real-time")) {
             console.log("✅ PASS: Disclaimer found.");
        } else {
             console.log("❌ FAIL: Disclaimer NOT found.");
        }

    } catch (e) {
        if (e.response && e.response.status === 429) {
            console.log("Rate Limit Hit. Please wait a minute and retry.");
        } else {
            console.error("Test Failed", e.message);
        }
    }
}

testRealtimeDisclaimer();
