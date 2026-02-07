require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const { randomUUID } = require('crypto');

// utils & middlewares
const logger = require('./utils/logger');
const performanceMonitor = require('./utils/performanceMonitor');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMonitoring');
const { checkForAuthenticationCookie } = require('./middlewares/auth');

// ─────────────────────────────────────────────
// 🔒 BOOT-TIME ENV VALIDATION
// ─────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URL', 'JWT_SECRET'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV variable: ${key}`);
    process.exit(1);
  }
});

const app = express();

// ─────────────────────────────────────────────
// 🧠 REQUEST DEBUG
// ─────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────
// 🛢️ DATABASE
// ─────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

/* =====================================================
   🌍 CORS – MUST COME BEFORE HELMET
   ===================================================== */
const allowedOrigins = [
  'https://blogyam-blog-app-zqvj.vercel.app', // frontend prod
  'http://localhost:5173',                   // frontend dev
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`❌ CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* =====================================================
   🛡️ SECURITY (AFTER CORS)
   ===================================================== */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

app.use(compression());
app.use(hpp());

// ─────────────────────────────────────────────
// 📦 BODY PARSERS
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// 🧭 TRACE + PERFORMANCE
// ─────────────────────────────────────────────
app.use(performanceMonitor.middleware());
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ─────────────────────────────────────────────
// 🔐 AUTH (cookie based)
// ─────────────────────────────────────────────
app.use(checkForAuthenticationCookie('token'));

// ─────────────────────────────────────────────
// 📁 STATIC FILES
// ─────────────────────────────────────────────
app.use(express.static(path.resolve('./public')));

// ─────────────────────────────────────────────
// 🩺 ROOT HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'BlogyAM API is running',
  });
});

// ─────────────────────────────────────────────
// 🚏 API ROUTES
// ─────────────────────────────────────────────
app.use('/api', require('./routes/api'));

// ─────────────────────────────────────────────
// ❌ 404 + ERROR HANDLER
// ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─────────────────────────────────────────────
// ☁️ SERVERLESS EXPORT (VERCEL)
// ─────────────────────────────────────────────
module.exports = app;

// ─────────────────────────────────────────────
// 🖥️ LOCAL DEV ONLY
// ─────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}
