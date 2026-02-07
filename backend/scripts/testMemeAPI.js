/**
 * Quick API Test Script
 */
const axios = require('axios');

async function testAPI() {
    try {
        const response = await axios.get('http://localhost:8000/api/memes/templates');
        console.log('API Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Network Error:', error.message);
        }
    }
}

testAPI();
