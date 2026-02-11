const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

async function ensureOwnerAccounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const ownerEmails = [
            { email: 'satyamand536@gmail.com', name: 'Satyam' },
            { email: 'maisatyam108@gmail.com', name: 'Satyam Alt' },
            { email: 'awadhinandansudha871252@gmail.com', name: 'Awadhina' }
        ];

        for (const owner of ownerEmails) {
            const existingUser = await User.findOne({ email: owner.email });
            
            if (existingUser) {
                // Update role to owner if not already
                if (existingUser.role !== 'owner') {
                    existingUser.role = 'owner';
                    await existingUser.save();
                    console.log(`✅ Updated ${owner.email} to owner role`);
                } else {
                    console.log(`✓ ${owner.email} already exists as owner`);
                }
            } else {
                // Create new owner account
                const newOwner = await User.create({
                    name: owner.name,
                    email: owner.email,
                    password: 'Admin@123',
                    role: 'owner'
                });
                console.log(`✅ Created owner account: ${owner.email}`);
            }
        }

        console.log('\n🎉 All owner accounts are ready!');
        console.log('\n📧 Owner Accounts:');
        console.log('1. satyamand536@gmail.com');
        console.log('2. maisatyam108@gmail.com');
        console.log('3. awadhinandansudha871252@gmail.com');
        console.log('\n🔑 Password: Admin@123');
        console.log('\n⚠️ Emergency Override: You can also use passwords "satyam@123" or "admin@123"');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

ensureOwnerAccounts();
