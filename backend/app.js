require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const path = require('path');
const morgan = require('morgan');
const timeout = require('connect-timeout');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8000;

// Trust proxy (for Render/production)
app.set('trust proxy', 1);

// CORS Configuration
app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:5174'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Logging
app.use(morgan('dev'));

// Timeout Middleware (30s)
app.use(timeout('30s'));

// Global Rate Limiting (Scalability & Protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per 15 mins (generous for standard users)
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests, please try again later." }
});
app.use(limiter);

// Security & Performance
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
}));
app.use(compression());
app.use(hpp());

// Timeout handler helper
app.use(haltOnTimeout);

function haltOnTimeout(req, res, next) {
    if (!req.timedout) {
        next();
    } else {
        res.status(503).json({ success: false, error: "Response timeout" });
    }
}

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Auth Middleware
const { checkForAuthenticationCookie } = require('./middlewares/auth');
app.use(checkForAuthenticationCookie("token"));

// Static files
app.use(express.static(path.resolve('./public')));

// Database Connection
mongoose.connect(process.env.MONGODB_URL, {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
    .then(() => {
        console.log('✅ MongoDB connected');
        // Start cron jobs after DB connection
        const { startCronJobs } = require('./services/cron/cronJobs');
        startCronJobs();
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err);
        process.exit(1);
    });

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'BlogyAM API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api', require('./routes/api'));

// Serve frontend static files (for production monorepo deployment)
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../client/dist');
    app.use(express.static(frontendPath));
    
    // Catch-all route: serve index.html for client-side routing
    app.get('/:path*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// 404 Handler (only for API routes in production)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Server startup
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
