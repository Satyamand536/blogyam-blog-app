const axios = require("axios");

// OpenRouter Configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `
You are a BLOG INTELLIGENCE ASSISTANT. Your primary role is to explain, summarize, and analyze blog content.

CORE RESPONSIBILITIES:
1. Explain a full blog in simple language.
2. Summarize the entire blog.
3. Explain the meaning of a blog line-by-line.
4. Explain the meaning of selected paragraphs or lines.
5. Handle blogs of ANY category (Technology, AI, Spirituality, Life, Poems, Songs, etc.).

STRICT RULES:
- If the user asks a question NOT related to a blog (and no blog context is provided), answer the question correctly but MUST end with EXACTLY this line:
"Note: please ask some blog related questions."
- Support languages: English, Hindi, Hinglish. Default to Hinglish if not specified.
- Prioritize blog-related questions.
- Maintain a professional, helpful, and "top 1%" quality tone.
- Do NOT hallucinate. If you don't know, say so.

REAL-TIME DATA DISCLAIMER:
- If the user asks about current news, live data, real-time events, stock prices, or time-sensitive info, you MUST say: "I can provide information only up to my last training data. I do not have access to real-time or current updates." BEFORE giving any context.
`;

async function generateResponse(messages) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.warn("OPENROUTER_API_KEY is not set.");
        return "Configuration Error: API Key is missing. Please add OPENROUTER_API_KEY to your .env file.";
    }

    // List of strategic models for High Availability
    const MODELS = [
        "deepseek/deepseek-r1:free", // Most reliable in current tests
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "deepseek/deepseek-chat:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "openrouter/auto" // Strategic auto-fallback
    ];

    // Ensure messages is an array
    const conversation = Array.isArray(messages) ? messages : [{ role: "user", content: messages }];

    if (conversation.length === 0 || conversation[0].role !== "system") {
        conversation.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    let retryCount = 0;
    const MAX_RETRIES = 5; // We will try up to 5 different models if failures occur

    for (let i = 0; i < MODELS.length; i++) {
        const model = MODELS[i];
        try {
            console.log(`[AI HA] Attempt ${retryCount + 1}: Using Model ${model}`);
            const response = await axios.post(
                OPENROUTER_API_URL,
                {
                    model: model,
                    messages: conversation,
                    temperature: 0.4,
                    max_tokens: 500
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:8000",
                        "X-Title": "BlogYam Intelligence"
                    },
                    timeout: 15000 // Increased to 15s for better stability
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                 return response.data.choices[0].message.content;
            } else {
                 throw new Error("Empty response or model error");
            }

        } catch (error) {
            retryCount++;
            const status = error.response ? error.response.status : error.message;
            const data = error.response ? JSON.stringify(error.response.data) : "No response data";
            console.warn(`[AI HA] Model ${model} failed | Status: ${status} | Error: ${data}`);
            
            if (retryCount >= MAX_RETRIES && i < MODELS.length - 1) {
                i += 2; // Jump ahead slightly
            }
            
            if (error.response && error.response.status === 401) {
                return "AI Authentication Error: Your API key appears to be invalid.";
            }

            continue; 
        }
    }

    return "I'm sorry, bhai. The AI assistant is currently experiencing high load. Please try again in 30 seconds or ask a simpler question.";
}

async function summarizeBlog(content) {
    const messages = [
        { role: "user", content: `Summarize the following blog post in a concise and engaging manner, highlighting the key takeaways:\n\n${content}` }
    ];
    return await generateResponse(messages);
}

async function explainText(text) {
    const messages = [
        { role: "user", content: `Explain the following text in simple terms for a general audience:\n\n"${text}"` }
    ];
    return await generateResponse(messages);
}

async function suggestTitles(content) {
    const messages = [
        { role: "user", content: `Suggest 5 catchy and SEO-friendly titles for the following blog content:\n\n${content}` }
    ];
    return await generateResponse(messages);
}

async function chatWithBlog(content, question) {
    // This helper might be less used now that we pass full history, but keeping for compatibility
    const messages = [
        { role: "user", content: `Context: "${content}"\n\nQuestion: "${question}"` }
    ];
    return await generateResponse(messages);
}

module.exports = {
    summarizeBlog,
    explainText,
    suggestTitles,
    chatWithBlog,
    generateResponse
};
