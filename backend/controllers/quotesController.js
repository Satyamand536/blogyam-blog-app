/**
 * Quotes Controller - Production Grade
 * Database-first architecture with Redis caching
 * ZERO runtime external API dependencies
 */

const Quote = require('../models/Quote');
const DailyQuote = require('../models/DailyQuote');
const QuoteImage = require('../models/QuoteImage');
const cacheClient = require('../config/redisClient');
const { statsCache } = require('../utils/cacheManager');

// Emergency fallback images (never break)
const EMERGENCY_FALLBACK_IMAGES = {
    'Wisdom': 'https://images.unsplash.com/photo-1518531933037-9a60aa06230b?auto=format&fit=crop&q=80&w=1000',
    'Knowledge': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=1000',
    'Life': 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=1000',
    'Writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1000',
    'Philosophy': 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=1000',
    'Motivation': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000',
    'Success': 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=1000'
};

/**
 * Enrich quote with image (4-layer fallback)
 */
async function enrichQuoteWithImage(quote) {
    if (!quote) return null;
    
    try {
        // Layer 1: Use existing imageId if already assigned
        if (quote.imageId) {
            if (typeof quote.imageId === 'object' && quote.imageId.url) {
                // Already populated
                return {
                    ...quote.toObject(),
                    image: {
                        url: quote.imageId.url,
                        fallbackUrl: quote.imageId.localPath || quote.imageId.url,
                        source: quote.imageId.source
                    }
                };
            } else {
                // Populate imageId
                await quote.populate('imageId');
                if (quote.imageId) {
                    return {
                        ...quote.toObject(),
                        image: {
                            url: quote.imageId.url,
                            fallbackUrl: quote.imageId.localPath || quote.imageId.url,
                            source: quote.imageId.source
                        }
                    };
                }
            }
        }
        
        // Layer 2: Assign new image from database
        const image = await QuoteImage.getImageForCategory(quote.category);
        if (image) {
            quote.imageId = image._id;
            await quote.save();
            return {
                ...quote.toObject(),
                image: {
                    url: image.url,
                    fallbackUrl: image.localPath || image.url,
                    source: image.source
                }
            };
        }
        
        // Layer 3: Category fallback image
        const fallbackImage = await QuoteImage.getFallbackImage(quote.category);
        if (fallbackImage) {
            return {
                ...quote.toObject(),
                image: {
                    url: fallbackImage.url,
                    fallbackUrl: fallbackImage.url,
                    source: 'fallback'
                }
            };
        }
        
        // Layer 4: Emergency hardcoded fallback
        return {
            ...quote.toObject(),
            image: {
                url: EMERGENCY_FALLBACK_IMAGES[quote.category] || '/images/quotes/fallback.jpg',
                fallbackUrl: EMERGENCY_FALLBACK_IMAGES[quote.category] || '/images/quotes/fallback.jpg',
                source: 'emergency'
            }
        };
        
    } catch (error) {
        console.error('Error enriching quote with image:', error);
        // Emergency fallback
        return {
            ...quote.toObject(),
            image: {
                url: EMERGENCY_FALLBACK_IMAGES[quote.category] || '/images/quotes/fallback.jpg',
                fallbackUrl: EMERGENCY_FALLBACK_IMAGES[quote.category] || '/images/quotes/fallback.jpg',
                source: 'emergency'
            }
        };
    }
}

/**
 * GET /api/quotes/daily
 * Returns the daily quote (cached for 24 hours)
 */
async function getDailyQuote(req, res) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `daily:${today}`;
        
        // Try cache first
        const cached = await cacheClient.get(cacheKey);
        if (cached) {
            return res.json({ 
                success: true, 
                data: JSON.parse(cached),
                source: 'cache'
            });
        }
        
        // Try database DailyQuote collection
        let dailyQuote = await statsCache.getOrSet(`daily_quote:${today}`, async () => {
            return await DailyQuote.getTodaysQuote();
        }, 86400); // Cache for 24 hours
        
        if (dailyQuote) {
            // Enrich with image
            const enriched = await enrichQuoteWithImage(dailyQuote);
            
            // Cache for 24 hours (86400 seconds)
            await cacheClient.setex(cacheKey, 86400, JSON.stringify(enriched));
            
            return res.json({ 
                success: true, 
                data: enriched,
                source: 'database'
            });
        }
        
        // Emergency hardcoded fallback (should never happen if database is seeded)
        const emergencyData = {
            text: "Arise, awake, and stop not till the goal is reached.",
            author: "Swami Vivekananda",
            author_origin: "Indian",
            category: "Wisdom",
            tags: ["wisdom", "motivation"],
            source: "emergency_fallback",
            image: {
                url: EMERGENCY_FALLBACK_IMAGES['Wisdom'],
                fallbackUrl: EMERGENCY_FALLBACK_IMAGES['Wisdom'],
                source: 'emergency'
            }
        };

        return res.json({
            success: true,
            data: emergencyData,
            source: 'emergency'
        });
        
    } catch (error) {
        console.error('Daily quote error:', error);
        
        // Return emergency fallback on any error
        return res.json({
            success: true,
            data: {
                text: "Arise, awake, and stop not till the goal is reached.",
                author: "Swami Vivekananda",
                author_origin: "Indian",
                category: "Wisdom",
                tags: ["wisdom", "motivation"],
                source: "emergency_fallback"
            },
            source: 'emergency'
        });
    }
}

/**
 * GET /api/quotes?category=Wisdom&page=1&limit=20
 * Returns paginated quotes from database
 */
async function getQuotes(req, res) {
    try {
        const { 
            category = null, 
            page = 1, 
            limit = 20,
            random = false
        } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
        const cacheKey = `quotes:${category || 'all'}:${pageNum}:${limitNum}`;
        
        // Try cache first (skip if random requested)
        if (!random) {
            const cached = await cacheClient.get(cacheKey);
            if (cached) {
                return res.json({
                    success: true,
                    ...JSON.parse(cached),
                    source: 'cache'
                });
            }
        }
        
        // Fetch from database
        let quotes, total, hasMore;
        
        if (random === 'true' || random === '1') {
            // Random quotes (for navigation)
            const query = category ? { category } : {};
            query.quality_score = { $gte: 6 };
            
            total = await Quote.countDocuments(query);
            const randomSkip = Math.floor(Math.random() * Math.max(0, total - limitNum));
            
            quotes = await Quote.find(query)
                .skip(randomSkip)
                .limit(limitNum)
                .populate('imageId')
                .select('-__v');
            
            hasMore = true; // Always more random quotes available
        } else {
            // Paginated quotes
            const result = await Quote.findByCategory(category, pageNum, limitNum);
            quotes = result.quotes;
            total = result.total;
            hasMore = result.hasMore;
            
            // Populate images for paginated quotes
            await Quote.populate(quotes, { path: 'imageId' });
        }
        
        // Enrich all quotes with images
        const enrichedQuotes = await Promise.all(
            quotes.map(quote => enrichQuoteWithImage(quote))
        );
        
        const responseData = {
            quotes: enrichedQuotes,
            total,
            page: pageNum,
            limit: limitNum,
            hasMore
        };
        
        // Cache for 1 hour (3600 seconds) if not random
        if (!random) {
            await cacheClient.setex(cacheKey, 3600, JSON.stringify(responseData));
        }
        
        return res.json({
            success: true,
            ...responseData,
            source: 'database'
        });
        
    } catch (error) {
        console.error('Get quotes error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch quotes',
            message: error.message
        });
    }
}

/**
 * GET /api/quotes/stats
 * Returns statistics about quote database and cache
 */
async function getStats(req, res) {
    try {
        const stats = await Quote.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgQuality: { $avg: '$quality_score' },
                    sources: { $addToSet: '$source' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        const totalQuotes = await Quote.countDocuments();
        const dailyQuoteExists = !!(await DailyQuote.getTodaysQuote());
        const recentlyServed = await Quote.find({ lastServedAt: { $exists: true } })
            .sort({ lastServedAt: -1 })
            .limit(5)
            .select('text author lastServedAt');
        
        return res.json({
            success: true,
            stats: {
                totalQuotes,
                byCategory: stats,
                dailyQuoteSet: dailyQuoteExists,
                recentlyServed,
                cacheStatus: {
                    redisActive: cacheClient.isRedisActive(),
                    type: cacheClient.isRedisActive() ? 'redis' : 'memory'
                }
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch stats'
        });
    }
}

module.exports = {
    getDailyQuote,
    getQuotes,
    getStats
};
