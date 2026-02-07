const axios = require('axios');

async function testChatbase() {
    console.log("Testing Chatbase Public Access...");
    const chatbotId = "vF4-CsphN0AorhkHDvBkN";
    const url = "https://www.chatbase.co/api/v1/chat";

    try {
        const response = await axios.post(
            url,
            {
                messages: [{ role: "user", content: "Hello" }],
                chatbotId: chatbotId,
                stream: false
            },
            {
                // No Authorization Header
                headers: { "Content-Type": "application/json" }
            }
        );
        console.log("SUCCESS:", response.data);
    } catch (error) {
        console.error("FAILED:", error.response ? error.response.status : error.message);
        if (error.response) console.error("Data:", error.response.data);
    }
}

testChatbase();
