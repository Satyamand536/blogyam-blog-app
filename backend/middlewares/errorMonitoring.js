/**
 * Centralized Error Monitoring Middleware
 * Handles all errors in a consistent, production-ready way
 */

const logger = require('../utils/logger');

class ErrorMonitor {
    constructor() {
        this.errorCounts = new Map();
        this.errorRateWindow = 60000; // 1 minute
        this.errorRateThreshold = 100; // Alert if > 100 errors/minute
    }

    trackError(error) {
        const errorType = error.name || 'UnknownError';
        const now = Date.now();
        
        if (!this.errorCounts.has(errorType)) {
            this.errorCounts.set(errorType, []);
        }

        const errors = this.errorCounts.get(errorType);
        errors.push(now);

        // Clean old entries
        const cutoff = now - this.errorRateWindow;
        this.errorCounts.set(
            errorType,
            errors.filter(timestamp => timestamp > cutoff)
        );

        // Check if error rate is too high
        if (errors.length > this.errorRateThreshold) {
            logger.warn('High error rate detected', {
                errorType,
                count: errors.length,
                window: '1 minute'
            });
        }
    }

    getErrorStats() {
        const stats = {};
        this.errorCounts.forEach((timestamps, errorType) => {
            stats[errorType] = timestamps.length;
        });
        return stats;
    }
}

const errorMonitor = new ErrorMonitor();

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
    // Track error
    errorMonitor.trackError(err);

    // Log error with context
    logger.error('Request Error', {
        error: err,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: req.user?._id,
        body: req.body,
        query: req.query
    });

    // Determine status code
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'An unexpected error occurred';

    // Mongoose Error Handling
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid format for field: ${err.path}`;
    } else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `A record with this ${field} already exists.`;
    }

    // JWT Error Handling
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired';
    }

    // Prepare error response
    const errorResponse = {
        success: false,
        error: process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'Internal Server Error' 
            : message,
        ...(process.env.NODE_ENV !== 'production' && { 
            stack: err.stack,
            details: err.details || (err.message ? { message: err.message } : err)
        })
    };

    // Send appropriate response
    res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.url
    });
}

/**
 * Async handler wrapper to catch promise rejections
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    errorMonitor
};
