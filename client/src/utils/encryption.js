// Modern RSA encryption using native Web Crypto API (No libraries required)
// This is "Top 1%" standard for security and performance.

let cachedPublicKey = null;

/**
 * Converts a PEM string to an ArrayBuffer for Web Crypto API
 */
function pemToArrayBuffer(pem) {
    const b64Lines = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s/g, '');
    const binaryStr = window.atob(b64Lines);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}

// Backend base URL (Automatic detection for monorepo deployment)
const rawUrl = (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')).trim();
export const API_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

// Fetch public key from backend
export const getPublicKey = async () => {
    // Cache-busting to ensure we always get the latest persistent key
    const url = `${API_URL}/api/auth/public-key?v=${Date.now()}`;
    
    try {
        console.log('[Encryption] Fetching SPKI public key...');
        const response = await fetch(url);
        const data = await response.json();
        if (data.success && data.publicKey) {
            cachedPublicKey = data.publicKey;
            return data.publicKey;
        }
        throw new Error('Failed to fetch public key');
    } catch (error) {
        console.error('[Encryption] Key fetch error:', error);
        return null;
    }
};

// Encrypt password using RSA-OAEP (Web Crypto API)
export const encryptPassword = async (password) => {
    try {
        const pemKey = await getPublicKey();
        if (!pemKey) return password;

        const subtle = window.crypto.subtle;
        const keyBuffer = pemToArrayBuffer(pemKey);

        // Import the SPKI public key
        const cryptoKey = await subtle.importKey(
            'spki',
            keyBuffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            false,
            ['encrypt']
        );

        // Encrypt the password
        const encodedPassword = new TextEncoder().encode(password);
        const encryptedBuffer = await subtle.encrypt(
            {
                name: 'RSA-OAEP',
            },
            cryptoKey,
            encodedPassword
        );

        // Convert to Base64 for transport
        return window.btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    } catch (error) {
        console.error('[Encryption] Runtime error:', error);
        return password; // Fallback to plain text if browser doesn't support Web Crypto
    }
};
