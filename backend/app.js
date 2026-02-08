require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');

const app = express();

/* =====================================================
   🌍 CORS – MANUAL (NO WILDCARD EVER)
   ===================================================== */
const ALLOWED_ORIGIN = 'https://blogyam-blog-app-zqvj.vercel.app';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  // preflight
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
   ☁️ EXPORT
   ===================================================== */
module.exports = app;
