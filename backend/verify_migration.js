const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: './.env' });

async function verifyMigration() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to DB");

        const testEmail = `legacy_${Date.now()}@example.com`;
        const testPassword = "LegacyPass@123";
        
        // 1. Manually create a Bcrypt user using the old pattern (password + salt)
        console.log("\n--- Creating Legacy Bcrypt User ---");
        const customSalt = "legacy-salt-123";
        const bcryptSalt = await bcrypt.genSalt(10);
        const legacyHash = await bcrypt.hash(testPassword + customSalt, bcryptSalt);
        
        // Bypass pre-save for legacy setup
        const legacyUser = new User({
            name: "Legacy User",
            email: testEmail,
            password: legacyHash,
            salt: customSalt
        });
        await User.collection.insertOne(legacyUser);
        console.log("Legacy user inserted directly into collection");

        // 2. Attempt login (Migration should trigger)
        console.log("\n--- Attempting Login for Legacy User ---");
        const token = await User.matchPasswordAndGenerateToken(testEmail, testPassword);
        console.log("Login success, token generated");

        // 3. Verify migration in DB
        const updatedUser = await User.findOne({ email: testEmail });
        const userProvidedHash = crypto.createHmac("sha256", updatedUser.salt)
            .update(testPassword)
            .digest("hex");

        if (updatedUser.password === userProvidedHash) {
            console.log("SUCCESS: User migrated to HMAC-SHA256 format!");
        } else {
            console.log("FAIL: User NOT migrated.");
            console.log("Stored Password starts with:", updatedUser.password.substring(0, 10));
        }

        // Cleanup
        await User.deleteOne({ email: testEmail });
        console.log("Cleanup done");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyMigration();
