require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import production utilities
const logger = require('./utils/logger');
const performanceMonitor = require('./utils/performanceMonitor');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMonitoring');

// Production Security & Performance
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { randomUUID } = require('crypto');

// BOOT-TIME VALIDATION: Critical Environment Variables
const REQUIRED_ENV = ['MONGODB_URL', 'JWT_SECRET'];
REQUIRED_ENV.forEach(key => {
    if (!process.env[key]) {
        logger.error(`FATAL: Missing critical environment variable: ${key}`);
        process.exit(1);
    }
});

const app = express();
const PORT = process.env.PORT || 8000;

// ULTRA-DEBUG: Log EVERY request
app.use((req, res, next) => {
    console.log(`>>> [HIT]: ${req.method} ${req.path}`);
    next();
});

// Connect to MongoDB with enhanced error logging
mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/blogyam')
    .then(() => {
        logger.info('✓ Connected to MongoDB');
        
        // Start cron jobs after successful DB connection
        const { startCronJobs } = require('./services/cron/cronJobs');
        startCronJobs();
    })
    .catch((err) => logger.error('✗ MongoDB connection error:', { error: err.message }));

// --- STAGE 1: Essential Security & Performance ---
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
})); 
app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        'https://blogyam-blog-app.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173'
    ].filter(Boolean),
    credentials: true,
    exposedHeaders: ['X-Request-ID']
}));
app.use(compression()); // Gzip compression

// --- STAGE 2: Request Logging & Traceability ---
app.use(performanceMonitor.middleware()); // Track performance
app.use((req, res, next) => {
    req.id = randomUUID();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// --- STAGE 3: Parser & Sanitization ---
// Express 5 Compatible NoSQL Injection Protection
// Express 5 Compatible NoSQL & XSS Protection
app.use((req, res, next) => {
    const xss = require('xss');
    const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        Object.keys(obj).forEach(key => {
            // NoSQL Injection Protection
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'string') {
                // XSS Protection
                obj[key] = xss(obj[key]);
            } else if (typeof obj[key] === 'object') {
                sanitize(obj[key]);
            }
        });
        return obj;
    };
    
    // Sanitize body and params (writable)
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    
    // req.query is a getter in Express 5. We can try to sanitize its VALUES 
    // if the getter returns a mutable object copy, which it usually does in Express 5.
    if (req.query) sanitize(req.query);
    
    next();
});
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(express.urlencoded({ extended: false, limit: '10kb' })); 
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Auth Middleware
const { checkForAuthenticationCookie } = require('./middlewares/auth');
app.use(checkForAuthenticationCookie("token"));

// Static files
app.use(express.static(path.resolve('./public')));

// API Routes
app.use('/api', require('./routes/api')); // Mount API routes

// 404 & Error Handling (MUST be last)
// 404 & Error Handling (MUST be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Vercel/Serverless Export
module.exports = app;

// Standalone Server Setup (Only run if called directly)
if (require.main === module) {
    const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

    // GRACEFUL SHUTDOWN: Protect against data loss and hung connections
    const shutdown = async (signal) => {
        logger.info(`${signal} received. Starting graceful shutdown...`);
        server.close(async () => {
            logger.info('HTTP server closed.');
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed.');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown:', err);
                process.exit(1);
            }
        });

        // Force exit if shutdown takes too long (10s)
        setTimeout(() => {
            logger.error('Shutdown timed out. Forcing exit.');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}