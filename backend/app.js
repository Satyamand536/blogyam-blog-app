require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');

const app = express();

/* =====================================================
   ✅ TRUST PROXY (VERY IMPORTANT FOR VERCEL)
   ===================================================== */
app.set('trust proxy', 1);

/* =====================================================
   🌍 CORS – MANUAL (NO WILDCARD)
   ===================================================== */
const ALLOWED_ORIGIN = 'https://blogyam-blog-app-zqvj.vercel.app';

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

/* =====================================================
   🛡️ SECURITY
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

/* =====================================================
   📦 PARSERS
   ===================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* =====================================================
   🛢️ DATABASE
   ===================================================== */
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

/* =====================================================
   🩺 HEALTH
   ===================================================== */
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BlogyAM API running' });
});

/* =====================================================
   🚏 API ROUTES
   ===================================================== */
app.use('/api', require('./routes/api'));

/* =====================================================
   ☁️ EXPORT (VERCEL)
   ===================================================== */
module.exports = app;
