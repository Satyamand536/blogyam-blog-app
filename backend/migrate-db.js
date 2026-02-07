require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Blog = require('./models/blog');
const Comment = require('./models/comments');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB for migration...');

        // 1. Migrate Users: fullName -> name
        const users = await User.find({ fullName: { $exists: true } });
        console.log(`Migrating ${users.length} users...`);
        for (const user of users) {
             // Use direct MongoDB update to bypass schema validation temporarily
             await mongoose.connection.collection('users').updateOne(
                { _id: user._id },
                { 
                    $set: { name: user.fullName },
                    $unset: { fullName: "" }
                }
             );
        }

        // 2. Migrate Blogs: createdBy -> author
        const blogs = await Blog.find({ createdBy: { $exists: true } });
        console.log(`Migrating ${blogs.length} blogs...`);
        for (const blog of blogs) {
            await mongoose.connection.collection('blogs').updateOne(
                { _id: blog._id },
                { 
                    $set: { author: blog.createdBy },
                    $unset: { createdBy: "" }
                }
            );
        }

        // 3. Migrate Comments: createdBy -> author
        const comments = await Comment.find({ createdBy: { $exists: true } });
        console.log(`Migrating ${comments.length} comments...`);
        for (const comment of comments) {
            await mongoose.connection.collection('comments').updateOne(
                { _id: comment._id },
                { 
                    $set: { author: comment.createdBy },
                    $unset: { createdBy: "" }
                }
            );
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
