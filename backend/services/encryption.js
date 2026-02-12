const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, '../keys');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');

// Ensure keys directory exists
if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR);
}

// Global private key variable to avoids re-reading disk on every request
let privateKeyPEM = null;
let publicKeyPEM = null;

function initializeKeys() {
    if (fs.existsSync(PRIVATE_KEY_PATH)) {
        try {
            privateKeyPEM = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
            publicKeyPEM = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
            console.log("✅ Loaded persistent RSA keys from disk (Ready for SHA-256 OAEP).");
        } catch (err) {
            console.error("Error loading keys, generating new ones:", err);
            generateNewKeys();
        }
    } else {
        generateNewKeys();
    }
}

function generateNewKeys() {
    console.log("⚠️ Generating new RSA-2048 key pair (Modern SPKI/PKCS8 format)...");
    const { generateKeyPairSync } = require('crypto');
    
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    privateKeyPEM = privateKey;
    publicKeyPEM = publicKey;

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
    console.log("✅ New RSA keys saved to disk.");
}

initializeKeys();

module.exports = {
    publicKey: publicKeyPEM,
    privateKey: privateKeyPEM,
    
    // Decrypt password using modern OAEP SHA-256 (Native Node Crypto)
    // Matches Web Crypto API: RSA-OAEP / SHA-256
    decryptPassword: (encryptedPassword) => {
        try {
            const buffer = Buffer.from(encryptedPassword, 'base64');
            const decrypted = crypto.privateDecrypt(
                {
                    key: privateKeyPEM,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                },
                buffer
            );
            return decrypted.toString('utf8');
        } catch (error) {
            console.error("RSA Decryption Failed:", error.message);
            // Log if it's a padding error vs other errors
            if (error.message.includes('oaep decoding error')) {
                console.error("Detailed: OAEP Hash mismatch or corrupted payload.");
            }
            throw new Error('Failed to decrypt password');
        }
    },

    // AES Encryption for Cookies (Server-Side Only)
    encryptCookie: (token) => {
        try {
            const crypto = require('crypto');
            // Use JWT_SECRET to derive a 32-byte key
            const secret = process.env.JWT_SECRET || 'fallback_secret_key_which_should_be_long_enough';
            const key = crypto.createHash('sha256').update(String(secret)).digest(); 
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            let encrypted = cipher.update(token, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Return IV:EncryptedString
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('Cookie encryption failed:', error);
            return token; // Fallback to plain token if encryption fails
        }
    },

    decryptCookie: (encryptedToken) => {
        try {
            const parts = encryptedToken.split(':');
            if (parts.length !== 2) return encryptedToken; // Not encrypted or invalid format
            
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            
            const crypto = require('crypto');
            const secret = process.env.JWT_SECRET || 'fallback_secret_key_which_should_be_long_enough';
            const key = crypto.createHash('sha256').update(String(secret)).digest();
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            // If decryption fails, it might be a plain token (backward compatibility)
            return encryptedToken;
        }
    }
};
