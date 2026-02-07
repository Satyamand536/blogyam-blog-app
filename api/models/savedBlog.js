const { Schema, model } = require('mongoose');

const savedBlogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: 'blog',
        required: true
    }
}, { timestamps: true });

// Ensure unique combination of user and blog
savedBlogSchema.index({ user: 1, blog: 1 }, { unique: true });

const SavedBlog = model('savedBlog', savedBlogSchema);
module.exports = SavedBlog;
