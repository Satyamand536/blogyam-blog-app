const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Simulate backend encryption service
const KEYS_DIR = path.join(__dirname, 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

async function debugRSA_OAEP_SHA256() {
    console.log("--- RSA-OAEP SHA-256 DEBUG START ---");
    
    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
        console.error("Private key not found at:", PRIVATE_KEY_PATH);
        return;
    }

    const privateKeyPEM = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const publicKeyPEM = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

    const testPassword = "Abc@123456";
    console.log(`Testing password: ${testPassword}`);

    try {
        // 1. SIMULATE FRONTEND (Web Crypto API uses SHA-256 by default in our config)
        // We use Node's publicEncrypt to simulate the same parameters
        console.log("Simulating Frontend Encryption (OAEP/SHA-256)...");
        const encryptedBuffer = crypto.publicEncrypt(
            {
                key: publicKeyPEM,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(testPassword)
        );
        const encryptedBase64 = encryptedBuffer.toString('base64');
        console.log(`Encrypted (Base64): ${encryptedBase64.substring(0, 50)}...`);

        // 2. SIMULATE BACKEND DECRYPTION
        console.log("Simulating Backend Decryption (OAEP/SHA-256)...");
        const decryptedBuffer = crypto.privateDecrypt(
            {
                key: privateKeyPEM,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(encryptedBase64, 'base64')
        );
        const decrypted = decryptedBuffer.toString('utf8');
        console.log(`Decrypted: ${decrypted}`);

        if (decrypted === testPassword) {
            console.log("✅ RSA-OAEP SHA-256 Handshake SUCCESS!");
        } else {
            console.error("❌ RSA-OAEP SHA-256 Handshake FAILED (Mismatch)");
        }
    } catch (err) {
        console.error("❌ RSA-OAEP SHA-256 Handshake ERROR:", err.message);
        if (err.stack) console.error(err.stack);
    }
}

debugRSA_OAEP_SHA256();
