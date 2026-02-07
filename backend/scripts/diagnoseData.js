const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/blogyam')
    .then(() => console.log('✓ Connected to MongoDB'))
    .catch(err => {
        console.error('✗ MongoDB connection error:', err);
        process.exit(1);
    });

const User = require('../models/user');
const Comment = require('../models/comments');
const Blog = require('../models/blog');

async function diagnoseData() {
    const report = [];
    const log = (msg) => {
        console.log(msg);
        report.push(msg);
    };

    try {
        log('\n' + '='.repeat(60));
        log('DATABASE DIAGNOSTIC REPORT');
        log('='.repeat(60) + '\n');

        // 1. Check all users
        log('📊 USERS IN DATABASE:');
        log('-'.repeat(60));
        const users = await User.find({}, 'name email _id').lean();
        users.forEach((user, index) => {
            log(`${index + 1}. Name: "${user.name}" | Email: ${user.email} | ID: ${user._id}`);
        });
        log(`\nTotal Users: ${users.length}\n`);

        // 2. Check comment authors distribution
        log('💬 COMMENTS AUTHOR DISTRIBUTION:');
        log('-'.repeat(60));
        const comments = await Comment.find({}).populate('author', 'name email').lean();
        const authorCounts = {};
        
        comments.forEach(comment => {
            const authorName = comment.author?.name || 'Unknown';
            const authorId = comment.author?._id?.toString() || 'No Author';
            const key = `${authorName} (${authorId})`;
            authorCounts[key] = (authorCounts[key] || 0) + 1;
        });

        Object.entries(authorCounts).forEach(([author, count]) => {
            log(`  ${author}: ${count} comment(s)`);
        });
        log(`\nTotal Comments: ${comments.length}\n`);

        // 3. Check if all comments have the same author
        const uniqueAuthors = new Set(comments.map(c => c.author?._id?.toString()));
        if (uniqueAuthors.size === 1 && comments.length > 1) {
            log('⚠️  WARNING: ALL COMMENTS HAVE THE SAME AUTHOR!');
            log(`   All ${comments.length} comments belong to: ${comments[0]?.author?.name}\n`);
        }

        // 4. Check blog authors
        log('📝 BLOG AUTHORS DISTRIBUTION:');
        log('-'.repeat(60));
        const blogs = await Blog.find({}).populate('author', 'name email').lean();
        const blogAuthorCounts = {};
        
        blogs.forEach(blog => {
            const authorName = blog.author?.name || 'Unknown';
            const authorId = blog.author?._id?.toString() || 'No Author';
            const key = `${authorName} (${authorId})`;
            blogAuthorCounts[key] = (blogAuthorCounts[key] || 0) + 1;
        });

        Object.entries(blogAuthorCounts).forEach(([author, count]) => {
            log(`  ${author}: ${count} blog(s)`);
        });
        log(`\nTotal Blogs: ${blogs.length}\n`);

        // 5. Sample some comments to show the issue
        log('🔍 SAMPLE COMMENTS (First 10):');
        log('-'.repeat(60));
        const sampleComments = comments.slice(0, 10);
        sampleComments.forEach((comment, index) => {
            log(`${index + 1}. Comment: "${comment.content.substring(0, 40)}..."`);
            log(`   Author: ${comment.author?.name} (ID: ${comment.author?._id})`);
            log(`   Created: ${comment.createdAt}\n`);
        });

        log('='.repeat(60));
        log('DIAGNOSTIC COMPLETE');
        log('='.repeat(60) + '\n');

        // Save report to file
        const reportPath = path.join(__dirname, 'diagnostic_report.txt');
        fs.writeFileSync(reportPath, report.join('\n'));
        console.log(`\n📄 Full report saved to: ${reportPath}\n`);

        process.exit(0);
    } catch (error) {
        console.error('\n✗ Diagnostic failed:', error);
        process.exit(1);
    }
}

// Run diagnostic
diagnoseData();
