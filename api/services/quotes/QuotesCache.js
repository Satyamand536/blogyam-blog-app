/**
 * In-Memory Cache with TTL
 * Simple, fast caching layer for quotes
 */
class QuotesCache {
    constructor(ttlMinutes = 30) {
        this.cache = new Map();
        this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    }

    /**
     * Get cached value if not expired
     */
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.value;
    }

    /**
     * Set cache value with current timestamp
     */
    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            ttlMinutes: this.ttl / 60000
        };
    }
}

module.exports = QuotesCache;
