const {Schema,model}=require('mongoose');
const { createHmac,randomBytes } = require('crypto');
const { createTokenForUser } = require('../services/authentication');

const blogSchema=new Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public', // Default public to keep existing blogs visible
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published',
    },
    spotlight: {
        type: String,
        enum: ['none', 'featured', 'bestOfWeek'],
        default: 'none',
        index: true,
    },
    spotlightAt: {
        type: Date,
    },
    nominationStatus: {
        type: String,
        enum: ['none', 'pending', 'reviewed'],
        default: 'none',
        index: true,
    },
    coverImageURL: {
        type: String,
        required: false,
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium',
    },
    readTime: {
        type: Number, // in minutes
        default: 5,
    },
    category: {
        type: String,
        default: 'General',
        index: true,
    },
    tags: [{
        type: String,
    }],
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'user',
    }],
    views: {
        type: Number,
        default: 0,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    deletedAt: {
        type: Date,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user',
    },
}, { timestamps: true });

// Scalable Indexes
blogSchema.index({ isDeleted: 1, visibility: 1, status: 1, createdAt: -1 }); // Homepage Feed (Filtered)
blogSchema.index({ author: 1, isDeleted: 1, createdAt: -1 }); // Rate Limiting & User Profile
blogSchema.index({ spotlight: 1, isDeleted: 1, createdAt: -1 }); // Optimized Spotlight Query

// --- MIDDLEWARES ---
// Global Soft Delete Filter
blogSchema.pre(/^find/, function(next) {
    this.where({ isDeleted: { $ne: true } });
    next();
});

const Blog=model('blog',blogSchema);
module.exports=Blog;