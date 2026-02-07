const mongoose = require('mongoose');
const { createHash, randomBytes } = require('crypto');
require('dotenv').config();

const User = require('../models/user');

async function fixMaisatyam() {
    try {
        console.log('--- FIXING MAISATYAM108 IDENTITY ---');
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam');
        console.log('✓ Connected to MongoDB');

        const email = 'maisatyam108@gmail.com';
        const password = 'Satyam@1234';
        const name = 'Satyam Tiwari';

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('✗ User not found!');
            process.exit(1);
        }

        const salt = randomBytes(16).toString('hex');
        const hashedPassword = createHash('sha256')
            .update(password + salt)
            .digest('hex');

        console.log(`New Salt: ${salt}`);
        console.log(`New Hash: ${hashedPassword}`);

        await User.findByIdAndUpdate(user._id, {
            $set: {
                name: name,
                salt: salt,
                password: hashedPassword,
                role: 'owner'
            }
        });

        console.log('✓ Repair confirmed for maisatyam108@gmail.com');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

fixMaisatyam();
