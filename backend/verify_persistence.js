
const encryption = require('./services/encryption');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, 'keys');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

console.log("Checking for persistent keys...");

if (fs.existsSync(PUBLIC_KEY_PATH)) {
    console.log("✅ Public Key File Exists at:", PUBLIC_KEY_PATH);
    const fileContent = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    const keyContent = encryption.publicKey;
    
    // Normalize newlines for comparison
    if (fileContent.replace(/\r\n/g, '\n').trim() === keyContent.replace(/\r\n/g, '\n').trim()) {
        console.log("✅ Loaded Encryption Service key MATCHES file content. Persistence Working.");
    } else {
        console.log("❌ Loaded Encryption Service key DOES NOT MATCH file content.");
        console.log("File len:", fileContent.length);
        console.log("Service len:", keyContent.length);
    }
} else {
    console.log("❌ Public Key File NOT FOUND.");
}
