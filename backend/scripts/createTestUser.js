const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

async function createTestUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Create a test user
        const testUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Test@123'
        });

        console.log('✅ Test user created successfully!');
        console.log('Email: test@example.com');
        console.log('Password: Test@123');
        console.log('');
        console.log('You can now login with these credentials');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createTestUser();
