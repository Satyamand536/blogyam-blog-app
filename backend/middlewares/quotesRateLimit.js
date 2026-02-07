/**
 * Rate Limiting Middleware for Quote APIs
 * Prevents abuse and ensures fair usage
 */

const rateLimit = require('express-rate-limit');

// General quotes rate limiter - 60 requests per minute
const quotesLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per IP
    message: {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

// Daily quote limiter - more aggressive (10 requests per minute)
const dailyQuoteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: 'Too many daily quote requests. Please wait.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Stats endpoint limiter - lighter (100 requests per minute)
const statsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many stat requests.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    quotesLimiter,
    dailyQuoteLimiter,
    statsLimiter
};
