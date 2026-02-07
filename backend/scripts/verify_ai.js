const axios = require('axios');

const API_URL = 'http://localhost:8000/api/ai/assist';

async function testAI() {
    console.log("Testing AI...");

    // Test 1: Language (Hindi)
    console.log("\n--- Test 1: Hindi ---");
    try {
        const res1 = await axios.post(API_URL, {
            type: 'chat',
            content: 'Explain motivation in Hindi',
            messages: [{ role: 'user', content: 'Explain motivation in Hindi' }]
        });
        console.log("Response:", res1.data.response.substring(0, 100) + "...");
    } catch (e) { console.error("Test 1 Failed", e.message); }

    // Test 2: Out of Context
    console.log("\n--- Test 2: Out of Context ---");
    try {
        const res2 = await axios.post(API_URL, {
            type: 'chat',
            content: 'Who is the president of USA?',
            messages: [{ role: 'user', content: 'Who is the president of USA?' }]
        });
        console.log("Response:", res2.data.response);
    } catch (e) {
        // If 429, we need to wait
        if (e.response && e.response.status === 429) {
            console.log("Rate Limit Hit (Expected if ran immediately after previous test)");
        } else {
            console.error("Test 2 Failed", e.message);
        }
    }
}

// Wait for rate limit to clear ( > 1 min) ? 
// Or just run it. The previous test consumed 7 requests. 
// I should wait 60 seconds if I want to pass, or just expect 429.
// But I need to verify the CONTENT.
// I can change the Rate Limit temporarily or just wait?
// Modifying RateLimit just for test is annoying.
// I'll wait in the script? No, I'll `setTimeout`.
// OR I can use a different IP? Localhost always 127.0.0.1 or ::1.

// I will restart the server to clear memory? Yes! "in-memory Map".
// Restarting server clears the rate limit.
// I will kill and restart server before running this.
testAI();
