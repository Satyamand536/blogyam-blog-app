/**
 * Health Check and Metrics Endpoints
 * For monitoring system status in production
 */

const express = require('express');
const router = express.Router();
const performanceMonitor = require('../utils/performanceMonitor');
const { errorMonitor } = require('../middlewares/errorMonitoring');
const mongoose = require('mongoose');

/**
 * Basic health check - for load balancers
 * GET /health
 */
router.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
});

/**
 * Detailed health check - includes dependencies
 * GET /health/detailed
 */
router.get('/health/detailed', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        dependencies: {}
    };

    // Check MongoDB connection
    try {
        if (mongoose.connection.readyState === 1) {
            health.dependencies.mongodb = { status: 'connected' };
        } else {
            health.dependencies.mongodb = { status: 'disconnected' };
            health.status = 'degraded';
        }
    } catch (err) {
        health.dependencies.mongodb = { status: 'error', message: err.message };
        health.status = 'unhealthy';
    }

    // Memory usage
    const memUsage = performanceMonitor.getMemoryUsage();
    health.memory = memUsage;

    const statusCode = health.status === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(health);
});

/**
 * Performance metrics endpoint
 * GET /health/metrics
 */
router.get('/health/metrics', (req, res) => {
    const metrics = {
        performance: performanceMonitor.getMetrics(),
        errors: errorMonitor.getErrorStats(),
        memory: performanceMonitor.getMemoryUsage(),
        timestamp: new Date().toISOString()
    };

    res.status(200).json(metrics);
});

/**
 * Readiness check - for Kubernetes/container orchestration
 * GET /health/ready
 */
router.get('/health/ready', async (req, res) => {
    // Check if app is ready to serve traffic
    const ready = mongoose.connection.readyState === 1;

    if (ready) {
        res.status(200).json({ status: 'ready' });
    } else {
        res.status(503).json({ status: 'not ready' });
    }
});

/**
 * Liveness check - for Kubernetes/container orchestration  
 * GET /health/live
 */
router.get('/health/live', (req, res) => {
    // Simple check that process is alive
    res.status(200).json({ status: 'alive' });
});

module.exports = router;
