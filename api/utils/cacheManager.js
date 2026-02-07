const NodeCache = require('node-cache');
const logger = require('./logger');

/**
 * Production-ready Cache Manager
 * Uses TTL for automatic invalidation
 */
class CacheManager {
    constructor(ttlSeconds = 300) { // 5 minutes default
        this.cache = new NodeCache({ 
            stdTTL: ttlSeconds, 
            checkperiod: ttlSeconds * 0.2,
            useClones: false 
        });
        
        this.cache.on('expired', (key) => {
            logger.info(`Cache key expired: ${key}`);
        });
    }

    /**
     * Get or Set pattern with async resolver
     */
    async getOrSet(key, resolver, ttl) {
        const cached = this.cache.get(key);
        if (cached !== undefined) return cached;

        const value = await resolver();
        this.cache.set(key, value, ttl);
        return value;
    }

    del(key) {
        this.cache.del(key);
    }

    flush() {
        this.cache.flushAll();
    }
}

// Global instances for specific hot data
module.exports = {
    hotDataCache: new CacheManager(600), // 10 minutes for content
    statsCache: new CacheManager(3600),   // 1 hour for stats
};
