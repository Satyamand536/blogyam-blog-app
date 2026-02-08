require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const path = require('path');

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

// Security & Performance
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
}));
app.use(compression());
app.use(hpp());

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
mongoose.connect(process.env.MONGODB_URL)
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

// 404 Handler
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
