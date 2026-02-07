const mongoose = require('mongoose');
const { createHmac, randomBytes } = require('crypto');
require('dotenv').config();

// User Schema (Simplified for script)
const User = require('../models/user');

async function repairUser(email, newPassword) {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blogyam');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.error('User not found!');
            process.exit(1);
        }

        console.log(`Repairing user: ${user.email}`);

        // Generate new HEX salt
        const salt = randomBytes(16).toString('hex');
        
        // Hash password with new salt
        const hashedPassword = createHmac('sha256', salt)
            .update(newPassword)
            .digest('hex');

        user.salt = salt;
        user.password = hashedPassword;
        user.role = 'owner'; // Ensure they are owner
        
        await user.save();
        
        console.log('-----------------------------------');
        console.log('SUCCESS: User repaired successfully!');
        console.log(`Email: ${user.email}`);
        console.log(`New Salt (Hex): ${salt}`);
        console.log('Your role has been set to OWNER.');
        console.log('-----------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
}

// Get arguments from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.log('Usage: node repair-user.js <email> <password>');
    process.exit(1);
}

repairUser(email, password);
