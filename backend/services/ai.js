const axios = require("axios");

// OpenRouter Configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

// Helper function to detect if question is blog-related
function isBlogRelated(userMessage, contextExists) {
    const msg = userMessage.toLowerCase();
    
    // If there's blog context, these are clearly blog-related
    const blogKeywords = [
        'blog', 'post', 'article', 'write', 'writing', 'author', 'publish',
        'summarize', 'summary', 'explain', 'meaning', 'what does this mean',
        'elaborate', 'tell me more', 'what is this about', 'blogam'
    ];
    
    // Check if question contains blog-related keywords
    if (blogKeywords.some(keyword => msg.includes(keyword))) {
        return true;
    }
    
    // If message is asking about "this" or "that" and we have blog context, it's blog-related
    if (contextExists && (msg.includes('this') || msg.includes('that') || msg.includes('here'))) {
        return true;
    }
    
    // Generic knowledge questions (clearly off-topic)
    const offTopicPatterns = [
        'capital of', 'who is', 'what is the', 'when did', 'where is',
        'how to make', 'recipe', 'weather', 'score', 'match', 'movie',
        'song', 'game', 'cricket', 'football', 'price of', 'buy online'
    ];
    
    if (offTopicPatterns.some(pattern => msg.includes(pattern))) {
        return false; // Clearly off-topic
    }
    
    // Default: assume blog-related if we're on a blog page
    return contextExists;
}

async function generateResponse(messages) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.warn("OPENROUTER_API_KEY is not set.");
        return "Configuration Error: API Key is missing. Please add OPENROUTER_API_KEY to your .env file.";
    }

    // List of RELIABLE Free Models (8 models for extreme coverage)
    const MODELS = [
        // 1. Google Gemini Pro (Most Reliable)
        "google/gemini-2.0-pro-exp-02-05:free",
        
        // 2. DeepSeek Chat V3 (High Capacity)
        "deepseek/deepseek-chat:free",
        
        // 3. Anthropic Claude (Excellent for reasoning)
        "anthropic/claude-3.5-haiku:free",

        // 4. Mistral Small (Fast and Reliable)
        "mistralai/mistral-small-24b-instruct-2501:free",
        
        // 5. Qwen 2.5 72B (Large Capacity)
        "qwen/qwen-2.5-72b-instruct:free",
        
        // 6. Meta Llama (Backup)
        "meta-llama/llama-3.3-70b-instruct:free",

        // 7. Cohere Command (Good for multi-language)
        "cohere/command-r:free",

        // 8. OpenRouter Auto (Final Fallback)
        "openrouter/auto"
    ];

    // Ensure messages is an array
    const conversation = Array.isArray(messages) ? messages : [{ role: "user", content: messages }];

    if (conversation.length === 0 || (conversation[0] && conversation[0].role !== "system")) {
        conversation.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    // Detect if current question is blog-related
    const userMessages = conversation.filter(m => m.role === 'user');
    const currentMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // Check if there's blog context (indicated by a context message at start)
    const hasContext = conversation.some(m => m.content && m.content.includes('Context for the following questions'));
    
    const isCurrentQuestionBlogRelated = isBlogRelated(currentMessage, hasContext);
    
    // Count previous off-topic questions in conversation
    let offTopicCount = 0;
    for (let i = 0; i < userMessages.length - 1; i++) {
        if (!isBlogRelated(userMessages[i].content, hasContext)) {
            offTopicCount++;
        }
    }
    
    // Simplified logic: Always answer, but add note if off-topic
    const noteMessage = "\n\n---\n💡 *Note: While I'm here to help with all your questions, I'm specialized in assisting with this blog and the BlogYam platform!*";

    let lastError = null;
    
    for (let i = 0; i < MODELS.length; i++) {
        const model = MODELS[i];
        try {
            console.log(`[AI] Attempt ${i + 1} with ${model}`);
            const response = await axios.post(
                OPENROUTER_API_URL,
                {
                    model: model,
                    messages: conversation,
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:8000",
                        "X-Title": "BlogYam Intelligence"
                    },
                    timeout: 20000 
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                 const content = response.data.choices[0].message.content;
                 if (content) {
                     // If current question is off-topic, add the note
                     if (!isCurrentQuestionBlogRelated) {
                         return content + noteMessage;
                     }
                     return content;
                 }
            }
        } catch (error) {
            // Detailed error logging for debugging
            const status = error.response ? error.response.status : "NETWORK_ERROR";
            console.warn(`[AI] Model ${model} failed (${status}):`, error.message);
            
            // Explicitly handle known error codes
            if ([404, 408, 402, 400, 429, 503].includes(status) || error.code === 'ECONNABORTED') {
                continue; // Try next model immediately
            }
            
            // Continue to next model for any other error
            continue;
        }
    }

    // Simple failure message as requested
    console.error("[AI] All models failed.");
    return "I apologize, but all AI models are currently busy or unavailable. Please try again in a few moments.";
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
