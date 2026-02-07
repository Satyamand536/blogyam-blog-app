require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ⚠️ SIMPLE CORS (baad me tighten karenge)
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// ⚠️ MongoDB connect (NO cron jobs)
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('Mongo connected (serverless)'))
    .catch(err => console.error(err));
}

// ✅ ROUTES (KEEP /api PREFIX)
app.use('/api', require('./routes/api'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

module.exports = app;
