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

    // List of ~70+ strategic models for Top 1% High Availability & Scalability
    const MODELS = [
        // TIER 1: HIGH PERFORMANCE (PRIMARY)
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "deepseek/deepseek-r1:free",
        "deepseek/deepseek-chat:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "nvidia/llama-3.1-nemotron-70b-instruct:free",
        
        // TIER 2: RELIABILITY FALLBACKS (FREE & STABLE)
        "mistralai/mistral-7b-instruct:free",
        "microsoft/phi-3-medium-128k-instruct:free",
        "gryphe/mythomax-l2-13b:free",
        "google/learnlm-1.5-pro-experimental:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "qwen/qwen-2.5-7b-instruct:free",
        "qwen/qwen-2.5-coder-32b-instruct:free",
        "qwen/qwq-32b-preview:free",
        "mistralai/pixtral-12b:free",
        "mistralai/mistral-nemo:free",
        "liquid/lfm-40b:free",
        "huggingfaceh4/zephyr-7b-beta:free",
        "openchat/openchat-7b:free",
        "cognitivecomputations/dolphin-mixtral-8x7b:free",
        "nousresearch/hermes-3-llama-3.1-405b:free",
        "nousresearch/hermes-3-llama-3.1-70b:free",
        
        // TIER 3: PAID HIGH-END (FOR CRITICAL FALLBACKS)
        "anthropic/claude-3.5-sonnet",
        "google/gemini-pro-1.5",
        "openai/gpt-4o",
        "openai/gpt-4o-mini",
        "anthropic/claude-3-haiku",
        "x-ai/grok-2-1212",
        "cohere/command-r-plus-08-2024",
        
        "openrouter/auto" // FINAL FALLBACK
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
                        "HTTP-Referer": "http://localhost:8000",
                        "X-Title": "BlogYam Intelligence"
                    },
                    timeout: 8000 // Fast timeout (8s) for ultra-responsiveness
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                 return response.data.choices[0].message.content;
            } else {
                 throw new Error("Empty response or model error");
            }

        } catch (error) {
            retryCount++;
            const errorMsg = error.response ? error.response.status : error.message;
            console.warn(`[AI HA] Model ${model} failed (${errorMsg}). Trying next...`);
            
            if (retryCount >= MAX_RETRIES && i < MODELS.length - 1) {
                // If we've failed 5 times, but still have models, let's skip ahead to a different "Family"
                // This is a strategic jump for high availability
                i += 5; 
            }
            
            if (error.response && error.response.status === 401) {
                return "AI Authentication Error: Your API key appears to be invalid.";
            }

            continue; // Continue to next model in loop
        }
    }

    return "Service Unavailable: The AI infrastructure is currently under heavy load (exhausted 50 models). Please try again in 30 seconds.";
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
