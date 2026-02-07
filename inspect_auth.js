const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/models/user');
const Blacklist = require('./backend/models/blacklist');

async function debug() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected.");

        const email = 'satyamand536@gmail.com';
        const user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log("\n--- User Record Found ---");
            console.log("Email:", user.email);
            console.log("Role:", user.role);
            console.log("isBanned:", user.isBanned);
            console.log("Salt Length:", user.salt ? user.salt.length : 'MISSING');
            console.log("Password Hash Length:", user.password ? user.password.length : 'MISSING');
            console.log("Last IP:", user.lastIP);
        } else {
            console.log("\nUser not found:", email);
        }

        const blacklisted = await Blacklist.find({});
        console.log("\n--- Blacklisted Entries ---");
        console.log(JSON.stringify(blacklisted, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Debug failed:", err);
        process.exit(1);
    }
}

debug();
