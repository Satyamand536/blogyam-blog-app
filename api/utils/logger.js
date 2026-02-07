/**
 * Production-Ready Logging System
 * Structured logging with levels, timestamps, and context
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.level = options.level || process.env.LOG_LEVEL || 'info';
        this.serviceName = options.serviceName || 'blog-app';
        this.logFilePath = options.logFilePath || path.join(__dirname, '../logs/app.log');
        this.errorLogPath = options.errorLogPath || path.join(__dirname, '../logs/error.log');
        
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        // Ensure log directory exists
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            service: this.serviceName,
            message,
            ...meta
        };

        return JSON.stringify(logEntry);
    }

    writeToFile(logEntry, isError = false) {
        try {
            const filePath = isError ? this.errorLogPath : this.logFilePath;
            fs.appendFileSync(filePath, logEntry + '\n');
        } catch (err) {
            // Fallback to console if file write fails
            console.error('Failed to write to log file:', err.message);
        }
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, meta);
        
        // Console output (colorized for development)
        if (process.env.NODE_ENV !== 'production') {
            const colors = {
                error: '\x1b[31m', // Red
                warn: '\x1b[33m',  // Yellow
                info: '\x1b[36m',  // Cyan
                debug: '\x1b[90m'  // Gray
            };
            const reset = '\x1b[0m';
            console.log(`${colors[level]}${formattedMessage}${reset}`);
        } else {
            console.log(formattedMessage);
        }

        // Write to file
        this.writeToFile(formattedMessage, level === 'error');
    }

    error(message, meta = {}) {
        // Add stack trace if error object is provided
        if (meta.error && meta.error.stack) {
            meta.stack = meta.error.stack;
        }
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

    // Special method for HTTP request logging
    logRequest(req, res, duration) {
        this.info('HTTP Request', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
    }

    // Log performance metrics
    logPerformance(operation, duration, meta = {}) {
        this.info('Performance Metric', {
            operation,
            duration: `${duration}ms`,
            ...meta
        });
    }
}

// Create singleton instance
const logger = new Logger({
    serviceName: 'BlogyAM-API',
    level: process.env.LOG_LEVEL || 'info'
});

module.exports = logger;
