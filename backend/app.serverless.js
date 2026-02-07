require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

/* ❌ NEVER process.exit() in serverless */
if (!process.env.MONGODB_URL) {
  throw new Error('MONGODB_URL is missing');
}

/* ✅ Minimal CORS */
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

/* ✅ Safe MongoDB connection */
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URL);
  isConnected = true;
  console.log('MongoDB connected (serverless)');
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

/* ✅ ROUTES */
app.use('/api', require('./routes/api'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

module.exports = app;
