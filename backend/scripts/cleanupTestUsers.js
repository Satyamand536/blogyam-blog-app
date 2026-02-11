const User = require('../models/user');

async function cleanupTestUsers() {
    try {
        console.log('Starting cleanup of test users...');
        
        // Find all users with names starting with "test" (case-insensitive)
        const testUsers = await User.find({
            name: { $regex: /^test/i }
        });

        console.log(`Found ${testUsers.length} test users to delete:`, testUsers.map(u => u.email));

        if (testUsers.length === 0) {
            console.log('No test users found. Exiting.');
            return;
        }

        // Confirm deletion
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question(`Delete ${testUsers.length} users? (yes/no): `, async (answer) => {
            if (answer.toLowerCase() === 'yes') {
                const result = await User.deleteMany({
                    name: { $regex: /^test/i }
                });
                console.log(`✅ Deleted ${result.deletedCount} test users successfully.`);
            } else {
                console.log('Cleanup cancelled.');
            }
            readline.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

// Connect to MongoDB and run cleanup
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        cleanupTestUsers();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
