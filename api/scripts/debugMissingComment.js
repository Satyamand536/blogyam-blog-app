const mongoose = require('mongoose');
const User = require('../models/user');
const Comment = require('../models/comments');
const Blog = require('../models/blog');
require('dotenv').config();

async function debugComments() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam');
        console.log('✓ Connected to MongoDB');

        // 1. Find User "Aryan Saini" (or similar)
        console.log('\n--- Searching for User "Aryan Saini" ---');
        const users = await User.find({ name: { $regex: /aryan/i } });
        
        if (users.length === 0) {
            console.log('❌ No user found with name matching "Aryan"');
            // List all users to see who is there
            const allUsers = await User.find({}, 'name email');
            console.log('All users:', allUsers.map(u => `${u.name} (${u.email})`).join(', '));
        } else {
            console.log(`Found ${users.length} user(s):`);
            users.forEach(u => console.log(`- ${u.name} (ID: ${u._id})`));
        }

        // 2. Find "Future of AI" Blog
        console.log('\n--- Searching for Blog "Future of Ai" ---');
        const blogs = await Blog.find({ title: { $regex: /Future of Ai/i } });
        
        if (blogs.length === 0) {
            console.log('❌ No blog found with title matching "Future of Ai"');
             const allBlogs = await Blog.find({}, 'title');
             console.log('All blogs:', allBlogs.map(b => `"${b.title}"`).join(', '));
        } else {
            console.log(`Found ${blogs.length} blog(s):`);
            blogs.forEach(b => console.log(`- "${b.title}" (ID: ${b._id})`));
        }

        // 3. Find Comments for these users/blogs
        if (users.length > 0) {
            const userIds = users.map(u => u._id);
            console.log('\n--- Comments by Aryan ---');
            const comments = await Comment.find({ author: { $in: userIds } })
                                        .populate('blogId', 'title')
                                        .sort({ createdAt: -1 });
            
            if (comments.length === 0) {
                console.log('❌ No comments found for this user.');
            } else {
                comments.forEach(c => {
                    console.log(`\n[${c.createdAt.toISOString()}] Comment: "${c.content}"`);
                    console.log(`  Blog ID: ${c.blogId?._id || c.blogId} (Title: "${c.blogId?.title || 'Unknown'}")`);
                    console.log(`  Author: ${c.author}`);
                });
            }
        }

        // 4. Find Comments on the Blog
        if (blogs.length > 0) {
            const blogIds = blogs.map(b => b._id);
            console.log(`\n--- ALL Comments on "Future of Ai" (ID: ${blogIds[0]}) ---`);
            const blogComments = await Comment.find({ blogId: { $in: blogIds } })
                                            .populate('author', 'name email')
                                            .sort({ createdAt: -1 });
            
            if (blogComments.length === 0) {
                console.log('❌ No comments found on this blog.');
            } else {
                blogComments.forEach(c => {
                    console.log(`- [${c.createdAt.toISOString()}] "${c.content}" by ${c.author?.name || 'Unknown'}`);
                });
            }
        }

        // Write logs to file
        const fs = require('fs');
        const path = require('path');
        const logContent = logs.join('\n');
        fs.writeFileSync(path.join(__dirname, 'debug_comments_log.txt'), logContent);
        console.log('Log saved to debug_comments_log.txt');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}

const logs = [];
const originalLog = console.log;
console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog.apply(console, args);
};

debugComments();
