require('dotenv').config();
const mongoose = require('mongoose');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const db = mongoose.connection.db;

        console.log('=== User Inspection ===');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => {
            console.log(`ID: ${u._id}`);
            console.log(`  name: "${u.name}"`);
            console.log(`  fullName: "${u.fullName}"`);
            console.log(`  email: "${u.email}"`);
            console.log('---');
        });

        console.log('\n=== Comment Inspection ===');
        const comments = await db.collection('comments').find({}).toArray();
        comments.forEach(c => {
            console.log(`Comment ID: ${c._id}`);
            console.log(`  author: ${c.author}`);
            console.log(`  createdBy: ${c.createdBy}`);
            console.log(`  content: "${c.content.substring(0, 20)}..."`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
}

inspect();
