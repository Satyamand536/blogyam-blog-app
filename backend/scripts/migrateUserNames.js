const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam')
    .then(() => console.log('✓ Connected to MongoDB'))
    .catch(err => {
        console.error('✗ MongoDB connection error:', err);
        process.exit(1);
    });

// Import User model
const User = require('../models/user');

async function migrateUserNames() {
    try {
        console.log('\n🔍 Starting user name migration...\n');

        // Find all users without a name or with empty name
        const usersWithoutName = await User.find({
            $or: [
                { name: { $exists: false } },
                { name: null },
                { name: '' }
            ]
        });

        console.log(`Found ${usersWithoutName.length} users without names\n`);

        if (usersWithoutName.length === 0) {
            console.log('✓ All users already have names. No migration needed.\n');
            process.exit(0);
        }

        let successCount = 0;
        let failCount = 0;

        for (const user of usersWithoutName) {
            try {
                // Generate name from email
                const generatedName = user.email 
                    ? user.email.split('@')[0] 
                    : `User_${user._id.toString().substring(0, 8)}`;

                user.name = generatedName;
                await user.save();

                console.log(`✓ Updated user: ${user.email} → name: "${generatedName}"`);
                successCount++;
            } catch (error) {
                console.error(`✗ Failed to update user ${user.email}:`, error.message);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('Migration Summary:');
        console.log('='.repeat(50));
        console.log(`✓ Successfully updated: ${successCount} users`);
        console.log(`✗ Failed: ${failCount} users`);
        console.log('='.repeat(50) + '\n');

        // Verify migration
        const remainingUsersWithoutName = await User.find({
            $or: [
                { name: { $exists: false } },
                { name: null },
                { name: '' }
            ]
        });

        if (remainingUsersWithoutName.length === 0) {
            console.log('✓ Migration completed successfully! All users now have names.\n');
        } else {
            console.log(`⚠ Warning: ${remainingUsersWithoutName.length} users still without names.\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('\n✗ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateUserNames();
