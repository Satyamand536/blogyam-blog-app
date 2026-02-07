const axios = require('axios');

const API_URL = 'http://localhost:8000/api/ai/assist';
// We need a way to authenticate or bypass auth. The route is protected?
// Looking at routes/api.js: `router.post('/ai/assist', rateLimiter, handleAIAssist);`
// It seems it does NOT have `checkForAuthenticationCookie` middleware applied directly in `api.js` for this route, 
// BUT `app.js` might apply it globally?
// Let's check `app.js` later. For now, assuming it might be open or need a cookie.
// If it needs a cookie, this script might fail.
// However, the `rateLimiter` uses IP.

async function testRateLimit() {
    console.log("Testing Rate Limit...");
    try {
        for (let i = 0; i < 7; i++) {
            console.log(`Request ${i + 1}...`);
            try {
                const res = await axios.post(API_URL, {
                    type: 'chat',
                    content: 'Hello',
                    messages: [{ role: 'user', content: 'Hello' }]
                });
                console.log(`Success: ${res.status}`);
            } catch (error) {
                if (error.response) {
                    console.log(`Error: ${error.response.status} - ${error.response.data.message}`);
                } else {
                    console.log(`Error: ${error.message}`);
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}

testRateLimit();
