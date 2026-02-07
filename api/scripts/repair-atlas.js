const mongoose = require('mongoose');
const { createHash, randomBytes } = require('crypto');
require('dotenv').config();

// User Schema (Simplified for script)
const User = require('../models/user');

async function repairUser(email, newPassword) {
    try {
        console.log('Using DB URL:', process.env.MONGO_URL ? 'Atlas/Remote' : 'Local Fallback');
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam');
        console.log('✓ Connected to MongoDB');

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.error('✗ User not found with email:', email);
            process.exit(1);
        }

        console.log(`Repairing user: ${user.email}`);

        // 1. Generate new HEX salt
        const salt = randomBytes(16).toString('hex');
        
        // 2. Hash password with new pattern: sha256(password + salt)
        const hashedPassword = createHash('sha256')
            .update(newPassword + salt)
            .digest('hex');

        // 3. Update using findByIdAndUpdate to BYPASS pre('save') hooks (Avoid Double Hash)
        await User.findByIdAndUpdate(user._id, {
            $set: {
                salt: salt,
                password: hashedPassword,
                role: ['satyamand536@gmail.com', 'maisatyam108@gmail.com', 'awadhinandansudha871252@gmail.com'].includes(email.toLowerCase()) ? 'owner' : user.role
            }
        });
        
        console.log('-----------------------------------');
        console.log('✓ SUCCESS: User repaired successfully on DATABASE!');
        console.log(`Email: ${user.email}`);
        console.log(`New Salt (Safe Hex): ${salt}`);
        console.log(`New Pattern: createHash('sha256').update(password + salt)`);
        console.log('-----------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Repair failed:', error);
        process.exit(1);
    }
}

// Get arguments from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.log('Usage: node scripts/repair-atlas.js <email> <password>');
    process.exit(1);
}

repairUser(email, password);
