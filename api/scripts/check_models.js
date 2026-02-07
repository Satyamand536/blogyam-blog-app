require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
    console.log("Checking available models...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No GEMINI_API_KEY found in environment.");
        return;
    }
    // console.log("Using Key: " + key.substring(0, 5) + "...");

    try {
        const genAI = new GoogleGenerativeAI(key);
        // Note: listModels is not directly on genAI instance in all SDK versions, 
        // usually it's via a model manager or we can just try a simple generation to test connectivity.
        // Actually, the SDK exposes it via the GoogleGenerativeAI class usually? 
        // No, it's not exposed in the high-level generic helper often.
        // Let's rely on a direct test of the most basic 'gemini-pro'.
        
        // However, the error message literally said: "Call ListModels to see the list..."
        // The Node SDK might not expose listModels easily in the helper.
        // Let's try to infer from a simple request failure or manual HTTP call if needed.
        
        // Wait, the correct way in v0.24.x?
        // Let's just try to hit the most legacy model 'gemini-pro' with a simple prompt.
        
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
        
        for (const m of models) {
             console.log(`Testing model: ${m}`);
             try {
                 const model = genAI.getGenerativeModel({ model: m });
                 const result = await model.generateContent("Hello?");
                 const response = await result.response;
                 console.log(`SUCCESS with ${m}:`, response.text());
                 return; // Exit on first success
             } catch (e) {
                 console.error(`FAILED ${m}: ${e.message}`);
             }
        }
    } catch (error) {
        console.error("Global Error:", error);
    }
}

checkModels();
