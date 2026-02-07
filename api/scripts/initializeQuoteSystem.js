/**
 * Database Initialization Script
 * Run this ONCE to set up the production-ready quotes system
 * 
 * Usage: node backend/scripts/initializeQuoteSystem.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Quote = require('../models/Quote');
const DailyQuote = require('../models/DailyQuote');
const { generateDailyQuoteNow } = require('../services/cron/cronJobs');

// Import seed data
const { execSync } = require('child_process');

async function initialize() {
    try {
        console.log('🚀 Initializing Quote System...\n');
        
        // Step 1: Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB\n');
        
        // Step 2: Check if database is already seeded
        const quoteCount = await Quote.countDocuments();
        
        if (quoteCount === 0) {
            console.log('📝 Database is empty. Running seed script...\n');
            
            // Run seed script
            try {
                execSync('node scripts/seedQuotes.js', { 
                    stdio: 'inherit',
                    cwd: __dirname + '/..'
                });
            } catch (error) {
                console.error('❌ Seed script failed. Please run manually: node backend/scripts/seedQuotes.js');
                process.exit(1);
            }
        } else {
            console.log(`✅ Database already contains ${quoteCount} quotes. Skipping seed.\n`);
        }
        
        // Step 3: Generate today's daily quote
        console.log('🌅 Generating today\'s daily quote...');
        
        const today = new Date().toISOString().split('T')[0];
        const existingDailyQuote = await DailyQuote.findOne({ date: today });
        
        if (existingDailyQuote) {
            console.log('✅ Daily quote already set for today.\n');
        } else {
            try {
                const dailyQuote = await generateDailyQuoteNow();
                console.log(`✅ Daily quote set: "${dailyQuote.text.substring(0, 60)}..."\n`);
            } catch (error) {
                console.warn('⚠️  Could not generate daily quote:', error.message);
            }
        }
        
        // Step 4: Show system status
        console.log('📊 System Status:');
        const stats = await Quote.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgQuality: { $avg: '$quality_score' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} quotes (avg quality: ${stat.avgQuality.toFixed(1)})`);
        });
        
        console.log('\n✅ Quote system initialized successfully!');
        console.log('🚀 You can now start your backend server.');
        console.log('💡 Cron jobs will automatically maintain the system.');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        process.exit(1);
    }
}

// Run initialization
initialize();
