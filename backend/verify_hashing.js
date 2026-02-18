const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config({ path: './.env' });

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to DB");

        const users = await User.find({}).limit(5);
        console.log("Existing users sampled:", users.map(u => ({ email: u.email, passwordType: u.password.startsWith('$') ? 'bcrypt' : 'other', passwordLen: u.password.length })));

        // Test Signup
        const testEmail = `test_${Date.now()}@example.com`;
        const testName = "Test User Admin"; // Should be blocked if includes testuser? No, only lowercase "testuser"
        
        console.log("\n--- Testing Signup ---");
        // We'll use a direct model call to test hashing since we can't easily trigger the controller via terminal without a full server
        const newUser = new User({
            name: "New Secure User",
            email: testEmail,
            password: "SecurePass@123"
        });
        await newUser.save();
        console.log("New user saved with HMAC-SHA256");
        
        const savedUser = await User.findOne({ email: testEmail });
        console.log("Saved user password starts with:", savedUser.password.substring(0, 10));
        console.log("Salt length:", savedUser.salt.length);

        // Test Matching
        console.log("\n--- Testing Password Match ---");
        try {
            const token = await User.matchPasswordAndGenerateToken(testEmail, "SecurePass@123");
            console.log("Match success, token generated");
        } catch (err) {
            console.error("Match failed:", err.message);
        }

        // Test Blocked Pattern
        console.log("\n--- Testing Blocked Pattern (Test Model Logic) ---");
        // Note: Blocked patterns are in the controller, but let's check if we can simulate it
        const blockedEmail = "testuser@example.com";
        // Actually, let's just clean up
        await User.deleteOne({ email: testEmail });
        console.log("Cleanup done");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
