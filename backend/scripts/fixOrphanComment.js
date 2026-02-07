const mongoose = require('mongoose');
const Comment = require('../models/comments');
require('dotenv').config();

async function fixOrphanComment() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam');
        console.log('✓ Connected to MongoDB');

        const userId = '69832de5b4ffe73e7e485726'; // Aryan
        const blogId = '69624e60f0d4577a88fe3a28'; // Future of AI

        // Find comments by Aryan with no blogId
        const comments = await Comment.find({ 
            author: userId,
            $or: [{ blogId: null }, { blogId: { $exists: false } }]
        });
        
        console.log(`Found ${comments.length} orphan comments.`);

        if (comments.length > 0) {
            for (const comment of comments) {
                console.log(`Fixing comment: "${comment.content}"`);
                comment.blogId = blogId; // Assign to correct blog
                await comment.save();
                console.log('✓ Comment fixed and assigned to "Future of AI"');
            }
        } else {
            // It might be possible that blogId was saved as undefined but Mongo stored it? 
            // Or maybe I should list comments and see.
            // Let's check most recent comment by Aryan regardless
            const recent = await Comment.findOne({ author: userId }).sort({ createdAt: -1 });
            if (recent) {
                 console.log('Recent comment check:', recent.content);
                 console.log('Current BlogID:', recent.blogId);
                 
                 // If invalid blogId (not matching Future of AI), fix it
                 if (!recent.blogId || recent.blogId.toString() !== blogId) {
                     console.log('Detected mismatch or missing ID. Fixing...');
                     recent.blogId = blogId;
                     await recent.save();
                     console.log('✓ Comment linked to "Future of AI"');
                 }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}

fixOrphanComment();
