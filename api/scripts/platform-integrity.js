const mongoose = require('mongoose');
const { createHash, randomBytes } = require('crypto');
require('dotenv').config();

const User = require('../models/user');

async function platformAudit() {
    try {
        console.log('--- STARTING PLATFORM INTEGRITY AUDIT ---');
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam');
        console.log('✓ Connected to MongoDB');

        // 1. SPECIFIC ACCOUNT FIX: sitaram454@gmail.com
        const specificFixes = [
            { email: 'sitaram454@gmail.com', password: 'Sitaram@1268', name: 'Sitaram' },
            { email: 'satyamand536@gmail.com', password: 'Satyam@4567', name: 'Satyam Tiwari' },
            { email: 'maisatyam108@gmail.com', password: 'Sudha234@', name: 'Satyam Tiwari' }
        ];

        for (const target of specificFixes) {
            const user = await User.findOne({ email: target.email.toLowerCase() });
            if (user) {
                console.log(`Fixing targeted account: ${target.email}`);
                const salt = randomBytes(16).toString('hex');
                const hashedPassword = createHash('sha256')
                    .update(target.password + salt)
                    .digest('hex');
                
                await User.findByIdAndUpdate(user._id, {
                    $set: {
                        name: target.name,
                        salt: salt,
                        password: hashedPassword,
                        role: ['satyamand536@gmail.com', 'maisatyam108@gmail.com'].includes(target.email) ? 'owner' : user.role
                    }
                });
                console.log(`  ✓ Repaired: ${target.email} with SHA256 + HEX salt`);
            }
        }

        // 2. GENERAL AUDIT: Detect binary/corrupt salts
        const allUsers = await User.find({});
        console.log(`\nAuditing ${allUsers.length} total users...`);

        let corruptCount = 0;
        for (const user of allUsers) {
            const isHex = /^[0-9a-fA-F]{32}$/.test(user.salt);
            if (!isHex) {
                console.log(`! Corruption detected in user: ${user.email} (Salt length: ${user.salt?.length || 0})`);
                corruptCount++;
                // We can't fix passwords without knowing them, 
                // but we can standardize the salt to Hex to prevent binary crashes.
                // However, the password will still be wrong until changed.
            }
        }

        console.log(`\nAudit Summary: ${corruptCount} potentially corrupted accounts found.`);
        console.log('--- PLATFORM INTEGRITY AUDIT COMPLETED ---');
        process.exit(0);
    } catch (error) {
        console.error('✗ AUDIT FAILED:', error);
        process.exit(1);
    }
}

platformAudit();
