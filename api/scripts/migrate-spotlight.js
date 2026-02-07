const mongoose = require('mongoose');
require('dotenv').config();
const Blog = require('../models/blog');

async function migrateFeatured() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam');
        console.log('Connected to DB');

        const result = await Blog.updateMany(
            { isFeatured: true },
            { 
                $set: { spotlight: 'featured', spotlightAt: new Date() },
                $unset: { isFeatured: "" }
            }
        );

        console.log(`Migration complete. Updated ${result.modifiedCount} blogs.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateFeatured();
