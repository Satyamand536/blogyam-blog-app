const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

async function setupAllAccounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB\n');

        const accounts = [
            // OWNER ACCOUNTS (3)
            { name: 'Satyam Tiwari', email: 'satyamand536@gmail.com', password: 'Satyam@4567', role: 'owner' },
            { name: 'Sudha', email: 'maisatyam108@gmail.com', password: 'Sudha234@', role: 'owner' },
            { name: 'Sitaram Awadhi', email: 'awadhinandansudha871252@gmail.com', password: 'Ramayatan@4580', role: 'owner' },
            
            // AUTHOR ACCOUNTS (3)
            { name: 'Sitaram', email: 'sitaram454@gmail.com', password: 'Sitaram@1268', role: 'author' },
            { name: 'Jagdamba Prasad', email: 'jagdamba325@gmail.com', password: 'Jaggy@1234', role: 'author' },
            { name: 'Rajaram Prasad', email: 'rajaramprasad634@gmail.com', password: 'Prasad@5623', role: 'author' },
            
            // REGULAR USER ACCOUNTS (2)
            { name: 'Shree Ram', email: 'shreeram123856@gmail.com', password: 'Shnsd@3451', role: 'user' },
            { name: 'Jawahar Prasad', email: 'jawahar5253@gmail.com', password: 'Jawauiot@9876', role: 'user' }
        ];

        for (const account of accounts) {
            const existingUser = await User.findOne({ email: account.email });
            
            if (existingUser) {
                // Update role and password
                existingUser.role = account.role;
                existingUser.password = account.password;
                existingUser.name = account.name;
                await existingUser.save();
                console.log(`✅ Updated: ${account.email} (${account.role})`);
            } else {
                // Create new account
                await User.create({
                    name: account.name,
                    email: account.email,
                    password: account.password,
                    role: account.role
                });
                console.log(`✅ Created: ${account.email} (${account.role})`);
            }
        }

        console.log('\n🎉 All accounts setup complete!\n');
        console.log('📊 SUMMARY:');
        console.log('- 3 Owner accounts');
        console.log('- 3 Author accounts'); 
        console.log('- 2 Regular user accounts');
        console.log('\n✅ You can now login with any of these emails and their passwords!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupAllAccounts();
