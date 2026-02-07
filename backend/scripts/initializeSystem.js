/**
 * Complete System Initialization Script
 * Seeds both quotes and images in one go
 * Run: node backend/scripts/initializeSystem.js
 */

const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const QuoteImage = require('../models/QuoteImage');
const DailyQuote = require('../models/DailyQuote');

// MongoDB connection string - CHANGE THIS
const MONGODB_URL = 'mongodb+srv://satyamand536_db_user:zZHFhq7aNvDZ5kCk@blogyamcluster.afijcq5.mongodb.net/blogyam?appName=blogyamCluster';

// Sample quotes (10 per category for quick setup)
const sampleQuotes = {
    Wisdom: [
        { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda", author_origin: "Indian", quality_score: 10, tags: ["wisdom", "motivation"] },
        { text: "The mind is everything. What you think you become.", author: "Buddha", author_origin: "Indian", quality_score: 9, tags: ["wisdom", "mindfulness"] },
        { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 10, tags: ["wisdom", "change"] },
        { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", author_origin: "Non-Indian", quality_score: 9, tags: ["wisdom", "philosophy"] },
        { text: "Know thyself.", author: "Socrates", author_origin: "Non-Indian", quality_score: 8, tags: ["wisdom", "self-awareness"] }
    ],
    Knowledge: [
        { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", author_origin: "Non-Indian", quality_score: 9, tags: ["knowledge", "learning"] },
        { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", author_origin: "Non-Indian", quality_score: 10, tags: ["knowledge", "education"] },
        { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 10, tags: ["knowledge", "learning"] },
        { text: "The only source of knowledge is experience.", author: "Albert Einstein", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "experience"] },
        { text: "Knowledge is power.", author: "Francis Bacon", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "power"] }
    ],
    Life: [
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", author_origin: "Non-Indian", quality_score: 9, tags: ["life", "plans"] },
        { text: "The purpose of our lives is to be happy.", author: "Dalai Lama", author_origin: "Indian", quality_score: 8, tags: ["life", "happiness"] },
        { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", author_origin: "Non-Indian", quality_score: 9, tags: ["life", "authenticity"] },
        { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "adventure"] },
        { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", author_origin: "Indian", quality_score: 9, tags: ["life", "mindfulness"] }
    ],
    Writing: [
        { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "storytelling"] },
        { text: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "creation"] },
        { text: "You can make anything by writing.", author: "C.S. Lewis", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "creativity"] },
        { text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.", author: "Ernest Hemingway", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "emotion"] },
        { text: "Words are, in my not-so-humble opinion, our most inexhaustible source of magic.", author: "J.K. Rowling", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "words"] }
    ],
    Philosophy: [
        { text: "The unexamined life is not worth living.", author: "Socrates", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "life"] },
        { text: "I think, therefore I am.", author: "René Descartes", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "existence"] },
        { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "purpose"] },
        { text: "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.", author: "Marcus Aurelius", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "truth"] },
        { text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "thinking"] }
    ]
};

// Image database
const sampleImages = {
    Wisdom: [
        { url: '/images/quotes/wisdom/fallback-1.jpg', cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lotus_temple_evening.jpg/1280px-Lotus_temple_evening.jpg', isFallback: true, storage: 'local', priority: 10 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Taj_Mahal_%28Edited%29.jpeg/1280px-Taj_Mahal_%28Edited%29.jpeg', storage: 'cdn', source: 'wikimedia', priority: 8 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', storage: 'cdn', source: 'wikimedia', priority: 9 }
    ],
    Knowledge: [
        { url: '/images/quotes/knowledge/fallback-1.jpg', cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Dublin_-_Trinity_College_-_Library_-_Long_Room_-_geograph.org.uk_-_1011061.jpg/1280px-Dublin_-_Trinity_College_-_Library_-_Long_Room_-_geograph.org.uk_-_1011061.jpg', isFallback: true, storage: 'local', priority: 10 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Trinity_College_Library%2C_Dublin%2C_Ireland_-_Diliff.jpg/1280px-Trinity_College_Library%2C_Dublin%2C_Ireland_-_Diliff.jpg', storage: 'cdn', source: 'wikimedia', priority: 8 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/800px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg', storage: 'cdn', source: 'wikimedia', priority: 9 }
    ],
    Life: [
        { url: '/images/quotes/life/fallback-1.jpg', cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg/1280px-Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg', isFallback: true, storage: 'local', priority: 10 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg', storage: 'cdn', source: 'wikimedia', priority: 9 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Road_to_Monument_Valley%2C_Arizona%2C_Estados_Unidos%2C_2014-07-31%2C_DD_12.JPG/1280px-Road_to_Monument_Valley%2C_Arizona%2C_Estados_Unidos%2C_2014-07-31%2C_DD_12.JPG', storage: 'cdn', source: 'wikimedia', priority: 8 }
    ],
    Writing: [
        { url: '/images/quotes/writing/fallback-1.jpg', cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Vintage_typewriter_and_books.jpg/1280px-Vintage_typewriter_and_books.jpg', isFallback: true, storage: 'local', priority: 10 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Dublin_-_Trinity_College_-_Library_-_Long_Room_-_geograph.org.uk_-_1011061.jpg/1280px-Dublin_-_Trinity_College_-_Library_-_Long_Room_-_geograph.org.uk_-_1011061.jpg', storage: 'cdn', source: 'wikimedia', priority: 7 }
    ],
    Philosophy: [
        { url: '/images/quotes/philosophy/fallback-1.jpg', cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Parthenon_from_south.jpg/1280px-Parthenon_from_south.jpg', isFallback: true, storage: 'local', priority: 10 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', storage: 'cdn', source: 'wikimedia', priority: 8 },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seealpsee_1.jpg/1280px-Seealpsee_1.jpg', storage: 'cdn', source: 'wikimedia', priority: 7 }
    ]
};

async function initialize() {
    try {
        console.log('🚀 Starting system initialization...\n');
        
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URL);
        console.log('✅ Connected!\n');
        
        // Step 1: Seed Images
        console.log('🖼️  Seeding images...');
        await QuoteImage.deleteMany({});
        let totalImages = 0;
        
        for (const [category, images] of Object.entries(sampleImages)) {
            for (const imageData of images) {
                await QuoteImage.create({ ...imageData, category, source: imageData.source || 'wikimedia' });
                totalImages++;
            }
        }
        console.log(`✅ ${totalImages} images inserted\n`);
        
        // Step 2: Seed Quotes
        console.log('📝 Seeding quotes...');
        await Quote.deleteMany({});
        let totalQuotes = 0;
        
        for (const [category, quotes] of Object.entries(sampleQuotes)) {
            for (const quoteData of quotes) {
                await Quote.create({ ...quoteData, category, source: 'seed' });
                totalQuotes++;
            }
        }
        console.log(`✅ ${totalQuotes} quotes inserted\n`);
        
        // Step 3: Generate daily quote
        console.log('📅 Generating daily quote...');
        await DailyQuote.deleteMany({});
        const quote = await Quote.getHighQualityQuote();
        if (quote) {
            await DailyQuote.setTodaysQuote(quote);
            console.log(`✅ Daily quote set: "${quote.text}"\n`);
        }
        
        console.log('🎉 INITIALIZATION COMPLETE!');
        console.log(`📊 Total: ${totalQuotes} quotes, ${totalImages} images`);
        console.log('\n✅ You can now:');
        console.log('   1. Restart your backend server');
        console.log('   2. Test at: http://localhost:8000/api/quotes/daily');
        console.log('   3. Check stats: http://localhost:8000/api/quotes/stats\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        process.exit(1);
    }
}

initialize();
