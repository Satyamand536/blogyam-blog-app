/**
 * Performance Monitoring Utility
 * Tracks API response times, slow queries, and system metrics
 */

const logger = require('./logger');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                byRoute: new Map(),
                byStatus: new Map()
            },
            responseTimes: [],
            slowQueries: [],
            errors: 0
        };

        this.slowQueryThreshold = process.env.SLOW_QUERY_THRESHOLD || 1000; // 1 second
        this.maxMetricsSize = 1000; // Keep last 1000 entries
    }

    /**
     * Middleware to track request performance
     */
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();

            // Capture original end method
            const originalEnd = res.end;

            res.end = function(...args) {
                const duration = Date.now() - startTime;
                
                // Track metrics
                this.trackRequest(req.method, req.url, res.statusCode, duration);

                // Log slow requests
                if (duration > this.slowQueryThreshold) {
                    logger.warn('Slow Request', {
                        method: req.method,
                        url: req.url,
                        duration: `${duration}ms`,
                        statusCode: res.statusCode
                    });
                }

                // Call original end
                originalEnd.apply(res, args);
            }.bind(this);

            next();
        };
    }

    trackRequest(method, url, statusCode, duration) {
        // Increment total
        this.metrics.requests.total++;

        // Track by route
        const route = `${method} ${url}`;
        const routeCount = this.metrics.requests.byRoute.get(route) || 0;
        this.metrics.requests.byRoute.set(route, routeCount + 1);

        // Track by status
        const statusCount = this.metrics.requests.byStatus.get(statusCode) || 0;
        this.metrics.requests.byStatus.set(statusCode, statusCount + 1);

        // Track response time
        this.metrics.responseTimes.push({
            route,
            duration,
            timestamp: Date.now()
        });

        // Keep only recent entries
        if (this.metrics.responseTimes.length > this.maxMetricsSize) {
            this.metrics.responseTimes.shift();
        }

        // Track errors
        if (statusCode >= 500) {
            this.metrics.errors++;
        }
    }

    trackSlowQuery(operation, duration, details = {}) {
        if (duration > this.slowQueryThreshold) {
            this.metrics.slowQueries.push({
                operation,
                duration,
                details,
                timestamp: Date.now()
            });

            // Keep only recent entries
            if (this.metrics.slowQueries.length > 100) {
                this.metrics.slowQueries.shift();
            }

            logger.warn('Slow Query', {
                operation,
                duration: `${duration}ms`,
                ...details
            });
        }
    }

    getMetrics() {
        const responseTimes = this.metrics.responseTimes.map(r => r.duration);
        const avgResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;

        const p95ResponseTime = this.getPercentile(responseTimes, 95);
        const p99ResponseTime = this.getPercentile(responseTimes, 99);

        return {
            requests: {
                total: this.metrics.requests.total,
                errors: this.metrics.errors,
                errorRate: this.metrics.requests.total > 0
                    ? (this.metrics.errors / this.metrics.requests.total * 100).toFixed(2) + '%'
                    : '0%'
            },
            responseTime: {
                average: Math.round(avgResponseTime),
                p95: Math.round(p95ResponseTime),
                p99: Math.round(p99ResponseTime)
            },
            topRoutes: this.getTopRoutes(10),
            statusCodeDistribution: Object.fromEntries(this.metrics.requests.byStatus),
            slowQueries: this.metrics.slowQueries.slice(-10) // Last 10 slow queries
        };
    }

    getPercentile(arr, percentile) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    getTopRoutes(limit = 10) {
        return Array.from(this.metrics.requests.byRoute.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([route, count]) => ({ route, count }));
    }

    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(usage.external / 1024 / 1024)}MB`
        };
    }

    reset() {
        this.metrics = {
            requests: {
                total: 0,
                byRoute: new Map(),
                byStatus: new Map()
            },
            responseTimes: [],
            slowQueries: [],
            errors: 0
        };
    }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
