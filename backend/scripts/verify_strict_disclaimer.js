const axios = require('axios');

const API_URL = 'http://localhost:8000/api/ai/assist';

async function testStrictDisclaimer() {
    console.log("Testing Strict Non-Blog Disclaimer...");
    console.log("\n--- Test: 'What is 2+2?' ---");
    try {
        const res = await axios.post(API_URL, {
            type: 'chat',
            content: 'What is 2+2?',
            messages: [{ role: 'user', content: 'What is 2+2?' }]
        });
        console.log("Response:", res.data.response);
        
        const expected = "Note: please ask some blog related questions.";
        if (res.data.response.includes(expected)) {
             console.log("✅ PASS: Correct strict disclaimer found.");
        } else {
             console.log(`❌ FAIL: Expected to contain "${expected}" but got something else.`);
        }

    } catch (e) {
        if (e.response && e.response.status === 429) {
            console.log("Rate Limit Hit. Please wait a minute and retry.");
        } else {
            console.error("Test Failed", e.message);
        }
    }
}

testStrictDisclaimer();
