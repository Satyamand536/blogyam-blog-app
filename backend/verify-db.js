require('dotenv').config();
const mongoose = require('mongoose');

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const db = mongoose.connection.db;

        console.log('--- User Verification ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => {
            console.log(`User ID: ${u._id}, Name: ${u.name}, FullName: ${u.fullName}`);
        });

        console.log('\n--- Comment Verification ---');
        const comments = await db.collection('comments').find({}).toArray();
        comments.forEach(c => {
            console.log(`Comment ID: ${c._id}, Author: ${c.author}, CreatedBy: ${c.createdBy}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
