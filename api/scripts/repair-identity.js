const mongoose = require('mongoose');
const { createHash, randomBytes } = require('crypto');
require('dotenv').config();

const User = require('../models/user');

async function repairIdentity() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam');
        console.log('✓ Connected to MongoDB');

        const targets = [
            { email: 'satyamand536@gmail.com', name: 'Satyam Tiwari', password: 'Satyam@1234' },
            { email: 'maisatyam108@gmail.com', name: 'Satyam Tiwari', password: 'Satyam@1234' },
            { email: 'awadhinandansudha871252@gmail.com', name: 'Owner', password: 'Satyam@1234' }
        ];

        for (const target of targets) {
            console.log(`Processing: ${target.email}...`);
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
            console.log(`✓ Repaired: ${target.email} | Name: ${target.name}`);
        }

        console.log('\n--- ALL UPDATES COMPLETED ---');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error during repair:', error);
        process.exit(1);
    }
}

repairIdentity();
