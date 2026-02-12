const NodeRSA = require('node-rsa');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Simulate backend encryption service
const KEYS_DIR = path.join(__dirname, 'backend/keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

async function debugRSA() {
    console.log("--- RSA DEBUG START ---");
    
    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
        console.error("Private key not found!");
        return;
    }

    const privateKeyData = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const publicKeyData = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

    // 1. Test NodeRSA instance creation with PKCS1
    const serverKey = new NodeRSA(privateKeyData);
    serverKey.setOptions({ encryptionScheme: 'pkcs1' });

    const clientKey = new NodeRSA(publicKeyData);
    clientKey.setOptions({ encryptionScheme: 'pkcs1' });

    const testPassword = "Abc@123456";
    console.log(`Testing password: ${testPassword}`);

    try {
        // Simulate JSEncrypt (standard PKCS1 v1.5)
        const encrypted = clientKey.encrypt(testPassword, 'base64');
        console.log(`Encrypted (Base64): ${encrypted.substring(0, 50)}...`);

        // Decrypt on "Server"
        const decrypted = serverKey.decrypt(encrypted, 'utf8');
        console.log(`Decrypted: ${decrypted}`);

        if (decrypted === testPassword) {
            console.log("✅ RSA Handshake SUCCESS (PKCS1)");
        } else {
            console.error("❌ RSA Handshake FAILED (Mismatch)");
        }
    } catch (err) {
        console.error("❌ RSA Handshake ERROR:", err.message);
    }

    console.log("\n--- LEGACY HASH DEBUG ---");
    const testSalt = "a1b2c3d4e5f6g7h8";
    const storedHash = "7bc36... (simulated)"; // We'll test the logic
    
    // Test logic A: password + salt
    const hashA = crypto.createHash('sha256').update(testPassword + testSalt).digest('hex');
    // Test logic B: salt + password
    const hashB = crypto.createHash('sha256').update(testSalt + testPassword).digest('hex');
    // Test logic C: HMAC
    const hashC = crypto.createHmac('sha256', testSalt).update(testPassword).digest('hex');

    console.log(`Hash (pass+salt): ${hashA}`);
    console.log(`Hash (salt+pass): ${hashB}`);
    console.log(`Hash (HMAC):      ${hashC}`);
}

debugRSA();
