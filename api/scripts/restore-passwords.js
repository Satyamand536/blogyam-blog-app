const mongoose = require('mongoose');
const { createHash, randomBytes } = require('crypto');
require('dotenv').config();

const User = require('../models/user');

async function restoreUniquePasswords() {
    try {
        console.log('--- RESTORING UNIQUE ADMIN PASSWORDS ---');
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam');
        console.log('✓ Connected to MongoDB');

        const targets = [
            { email: 'satyamand536@gmail.com', password: 'Satyam@4567', name: 'Satyam Tiwari' },
            { email: 'maisatyam108@gmail.com', password: 'Sudha234@', name: 'Satyam Tiwari' }
        ];

        for (const target of targets) {
            console.log(`\nRestoring: ${target.email}...`);
            const user = await User.findOne({ email: target.email.toLowerCase() });
            
            if (!user) {
                console.log(`! User ${target.email} not found, skipping.`);
                continue;
            }

            const salt = randomBytes(16).toString('hex');
            const hashedPassword = createHash('sha256')
                .update(target.password + salt)
                .digest('hex');

            await User.findByIdAndUpdate(user._id, {
                $set: {
                    name: target.name,
                    salt: salt,
                    password: hashedPassword,
                    role: 'owner'
                }
            });
            console.log(`✓ Restored: ${target.email}`);
        }

        console.log('\n--- RESTORATION COMPLETED ---');
        process.exit(0);
    } catch (error) {
        console.error('✗ Restoration failed:', error);
        process.exit(1);
    }
}

restoreUniquePasswords();
