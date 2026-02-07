/**
 * Meme Controller - Production Grade
 * Serves meme templates from database and handles popularity tracking
 * ZERO runtime external API dependencies
 */

const MemeTemplate = require('../models/MemeTemplate');
const cacheClient = require('../config/redisClient');

/**
 * GET /api/memes/templates
 * Returns all active meme templates from database with robust fallback paths
 */
async function getTemplates(req, res) {
    try {
        const { category } = req.query;
        const cacheKey = category ? `memes:templates:${category}` : 'memes:templates:all';

        // Try Redis cache first
        const cached = await cacheClient.get(cacheKey);
        if (cached) {
            return res.json({
                success: true,
                data: JSON.parse(cached),
                source: 'cache'
            });
        }

        // Fetch from MongoDB
        const query = { isActive: true };
        if (category) query.category = category;

        const rawTemplates = await MemeTemplate.find(query).sort({ priority: -1, popularity: -1 });

        // Enrich templates with full fallback paths
        const templates = rawTemplates.map(template => {
            const t = template.toObject();
            
            // Generate full local fallback URL if it starts with /
            if (t.fallbackUrl && t.fallbackUrl.startsWith('/')) {
                t.fallbackUrl = `${req.protocol}://${req.get('host')}${t.fallbackUrl}`;
            }
            
            return t;
        });

        // Cache for 1 hour (3600 seconds)
        await cacheClient.setex(cacheKey, 3600, JSON.stringify(templates));

        return res.json({
            success: true,
            data: templates,
            source: 'database'
        });
    } catch (error) {
        console.error('Error fetching meme templates:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch meme templates',
            error: error.message
        });
    }
}

/**
 * POST /api/memes/templates/:id/popularity
 * Increments popularity for a template when used by a user
 */
async function incrementPopularity(req, res) {
    try {
        const { id } = req.params;
        
        // Validate ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID format'
            });
        }

        const template = await MemeTemplate.findById(id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        // Track both general popularity and usage count
        template.usageCount = (template.usageCount || 0) + 1;
        
        // Robust increment
        if (typeof template.incrementPopularity === 'function') {
            await template.incrementPopularity();
        } else {
            // Fallback if method missing
            template.popularity += 1;
            await template.save();
        }
        
        // Clear caches safely - DO NOT FAIL REQUEST If CACHE FAILS
        try {
            if (cacheClient && cacheClient.isRedisActive()) {
                const keys = await cacheClient.keys('memes:templates:*');
                if (keys.length > 0) {
                    await Promise.all(keys.map(key => cacheClient.del(key)));
                }
            }
        } catch (cacheError) {
            console.warn('Cache clear failed (non-critical):', cacheError.message);
        }

        return res.json({
            success: true,
            message: 'Popularity and usage updated',
            data: {
                popularity: template.popularity,
                usageCount: template.usageCount
            }
        });
    } catch (error) {
        console.error('Error updating meme metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update meme metrics',
            error: error.message
        });
    }
}

/**
 * GET /api/memes/stats
 * Returns statistics about meme templates
 */
async function getStats(req, res) {
    try {
        const stats = await MemeTemplate.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalPopularity: { $sum: '$popularity' },
                    totalUsage: { $sum: '$usageCount' }
                }
            },
            { $sort: { totalUsage: -1 } }
        ]);

        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch meme stats'
        });
    }
}

module.exports = {
    getTemplates,
    incrementPopularity,
    getStats
};
