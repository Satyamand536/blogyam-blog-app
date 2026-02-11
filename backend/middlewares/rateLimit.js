const cacheClient = require('../config/redisClient');
const rateLimitMap = new Map();

/**
 * AI Assist Rate Limiter
 * Uses cacheClient (Redis/Memory) for scalability
 * Limit: 5 questions per minute
 */
const rateLimiter = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const cacheKey = `ratelimit:ai:${ip}`;
    
    try {
        const cached = await cacheClient.get(cacheKey);
        let requests = cached ? JSON.parse(cached) : [];
        
        const now = Date.now();
        const windowStart = now - 60 * 1000;
        
        // Filter out old requests
        requests = requests.filter(timestamp => timestamp > windowStart);
        
        if (requests.length >= 5) {
            return res.status(429).json({
                success: false,
                message: "you can ask only 5 questions in a minute"
            });
        }
        
        requests.push(now);
        await cacheClient.setex(cacheKey, 60, JSON.stringify(requests));
        next();
    } catch (error) {
        console.error('AI rate limiter error:', error);
        next(); 
    }
};

/**
 * Meme Rate Limiter
 * Limit: 7 memes per minute
 * Uses cacheClient (Redis/Memory) for scalability
 */
const memeRateLimiter = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const cacheKey = `ratelimit:memes:${ip}`;
    
    try {
        const cached = await cacheClient.get(cacheKey);
        let requests = cached ? JSON.parse(cached) : [];
        
        const now = Date.now();
        const windowStart = now - 60 * 1000;
        
        // Filter out old requests
        requests = requests.filter(timestamp => timestamp > windowStart);
        
        if (requests.length >= 7) {
            return res.status(429).json({
                success: false,
                message: "you can only see 7 memes in a minute"
            });
        }
        
        requests.push(now);
        await cacheClient.setex(cacheKey, 60, JSON.stringify(requests));
        next();
    } catch (error) {
        console.error('Meme rate limiter error:', error);
        next(); 
    }
};

/**
 * Signup Rate Limiter
 * Prevents mass user registration attacks
 * Limit: 3 signups per IP per hour
 */
const signupRateLimiter = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const cacheKey = `ratelimit:signup:${ip}`;
    
    try {
        const cached = await cacheClient.get(cacheKey);
        let requests = cached ? JSON.parse(cached) : [];
        
        const now = Date.now();
        const windowStart = now - 60 * 60 * 1000; // 1 hour window
        
        // Filter out old requests
        requests = requests.filter(timestamp => timestamp > windowStart);
        
        if (requests.length >= 3) {
            return res.status(429).json({
                success: false,
                error: "Too many signup attempts. Please try again after an hour."
            });
        }
        
        requests.push(now);
        await cacheClient.setex(cacheKey, 3600, JSON.stringify(requests)); // 1 hour TTL
        next();
    } catch (error) {
        console.error('Signup rate limiter error:', error);
        next(); 
    }
};

module.exports = { rateLimiter, memeRateLimiter, signupRateLimiter };
