const { Schema, model } = require('mongoose');

const quoteSchema = new Schema({
    text: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 500
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Wisdom', 'Knowledge', 'Life', 'Writing', 'Philosophy'],
        index: true
    },
    author_origin: {
        type: String,
        enum: ['Indian', 'Non-Indian'],
        default: 'Non-Indian'
    },
    tags: [{
        type: String,
        lowercase: true
    }],
    source: {
        type: String,
        enum: ['quotable', 'zenquotes', 'dummyjson', 'typefit', 'manual', 'seed', 'fallback'],
        default: 'manual'
    },
    fingerprint: {
        type: String,
        unique: true,
        index: true
    },
    quality_score: {
        type: Number,
        min: 1,
        max: 10,
        default: 5,
        index: true
    },
    imageId: {
        type: Schema.Types.ObjectId,
        ref: 'QuoteImage'
    },
    lastServedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound indexes for fast queries
quoteSchema.index({ category: 1, createdAt: -1 });
quoteSchema.index({ category: 1, quality_score: -1 });
quoteSchema.index({ quality_score: -1, createdAt: -1 });

// Middleware: Auto-generate fingerprint before save
quoteSchema.pre('save', function(next) {
    if (!this.fingerprint) {
        this.fingerprint = generateFingerprint(this.text, this.author);
    }
    next();
});

// Helper function to normalize and create fingerprint
function generateFingerprint(text, author) {
    if (!text) return `manual_${Date.now()}_${Math.random()}`;

    const normalizedText = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const normalizedAuthor = (author || 'unknown')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    return `${normalizedText}_${normalizedAuthor}`.substring(0, 200);
}

// Static Methods

/**
 * Find quotes by category with pagination
 */
quoteSchema.statics.findByCategory = async function(category, page = 1, limit = 20) {
    const query = category ? { category } : {};
    const skip = (page - 1) * limit;
    
    const quotes = await this.find(query)
        .sort({ quality_score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');
    
    const total = await this.countDocuments(query);
    
    return {
        quotes,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + quotes.length < total
    };
};

/**
 * Get a random high-quality quote
 */
quoteSchema.statics.getRandomQuote = async function(category = null, excludeIds = []) {
    const query = {
        quality_score: { $gte: 6 },
        _id: { $nin: excludeIds }
    };
    
    if (category) {
        query.category = category;
    }
    
    const count = await this.countDocuments(query);
    if (count === 0) {
        // Fallback to any quote
        return await this.findOne({}).sort({ quality_score: -1 });
    }
    
    const random = Math.floor(Math.random() * count);
    return await this.findOne(query).skip(random);
};

/**
 * Get highest quality quote for daily selection
 */
quoteSchema.statics.getHighQualityQuote = async function(category = null) {
    const query = {
        quality_score: { $gte: 7 }
    };
    
    if (category) {
        query.category = category;
    }
    
    // Get top 10 highest quality, then pick random from those
    const topQuotes = await this.find(query)
        .sort({ quality_score: -1, createdAt: -1 })
        .limit(10);
    
    if (topQuotes.length === 0) {
        // Fallback to any quote
        return await this.findOne({}).sort({ quality_score: -1 });
    }
    
    return topQuotes[Math.floor(Math.random() * topQuotes.length)];
};

/**
 * Update last served timestamp
 */
quoteSchema.methods.markAsServed = async function() {
    this.lastServedAt = new Date();
    return await this.save();
};

const Quote = model('Quote', quoteSchema);

module.exports = Quote;
