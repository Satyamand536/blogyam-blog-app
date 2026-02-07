/**
 * Redis Client with In-Memory Fallback
 * Provides caching layer for production-grade performance
 * Falls back to in-memory cache if Redis is unavailable
 */

const redis = require('redis');

// In-memory fallback cache
class MemoryCache {
    constructor() {
        this.cache = new Map();
    }

    async get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Check if expired
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    async setex(key, ttl, value) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttl * 1000)
        });
    }

    async del(key) {
        this.cache.delete(key);
    }

    async flushall() {
        this.cache.clear();
    }
}

// Redis client setup
let redisClient;
const memoryCache = new MemoryCache();
let useRedis = false;

async function initializeRedis() {
    try {
        redisClient = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                connectTimeout: 5000
            }
        });

        let hasLoggedError = false;
        redisClient.on('error', (err) => {
            if (!hasLoggedError) {
                console.warn('⚠️  Redis Client Error:', err.message);
                console.log('💾 Falling back to in-memory cache (suppressing further Redis errors)');
                hasLoggedError = true;
            }
            useRedis = false;
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
            useRedis = true;
        });

        await redisClient.connect();
    } catch (error) {
        console.warn('⚠️  Redis connection failed:', error.message);
        console.log('💾 Using in-memory cache fallback');
        useRedis = false;
    }
}

// Unified cache interface
const cacheClient = {
    async get(key) {
        try {
            if (useRedis && redisClient?.isOpen) {
                return await redisClient.get(key);
            }
        } catch (error) {
            console.warn('Redis GET error, falling back to memory:', error.message);
        }
        return await memoryCache.get(key);
    },

    async setex(key, ttl, value) {
        try {
            if (useRedis && redisClient?.isOpen) {
                await redisClient.setEx(key, ttl, value);
                return;
            }
        } catch (error) {
            console.warn('Redis SETEX error, falling back to memory:', error.message);
        }
        await memoryCache.setex(key, ttl, value);
    },

    async del(key) {
        try {
            if (useRedis && redisClient?.isOpen) {
                await redisClient.del(key);
                return;
            }
        } catch (error) {
            console.warn('Redis DEL error, falling back to memory:', error.message);
        }
        await memoryCache.del(key);
    },

    async flushall() {
        try {
            if (useRedis && redisClient?.isOpen) {
                await redisClient.flushAll();
            }
        } catch (error) {
            console.warn('Redis FLUSHALL error:', error.message);
        }
        await memoryCache.flushall();
    },

    isRedisActive() {
        return useRedis && redisClient?.isOpen;
    }
};

// Initialize on module load
initializeRedis().catch(err => {
    console.warn('Redis initialization failed:', err.message);
});

module.exports = cacheClient;
