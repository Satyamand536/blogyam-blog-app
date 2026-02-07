/**
 * Cron Jobs - Background Tasks
 * Handles daily quote generation and database enrichment
 * External APIs are ONLY accessed here, never during user requests
 */

const cron = require('node-cron');
const Quote = require('../../models/Quote');
const DailyQuote = require('../../models/DailyQuote');
const cacheClient = require('../../config/redisClient');

// Import external API adapters for background data fetching
const quotableAdapter = require('../quotes/adapters/quotableAdapter');
const zenQuotesAdapter = require('../quotes/adapters/zenQuotesAdapter');

const categories = ['Wisdom', 'Knowledge', 'Life', 'Writing', 'Philosophy'];

/**
 * Daily Quote Fetcher - Runs at midnight (00:00) daily
 * Selects the best quote for the day from database
 */
function setupDailyQuoteCron() {
    // Run at 00:00:00 every day
    cron.schedule('0 0 * * *', async () => {
        console.log('🌅 Running daily quote cron job...');
        
        try {
            // Randomly select a category for variety
            const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
            
            // Get highest quality quote from database
            const quote = await Quote.getHighQualityQuote(selectedCategory);
            
            if (quote) {
                // Set as today's daily quote
                await DailyQuote.setTodaysQuote(quote._id, selectedCategory);
                
                // Mark quote as served
                await quote.markAsServed();
                
                // Clear cache
                const today = new Date().toISOString().split('T')[0];
                await cacheClient.del(`daily:${today}`);
                
                console.log(`✅ Daily quote set: "${quote.text.substring(0, 50)}..." by ${quote.author}`);
            } else {
                console.warn('⚠️  No quote found in database for daily quote');
            }
            
        } catch (error) {
            console.error('❌ Daily quote cron failed:', error);
        }
    }, {
        timezone: "Asia/Kolkata" // Set your timezone
    });
    
    console.log('✅ Daily quote cron job scheduled (00:00 daily)');
}

/**
 * Weekly Quote Enrichment - Runs Sunday at 02:00
 * Fetches new quotes from external APIs to enrich database
 */
function setupWeeklyEnrichmentCron() {
    // Run at 02:00 every Sunday
    cron.schedule('0 2 * * 0', async () => {
        console.log('📚 Running weekly quote enrichment...');
        
        let totalAdded = 0;
        
        for (const category of categories) {
            try {
                // Try Quotable API first
                const quotableQuote = await fetchWithTimeout(
                    () => quotableAdapter.fetchQuote(category),
                    2000
                );
                
                if (quotableQuote) {
                    await saveQuoteIfNew(quotableQuote, category);
                    totalAdded++;
                }
                
                // Try ZenQuotes API
                const zenQuote = await fetchWithTimeout(
                    () => zenQuotesAdapter.fetchQuote(category),
                    2000
                );
                
                if (zenQuote) {
                    await saveQuoteIfNew(zenQuote, category);
                    totalAdded++;
                }
                
                // Small delay between categories
                await sleep(100);
                
            } catch (error) {
                console.warn(`⚠️  Failed to enrich ${category} quotes:`, error.message);
            }
        }
        
        console.log(`✅ Weekly enrichment completed. Added ${totalAdded} new quotes`);
        
        // Clear all quote caches to show fresh content
        for (const cat of categories) {
            await cacheClient.del(`quotes:${cat}:1:20`);
        }
        await cacheClient.del(`quotes:all:1:20`);
        
    }, {
        timezone: "Asia/Kolkata"
    });
    
    console.log('✅ Weekly enrichment cron job scheduled (Sunday 02:00)');
}

/**
 * API Health Monitor - Runs every 15 minutes
 * Tests external APIs and logs their status
 */
function setupApiHealthMonitor() {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        const health = {
            quotable: 'unknown',
            zenquotes: 'unknown',
            timestamp: new Date().toISOString()
        };
        
        try {
            const quotableResult = await fetchWithTimeout(
                () => quotableAdapter.fetchQuote('Wisdom'),
                3000
            );
            health.quotable = quotableResult ? 'up' : 'down';
        } catch (error) {
            health.quotable = 'down';
        }
        
        try {
            const zenResult = await fetchWithTimeout(
                () => zenQuotesAdapter.fetchQuote('Wisdom'),
                3000
            );
            health.zenquotes = zenResult ? 'up' : 'down';
        } catch (error) {
            health.zenquotes = 'down';
        }
        
        // Only log if there are issues
        if (health.quotable === 'down' || health.zenquotes === 'down') {
            console.warn('⚠️  External API Health:', health);
        }
    }, {
        timezone: "Asia/Kolkata"
    });
    
    console.log('✅ API health monitor scheduled (every 15 minutes)');
}

/**
 * Manual trigger for daily quote generation (for testing)
 */
async function generateDailyQuoteNow() {
    console.log('🔧 Manually generating daily quote...');
    
    try {
        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        const quote = await Quote.getHighQualityQuote(selectedCategory);
        
        if (quote) {
            await DailyQuote.setTodaysQuote(quote._id, selectedCategory);
            await quote.markAsServed();
            
            const today = new Date().toISOString().split('T')[0];
            await cacheClient.del(`daily:${today}`);
            
            console.log(`✅ Daily quote manually set: "${quote.text.substring(0, 50)}..." by ${quote.author}`);
            return quote;
        }
        
        throw new Error('No quote found in database');
        
    } catch (error) {
        console.error('❌ Manual daily quote generation failed:', error);
        throw error;
    }
}

// Helper functions

async function fetchWithTimeout(fn, timeout) {
    return Promise.race([
        fn(),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ]);
}

async function saveQuoteIfNew(quoteData, category) {
    try {
        const quote = new Quote({
            text: quoteData.text || quoteData.quote,
            author: quoteData.author,
            category,
            author_origin: quoteData.author_origin || 'Non-Indian',
            tags: quoteData.tags || [],
            source: quoteData.source,
            quality_score: calculateQualityScore(quoteData)
        });
        
        await quote.save();
        console.log(`   ✅ Added new quote: "${(quoteData.text || quoteData.quote).substring(0, 40)}..."`);
        return true;
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate fingerprint - skip silently
            return false;
        }
        console.warn(`   ⚠️  Failed to save quote:`, error.message);
        return false;
    }
}

function calculateQualityScore(quoteData) {
    let score = 5; // Default
    
    // Prefer Indian authors
    if (quoteData.author_origin === 'Indian') score += 2;
    
    // Prefer known authors
    if (quoteData.author && quoteData.author !== 'Unknown') score += 1;
    
    // Prefer quotes with tags
    if (quoteData.tags && quoteData.tags.length > 0) score += 1;
    
    // Prefer medium length quotes
    const quoteContent = quoteData.text || quoteData.quote || "";
    const length = quoteContent.length;
    if (length >= 50 && length <= 250) score += 1;
    
    return Math.min(10, score); // Cap at 10
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize all cron jobs
function startCronJobs() {
    console.log('🚀 Starting cron jobs...');
    setupDailyQuoteCron();
    setupWeeklyEnrichmentCron();
    setupApiHealthMonitor();
    console.log('✅ All cron jobs initialized');
}

module.exports = {
    startCronJobs,
    generateDailyQuoteNow
};
