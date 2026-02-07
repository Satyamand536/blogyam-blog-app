require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/blogyam';

async function fixAuthorRole() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'sitaram454@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User ${email} not found.`);
        } else {
            console.log(`Found user: ${user.name} (${user.email}), Role: ${user.role}`);
            
            if (user.role !== 'author') {
                user.role = 'author';
                await user.save();
                console.log(`✓ successfully updated role to 'author' for ${email}`);
            } else {
                console.log(`User is already an author.`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

fixAuthorRole();
