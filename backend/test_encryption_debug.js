
try {
    console.log("Attempting to require encryption service...");
    const encryption = require('./services/encryption');
    console.log("Encryption service loaded successfully.");
    console.log("Public Key length:", encryption.publicKey ? encryption.publicKey.length : "UNDEFINED");
    console.log("Private Key length:", encryption.privateKey ? encryption.privateKey.length : "UNDEFINED");
    
    // Test encryption/decryption
    const testPayload = "hello world";
    console.log("Testing Cookie Encryption...");
    const encrypted = encryption.encryptCookie(testPayload);
    console.log("Encrypted Cookie:", encrypted);
    const decrypted = encryption.decryptCookie(encrypted);
    console.log("Decrypted Cookie:", decrypted);
    
    if (testPayload === decrypted) {
        console.log("Cookie Encryption/Decryption Test: PASSED");
    } else {
        console.log("Cookie Encryption/Decryption Test: FAILED");
    }

} catch (error) {
    console.error("CRITICAL ERROR loading encryption service:");
    console.error(error);
}
