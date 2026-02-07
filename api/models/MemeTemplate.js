const { Schema, model } = require('mongoose');

const memeTemplateSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    fallbackUrl: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['Classic', 'Modern', 'Reaction', 'Philosophy', 'Motivational', 'Trending', 'Surreal', 'Space', 'Anime'],
        default: 'Classic'
    },
    boxCount: {
        type: Number,
        default: 2
    },
    topTextDefault: {
        type: String,
        default: ''
    },
    bottomTextDefault: {
        type: String,
        default: ''
    },
    popularity: {
        type: Number,
        default: 0
    },
    usageCount: {
        type: Number,
        default: 0
    },
    priority: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for fast queries
memeTemplateSchema.index({ category: 1, popularity: -1 });
memeTemplateSchema.index({ isActive: 1 });

// Static Methods

/**
 * Get all active meme templates
 */
memeTemplateSchema.statics.getActiveTemplates = async function() {
    return await this.find({ isActive: true })
        .sort({ popularity: -1, createdAt: -1 })
        .select('-__v');
};

/**
 * Get templates by category
 */
memeTemplateSchema.statics.getByCategory = async function(category) {
    return await this.find({ category, isActive: true })
        .sort({ popularity: -1 })
        .select('-__v');
};

/**
 * Increment popularity when used
 */
memeTemplateSchema.methods.incrementPopularity = async function() {
    this.popularity += 1;
    return await this.save();
};

const MemeTemplate = model('MemeTemplate', memeTemplateSchema);

module.exports = MemeTemplate;
