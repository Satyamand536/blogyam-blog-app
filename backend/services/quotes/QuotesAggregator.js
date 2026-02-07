/**
 * Quotes Aggregator Service
 * Enterprise-grade quotes aggregation with smart fallbacks, caching, and deduplication
 */

const QuotesCache = require('./QuotesCache');
const indianQuotesAdapter = require('./adapters/indianQuotesAdapter');
const quotableAdapter = require('./adapters/quotableAdapter');
const zenQuotesAdapter = require('./adapters/zenQuotesAdapter');
const dummyJsonAdapter = require('./adapters/dummyJsonAdapter');
const typefitAdapter = require('./adapters/typefitAdapter');

class QuotesAggregator {
    constructor() {
        this.cache = new QuotesCache(30); // 30 minutes TTL
        this.adapters = [
            indianQuotesAdapter,      // Priority 1: Indian authors
            quotableAdapter,          // Priority 2: High quality, well-attributed
            zenQuotesAdapter,         // Priority 3: Motivational
            dummyJsonAdapter,         // Priority 4: Reliable and fast
            typefitAdapter            // Priority 5: Large database
        ];
    }

    /**
     * Get aggregated quote with smart fallback
     * @param {Object} options - { category, random, exclude, preferHighQuality }
     * @returns {Promise<Object>} Normalized quote
     */
    async getQuote(options = {}) {
        const { 
            category = null, 
            random = true, 
            exclude = [], 
            preferHighQuality = false 
        } = options;
        
        const cacheKey = `quote_${category || 'any'}_${random}`;

        // Check cache first (skip cache if we have exclude list or prefer high quality)
        if (!exclude.length && !preferHighQuality) {
            const cached = this.cache.get(cacheKey);
            if (cached && Math.random() > 0.3) { // 70% chance to use cache
                return cached;
            }
        }

        try {
            // Fetch from multiple sources in parallel
            const results = await Promise.allSettled(
                this.adapters.map(adapter => adapter.fetchQuote(category))
            );

            // Extract successful responses
            let quotes = results
                .filter(result => result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);

            if (quotes.length === 0) {
                console.warn('All quote adapters failed to return a result. Using fallback.');
                return this.getFallbackQuote(category);
            }

            // Deduplicate
            quotes = this.deduplicateQuotes(quotes);

            // Filter out excluded quotes (no-repeat functionality)
            if (exclude.length > 0) {
                const excludeSet = new Set(exclude.map(id => id.toLowerCase()));
                quotes = quotes.filter(quote => {
                    const fingerprint = this.getQuoteFingerprint(quote);
                    return !excludeSet.has(fingerprint);
                });

                // If all quotes are excluded, clear the filter and start over
                if (quotes.length === 0) {
                    console.log('All quotes excluded, resetting filter...');
                    quotes = results
                        .filter(result => result.status === 'fulfilled' && result.value !== null)
                        .map(result => result.value);
                    quotes = this.deduplicateQuotes(quotes);
                }
            }

            // Score and sort
            const scoredQuotes = this.scoreQuotes(quotes, category, preferHighQuality);
            scoredQuotes.sort((a, b) => b.score - a.score);

            // Select best quote
            let selectedQuote;
            if (preferHighQuality) {
                // For daily quote, pick THE best one
                selectedQuote = scoredQuotes[0];
            } else {
                // For random quotes, add variety by picking from top 3
                const topQuotes = scoredQuotes.slice(0, 3);
                selectedQuote = topQuotes[Math.floor(Math.random() * topQuotes.length)];
            }

            // Cache the result (only if no exclusions)
            if (!exclude.length && !preferHighQuality) {
                this.cache.set(cacheKey, selectedQuote.quote);
            }

            return selectedQuote.quote;

        } catch (error) {
            console.error('QuotesAggregator error:', error);
            return this.getFallbackQuote(category);
        }
    }

    /**
     * Deduplicate quotes based on normalized text + author
     */
    deduplicateQuotes(quotes) {
        const seen = new Set();
        const unique = [];

        for (const quote of quotes) {
            const key = this.normalizeKey(quote.text + quote.author);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(quote);
            }
        }

        return unique;
    }

    /**
     * Score quotes based on quality metrics
     * @param {Array} quotes - Array of quote objects
     * @param {string} category - Category filter
     * @param {boolean} preferHighQuality - If true, apply stricter quality thresholds
     */
    scoreQuotes(quotes, category, preferHighQuality = false) {
        return quotes.map(quote => {
            let score = 0;

            // Prefer Indian authors
            if (quote.author_origin === 'Indian') score += 10;

            // Prefer quotes with tags
            if (quote.tags && quote.tags.length > 0) score += 5;

            // Prefer quotes matching category
            if (category && quote.tags.includes(category.toLowerCase())) score += 8;

            // Prefer known authors (higher weight for daily quotes)
            if (quote.author && quote.author !== 'Unknown') {
                score += preferHighQuality ? 5 : 3;
            }

            // Penalize very short or very long quotes
            const length = quote.text.length;
            if (length > 50 && length < 250) score += 2;
            if (length < 30 || length > 400) score -= 3;
            
            // For daily quotes, prefer medium-length inspirational quotes
            if (preferHighQuality && length >= 80 && length <= 200) score += 5;

            // Prefer certain sources
            if (quote.source === 'indian_quotes_collection') score += 12;
            if (quote.source === 'quotable') score += 6;
            if (quote.source === 'zenquotes') score += 4;

            // For daily quotes, penalize fallback sources
            if (preferHighQuality && quote.source === 'fallback') score -= 10;

            return { quote, score };
        });
    }

    /**
     * Normalize text for comparison
     */
    normalizeKey(text) {
        if (!text) return "";
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Get fallback quote when all APIs fail
     */
    getFallbackQuote(category) {
        const fallbacks = {
            'Wisdom': {
                text: "The only true wisdom is in knowing you know nothing.",
                author: "Socrates",
                author_origin: "Non-Indian",
                tags: ["wisdom", "philosophy"],
                source: "fallback"
            },
            'Knowledge': {
                text: "An investment in knowledge pays the best interest.",
                author: "Benjamin Franklin",
                author_origin: "Non-Indian",
                tags: ["knowledge", "learning"],
                source: "fallback"
            },
            'Life': {
                text: "Life is what happens when you're busy making other plans.",
                author: "John Lennon",
                author_origin: "Non-Indian",
                tags: ["life", "philosophy"],
                source: "fallback"
            },
            'Writing': {
                text: "There is no greater agony than bearing an untold story inside you.",
                author: "Maya Angelou",
                author_origin: "Non-Indian",
                tags: ["writing", "creativity"],
                source: "fallback"
            },
            'Philosophy': {
                text: "The unexamined life is not worth living.",
                author: "Socrates",
                author_origin: "Non-Indian",
                tags: ["philosophy", "wisdom"],
                source: "fallback"
            }
        };

        return fallbacks[category] || {
            text: "The journey of a thousand miles begins with a single step.",
            author: "Lao Tzu",
            author_origin: "Non-Indian",
            tags: ["wisdom", "life"],
            source: "fallback"
        };
    }

    /**
     * Generate unique fingerprint for a quote (for tracking and deduplication)
     * @param {Object} quote - Quote object
     * @returns {string} Unique fingerprint
     */
    getQuoteFingerprint(quote) {
        const normalizedQuote = this.normalizeKey(quote.text);
        const normalizedAuthor = this.normalizeKey(quote.author || 'unknown');
        return `${normalizedQuote}_${normalizedAuthor}`;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return this.cache.getStats();
    }
}

module.exports = QuotesAggregator;
