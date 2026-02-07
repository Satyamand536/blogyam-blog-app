require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB for robust migration...');

        const db = mongoose.connection.db;

        // 1. Users migration
        const userBatch = await db.collection('users').find({ fullName: { $exists: true } }).toArray();
        console.log(`Found ${userBatch.length} users with fullName...`);
        for (const doc of userBatch) {
            await db.collection('users').updateOne(
                { _id: doc._id },
                { 
                    $set: { name: doc.fullName },
                    $unset: { fullName: "" }
                }
            );
        }

        // 2. Blogs migration
        const blogBatch = await db.collection('blogs').find({ createdBy: { $exists: true } }).toArray();
        console.log(`Found ${blogBatch.length} blogs with createdBy...`);
        for (const doc of blogBatch) {
            await db.collection('blogs').updateOne(
                { _id: doc._id },
                { 
                    $set: { author: doc.createdBy },
                    $unset: { createdBy: "" }
                }
            );
        }

        // 3. Comments migration
        const commentBatch = await db.collection('comments').find({ createdBy: { $exists: true } }).toArray();
        console.log(`Found ${commentBatch.length} comments with createdBy...`);
        for (const doc of commentBatch) {
            await db.collection('comments').updateOne(
                { _id: doc._id },
                { 
                    $set: { author: doc.createdBy },
                    $unset: { createdBy: "" }
                }
            );
        }

        console.log('Robust Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Robust Migration failed:', error);
        process.exit(1);
    }
}

migrate();
