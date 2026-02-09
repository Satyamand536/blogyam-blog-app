require('dotenv').config();
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: String,
    coverImageURL: String,
    createdAt: Date
});

const Blog = mongoose.model('Blog', blogSchema);

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to DB');
        
        const blogs = await Blog.find().sort({ createdAt: -1 }).limit(5);
        
        blogs.forEach(b => {
            console.log(`ID: ${b._id}`);
            console.log(`Title: ${b.title}`);
            console.log(`Cover: ${b.coverImageURL}`);
            console.log('---');
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
