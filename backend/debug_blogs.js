
const mongoose = require('mongoose');
require('dotenv').config();

const blogSchema = new mongoose.Schema({
    title: String,
    coverImageURL: String,
    createdAt: Date
}, { strict: false });
const Blog = mongoose.model('Blog', blogSchema);

async function inspectLatestBlog() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to DB');
        const blogs = await Blog.find().sort({ createdAt: -1 }).limit(5);
        
        if (blogs.length > 0) {
            blogs.forEach((blog, index) => {
                console.log(`--- BLOG ${index + 1} ---`);
                console.log(`Title: ${blog.title}`);
                console.log(`Raw CoverImageURL: '${blog.coverImageURL}'`);
            });
            
            // Check for potential issues
            if (!blog.coverImageURL) console.log('WARNING: coverImageURL is empty/null');
            else if (blog.coverImageURL.includes('//uploads')) console.log('WARNING: Double slash detected');
            else if (!blog.coverImageURL.startsWith('http') && !blog.coverImageURL.startsWith('/')) console.log('WARNING: URL might be malformed (no / or http)');
            else console.log('URL format seems okay.');
        } else {
            console.log('No blogs found.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

inspectLatestBlog();
