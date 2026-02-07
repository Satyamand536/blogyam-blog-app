/**
 * Daily Quote Service
 * Manages "Quote of the Day" functionality with 24-hour caching
 * Ensures the same high-quality quote is returned for an entire day per category
 */

const QuotesAggregator = require('./QuotesAggregator');

class DailyQuoteService {
    constructor() {
        this.aggregator = new QuotesAggregator();
        // Cache structure: { category: { quote: {}, expiresAt: timestamp } }
        this.dailyCache = {};
    }

    /**
     * Get the daily quote for a specific category
     * @param {string} category - Quote category (Wisdom, Knowledge, etc.)
     * @returns {Promise<Object>} Daily quote object
     */
    async getDailyQuote(category = 'Wisdom') {
        const now = Date.now();
        
        // Check if we have a valid cached daily quote
        if (this.dailyCache[category]) {
            const cached = this.dailyCache[category];
            if (cached.expiresAt > now) {
                return cached.quote;
            }
        }

        // Fetch a new high-quality quote
        const quote = await this.aggregator.getQuote({
            category,
            random: true,
            preferHighQuality: true
        });

        // Cache until midnight (end of day)
        const expiresAt = this.getEndOfDay();
        
        this.dailyCache[category] = {
            quote,
            expiresAt
        };

        return quote;
    }

    /**
     * Get timestamp for end of current day (midnight)
     * @returns {number} Timestamp in milliseconds
     */
    getEndOfDay() {
        const now = new Date();
        const endOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23, 59, 59, 999
        );
        return endOfDay.getTime();
    }

    /**
     * Manually clear the daily cache (for testing or admin purposes)
     */
    clearCache() {
        this.dailyCache = {};
    }

    /**
     * Get cache status for debugging
     */
    getCacheStatus() {
        const now = Date.now();
        const status = {};
        
        for (const [category, data] of Object.entries(this.dailyCache)) {
            status[category] = {
                hasQuote: !!data.quote,
                timeRemaining: Math.max(0, data.expiresAt - now),
                expiresAt: new Date(data.expiresAt).toISOString()
            };
        }
        
        return status;
    }
}

module.exports = DailyQuoteService;
