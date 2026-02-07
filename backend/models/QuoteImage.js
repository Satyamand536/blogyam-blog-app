const { Schema, model } = require('mongoose');

const categories = ['Wisdom', 'Knowledge', 'Life', 'Writing', 'Philosophy'];

const quoteImageSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: categories,
        index: true
    },
    source: {
        type: String,
        enum: ['wikimedia', 'local', 'cloudinary', 'unsplash', 'manual'],
        default: 'local'
    },
    isFallback: {
        type: Boolean,
        default: false,
        index: true
    },
    storage: {
        type: String,
        enum: ['cdn', 'local'],
        default: 'local'
    },
    localPath: {
        type: String
    },
    cdnPath: {
        type: String
    },
    alt: {
        type: String,
        default: function() {
            return `${this.category} quote background image`;
        }
    },
    priority: {
        type: Number,
        default: 5,
        min: 1,
        max: 10
    },
    usageCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    metadata: {
        width: Number,
        height: Number,
        fileSize: Number
    }
}, {
    timestamps: true
});

// Compound indexes for fast queries
quoteImageSchema.index({ category: 1, isActive: 1, priority: -1 });
quoteImageSchema.index({ category: 1, isFallback: 1 });
quoteImageSchema.index({ isActive: 1, priority: -1 });

// Static Methods

/**
 * Get random image for category (prioritizes high-priority, less-used images)
 */
quoteImageSchema.statics.getImageForCategory = async function(category) {
    try {
        // Get all active images for category
        const images = await this.find({ 
            category, 
            isActive: true 
        }).sort({ priority: -1, usageCount: 1 }).limit(20);
        
        if (images.length === 0) {
            // Fallback to any category's fallback image
            return await this.findOne({ isFallback: true, isActive: true });
        }
        
        // Return weighted random from top images
        const selectedImage = images[Math.floor(Math.random() * Math.min(10, images.length))];
        
        // Increment usage count (non-blocking)
        this.updateOne({ _id: selectedImage._id }, { $inc: { usageCount: 1 } }).exec();
        
        return selectedImage;
    } catch (error) {
        console.error('Error getting image for category:', error);
        return await this.getFallbackImage(category);
    }
};

/**
 * Get fallback image for category (guaranteed to exist locally)
 */
quoteImageSchema.statics.getFallbackImage = async function(category) {
    try {
        return await this.findOne({ 
            category, 
            isFallback: true, 
            storage: 'local',
            isActive: true
        });
    } catch (error) {
        console.error('Error getting fallback image:', error);
        // Return emergency fallback
        return {
            url: `/images/quotes/fallback.jpg`,
            category: category,
            isFallback: true,
            storage: 'local'
        };
    }
};

/**
 * Get all fallback images (for system check)
 */
quoteImageSchema.statics.getAllFallbacks = async function() {
    return await this.find({ isFallback: true, isActive: true });
};

/**
 * Get image statistics
 */
quoteImageSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: {
                    category: '$category',
                    storage: '$storage',
                    isFallback: '$isFallback'
                },
                count: { $sum: 1 },
                avgPriority: { $avg: '$priority' },
                totalUsage: { $sum: '$usageCount' }
            }
        }
    ]);
    
    return stats;
};

const QuoteImage = model('QuoteImage', quoteImageSchema);

module.exports = QuoteImage;
