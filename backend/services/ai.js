const axios = require("axios");

// ============================================================
// NVIDIA NIM API Configuration
// Docs: https://docs.api.nvidia.com/nim/reference/
// ============================================================
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const SYSTEM_PROMPT = `
You are Blogam Intelligence, an advanced AI assistant embedded within a blogging platform.
Your primary role is to assist users with reading, understanding, and creating content on Blogam.

CRITICAL INSTRUCTIONS:

1. **Language Support**: 
   - You MUST understand and fluently respond in **English**, **Hindi**, and **Hinglish** (Hindi written in English script). 
   - Detect the user's language and reply in the same language/style. 
   - If the user uses a mix, reply in Hinglish.

2. **Context Awareness**: 
   - **Specific Blog**: If the user asks about the specific blog post they are reading, answer strictly based on that blog's content.
   - **Selection Elaboration**: If the user selects a specific part of the blog text, **elaborate** on it in detail. Explain the concepts clearly, provide examples, and simplify complex terms.
   - **Blog-Related Topics**: Answer questions about blogging, writing, this platform, or the current blog content.
   - **Off-Topic Detection**: If asked about completely unrelated topics (like "What is the capital of France?", "Who won the cricket match?", etc.), you should STILL answer helpfully, but the system will add a note.

3. **Tone**: Be helpful, encouraging, and intelligent. Use formatting (bullet points, bold text) to make answers readable.

4. **Brevity**: Keep answers concise unless asked to elaborate or explain a specific section.
`;

// ============================================================
// NVIDIA NIM — Available Free/Trial Models
// Priority order: best quality first, lighter models as fallback
// ============================================================
const NVIDIA_MODELS = [
    // 1. Meta Llama 3.3 70B — Best overall, NVIDIA's flagship free model
    "meta/llama-3.3-70b-instruct",

    // 2. Meta Llama 3.1 70B — Excellent reasoning and multilingual
    "meta/llama-3.1-70b-instruct",

    // 3. Mistral NeMo 12B — Fast, lightweight, good for Q&A
    "mistralai/mistral-nemo-12b-instruct",

    // 4. Microsoft Phi-3 Medium — Great for instruction-following
    "microsoft/phi-3-medium-128k-instruct",

    // 5. Google Gemma 2 9B — Lightweight fallback
    "google/gemma-2-9b-it",

    // 6. Meta Llama 3.1 8B — Smallest/fastest fallback
    "meta/llama-3.1-8b-instruct",
];

// ============================================================
// Helper: Detect if user question is blog-related
// ============================================================
function isBlogRelated(userMessage, contextExists) {
    const msg = userMessage.toLowerCase();

    const blogKeywords = [
        "blog", "post", "article", "write", "writing", "author", "publish",
        "summarize", "summary", "explain", "meaning", "what does this mean",
        "elaborate", "tell me more", "what is this about", "blogam"
    ];

    if (blogKeywords.some((keyword) => msg.includes(keyword))) return true;

    if (contextExists && (msg.includes("this") || msg.includes("that") || msg.includes("here"))) {
        return true;
    }

    const offTopicPatterns = [
        "capital of", "who is", "what is the", "when did", "where is",
        "how to make", "recipe", "weather", "score", "match", "movie",
        "song", "game", "cricket", "football", "price of", "buy online"
    ];

    if (offTopicPatterns.some((pattern) => msg.includes(pattern))) return false;

    return contextExists;
}

// ============================================================
// Core: Generate Response via NVIDIA NIM API
// ============================================================
async function generateResponse(messages) {
    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
        console.error("[AI] NVIDIA_API_KEY is not set in .env file.");
        return "Configuration Error: NVIDIA API Key is missing. Please add NVIDIA_API_KEY to your .env file.";
    }

    // Normalize messages into an array
    const conversation = Array.isArray(messages)
        ? messages
        : [{ role: "user", content: messages }];

    // Prepend system prompt if not already present
    if (conversation.length === 0 || conversation[0]?.role !== "system") {
        conversation.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    // Detect blog-context and off-topic questions
    const userMessages = conversation.filter((m) => m.role === "user");
    const currentMessage = userMessages[userMessages.length - 1]?.content || "";
    const hasContext = conversation.some(
        (m) => m.content && m.content.includes("Context for the following questions")
    );
    const isCurrentQuestionBlogRelated = isBlogRelated(currentMessage, hasContext);

    const noteMessage =
        "\n\n---\n💡 *Note: While I'm here to help with all your questions, I'm specialized in assisting with this blog and the BlogYam platform!*";

    // ── Try each NVIDIA model in priority order ──────────────
    for (let i = 0; i < NVIDIA_MODELS.length; i++) {
        const model = NVIDIA_MODELS[i];
        try {
            console.log(`[AI] Attempt ${i + 1}/${NVIDIA_MODELS.length} → model: ${model}`);

            const response = await axios.post(
                NVIDIA_API_URL,
                {
                    model: model,
                    messages: conversation,
                    max_tokens: 1024,
                    temperature: 0.7,
                    top_p: 0.9,
                    stream: false,
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 30000, // 30 seconds
                }
            );

            const content = response.data?.choices?.[0]?.message?.content;
            if (content && content.trim()) {
                console.log(`[AI] ✅ Success with model: ${model}`);
                // Add off-topic note if applicable
                return isCurrentQuestionBlogRelated ? content : content + noteMessage;
            }

            console.warn(`[AI] Model ${model} returned empty content — trying next.`);
        } catch (error) {
            const status = error.response?.status ?? "NETWORK_ERROR";
            const errMsg = error.response?.data?.detail || error.message;
            console.warn(`[AI] ❌ Model ${model} failed [${status}]: ${errMsg}`);

            // For auth errors (401/403), stop immediately — no point trying other models
            if (status === 401 || status === 403) {
                console.error("[AI] 🔑 Auth error — check your NVIDIA_API_KEY in .env");
                return "AI Error: Invalid or expired NVIDIA API Key. Please update NVIDIA_API_KEY in your .env file.";
            }

            // For all other errors (429 rate-limit, 503 unavailable, timeouts) → try next model
            continue;
        }
    }

    console.error("[AI] All NVIDIA models exhausted — no response generated.");
    return "I apologize, but all AI models are currently busy or unavailable. Please try again in a few moments.";
}

// ============================================================
// Convenience helpers (used by apiController.js)
// ============================================================
async function summarizeBlog(content) {
    const messages = [
        {
            role: "user",
            content: `Summarize the following blog post in a concise and engaging manner, highlighting the key takeaways:\n\n${content}`,
        },
    ];
    return await generateResponse(messages);
}

async function explainText(text) {
    const messages = [
        {
            role: "user",
            content: `Explain the following text in simple terms for a general audience:\n\n"${text}"`,
        },
    ];
    return await generateResponse(messages);
}

async function suggestTitles(content) {
    const messages = [
        {
            role: "user",
            content: `Suggest 5 catchy and SEO-friendly titles for the following blog content:\n\n${content}`,
        },
    ];
    return await generateResponse(messages);
}

async function chatWithBlog(content, question) {
    const messages = [
        { role: "user", content: `Context: "${content}"\n\nQuestion: "${question}"` },
    ];
    return await generateResponse(messages);
}

module.exports = {
    summarizeBlog,
    explainText,
    suggestTitles,
    chatWithBlog,
    generateResponse,
};
