/**
 * Serverless-Safe Production Logger
 * - Works on Vercel / AWS Lambda
 * - No filesystem usage
 * - Structured JSON logs
 */

const isServerless = !!process.env.VERCEL;

class Logger {
    constructor(options = {}) {
        this.level = options.level || process.env.LOG_LEVEL || 'info';
        this.serviceName = options.serviceName || 'blog-app';

        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    formatMessage(level, message, meta = {}) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            service: this.serviceName,
            message,
            ...meta
        });
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;

        // Attach stack trace safely
        if (meta?.error instanceof Error) {
            meta.stack = meta.error.stack;
            meta.error = meta.error.message;
        }

        const formatted = this.formatMessage(level, message, meta);

        // Serverless & Production-safe logging
        if (level === 'error') {
            console.error(formatted);
        } else if (level === 'warn') {
            console.warn(formatted);
        } else {
            console.log(formatted);
        }
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    // HTTP request logging
    logRequest(req, res, duration) {
        this.info('HTTP Request', {
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get?.('user-agent')
        });
    }

    // Performance metrics
    logPerformance(operation, duration, meta = {}) {
        this.info('Performance Metric', {
            operation,
            duration: `${duration}ms`,
            ...meta
        });
    }
}

// Singleton instance
module.exports = new Logger({
    serviceName: 'BlogyAM-API',
    level: process.env.LOG_LEVEL || 'info'
});
