const { Schema, model } = require('mongoose');

const dailyQuoteSchema = new Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        unique: true,
        index: true
    },
    quoteId: {
        type: Schema.Types.ObjectId,
        ref: 'Quote',
        required: true
    },
    category: {
        type: String,
        enum: ['Wisdom', 'Knowledge', 'Life', 'Writing', 'Philosophy'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// TTL Index - Auto-delete entries after 30 days
dailyQuoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static Methods

/**
 * Get today's quote
 */
dailyQuoteSchema.statics.getTodaysQuote = async function() {
    const today = new Date().toISOString().split('T')[0];
    
    const dailyQuote = await this.findOne({ date: today })
        .populate('quoteId');
    
    return dailyQuote ? dailyQuote.quoteId : null;
};

/**
 * Set today's quote
 */
dailyQuoteSchema.statics.setTodaysQuote = async function(quoteId, category) {
    const today = new Date().toISOString().split('T')[0];
    
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Upsert (update if exists, insert if not)
    return await this.findOneAndUpdate(
        { date: today },
        { 
            date: today,
            quoteId,
            category,
            expiresAt
        },
        { upsert: true, new: true }
    );
};

/**
 * Get quote history for last N days
 */
dailyQuoteSchema.statics.getHistory = async function(days = 7) {
    return await this.find()
        .sort({ date: -1 })
        .limit(days)
        .populate('quoteId');
};

const DailyQuote = model('DailyQuote', dailyQuoteSchema);

module.exports = DailyQuote;
