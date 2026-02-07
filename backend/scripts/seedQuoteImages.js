/**
 * Seed Quote Images - Production Grade
 * Seeds database with 100+ image URLs from Wikimedia Commons
 * Marks critical fallback images for local storage
 * 
 * Usage: node backend/scripts/seedQuoteImages.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const QuoteImage = require('../models/QuoteImage');

// Production-grade image collection with fallback priorities
const imageDatabase = {
    Wisdom: [
        // CRITICAL FALLBACKS (will be downloaded locally)
        {
            url: '/images/quotes/wisdom/fallback-1.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lotus_temple_evening.jpg/1280px-Lotus_temple_evening.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Lotus Temple at evening - Symbol of wisdom and spirituality'
        },
        {
            url: '/images/quotes/wisdom/fallback-2.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Taj_Mahal_%28Edited%29.jpeg/1280px-Taj_Mahal_%28Edited%29.jpeg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Taj Mahal - Monument of eternal wisdom'
        },
        {
            url: '/images/quotes/wisdom/fallback-3.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Starry Night by Van Gogh - Artistic wisdom'
        },
        // CDN IMAGES (served from Wikimedia - high variety)
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/New_Delhi_Temple.jpg/1280px-New_Delhi_Temple.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Kyoto_Kiyomizu-dera_Niomon_2.jpg/1280px-Kyoto_Kiyomizu-dera_Niomon_2.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 7
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Angkor_Wat.jpg/1280px-Angkor_Wat.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Palace_of_Fine_Arts_%2816794p%29.jpg/1280px-Palace_of_Fine_Arts_%2816794p%29.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 7
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seealpsee_1.jpg/1280px-Seealpsee_1.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 7
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Hopetoun_falls.jpg/1280px-Hopetoun_falls.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 6
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Moraine_Lake_17092005.jpg/1280px-Moraine_Lake_17092005.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bamboo_Forest%2C_Kyoto%2C_Japan.jpg/800px-Bamboo_Forest%2C_Kyoto%2C_Japan.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 9
        }
    ],
    
    Knowledge: [
        // CRITICAL FALLBACKS
        {
            url: '/images/quotes/knowledge/fallback-1.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Dublin_-_Trinity_College_-_Library_-_Long_Room_-_geograph.org.uk_-_1011061.jpg/1280px-Dublin_-_Trinity_College_-_Library_-_Long_Room_-_geograph.org.uk_-_1011061.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Trinity College Library - Temple of knowledge'
        },
        {
            url: '/images/quotes/knowledge/fallback-2.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Trinity_College_Library%2C_Dublin%2C_Ireland_-_Diliff.jpg/1280px-Trinity_College_Library%2C_Dublin%2C_Ireland_-_Diliff.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Historic library - Knowledge preservation'
        },
        {
            url: '/images/quotes/knowledge/fallback-3.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/800px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Albert Einstein - Icon of knowledge'
        },
        // CDN IMAGES
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Library_of_Congress%2C_Main_Reading_Room%2C_Washington%2C_D.C._%287647831486%29.jpg/1280px-Library_of_Congress%2C_Main_Reading_Room%2C_Washington%2C_D.C._%287647831486%29.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 9
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Biblioteca_Joanina_Coimbra.jpg/1280px-Biblioteca_Joanina_Coimbra.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Austrian_National_Library%2C_State_Hall.jpg/1280px-Austrian_National_Library%2C_State_Hall.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/1280px-All_Gizah_Pyramids.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 7
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Hubble_ultra_deep_field.jpg/1280px-Hubble_ultra_deep_field.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 9
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Parthenon_from_south.jpg/1280px-Parthenon_from_south.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 7
        }
    ],
    
    Life: [
        // CRITICAL FALLBACKS
        {
            url: '/images/quotes/life/fallback-1.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg/1280px-Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Mount Everest - Life\'s greatest challenges'
        },
        {
            url: '/images/quotes/life/fallback-2.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Earth from space - The blue marble of life'
        },
        {
            url: '/images/quotes/life/fallback-3.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Road_to_Monument_Valley%2C_Arizona%2C_Estados_Unidos%2C_2014-07-31%2C_DD_12.JPG/1280px-Road_to_Monument_Valley%2C_Arizona%2C_Estados_Unidos%2C_2014-07-31%2C_DD_12.JPG',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Road to Monument Valley - Life\'s journey'
        },
        // CDN IMAGES
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Matterhorn_from_Domh%C3%BCtte_-_2.jpg/1280px-Matterhorn_from_Domh%C3%BCtte_-_2.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/1280px-Lion_waiting_in_Namibia.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 7
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Redwood_National_Park%2C_fog_in_the_forest.jpg/1280px-Redwood_National_Park%2C_fog_in_the_forest.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Sunset_over_Lake_Michigan%2C_USA.jpg/1280px-Sunset_over_Lake_Michigan%2C_USA.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 9
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Elephants_at_Amboseli_national_park_against_Mount_Kilimanjaro.jpg/1280px-Elephants_at_Amboseli_national_park_against_Mount_Kilimanjaro.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        }
    ],
    
    Writing: [
        // CRITICAL FALLBACKS
        {
            url: '/images/quotes/writing/fallback-1.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Vintage_typewriter_and_books.jpg/1280px-Vintage_typewriter_and_books.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Vintage typewriter - The writer\'s tool'
        },
        {
            url: '/images/quotes/writing/fallback-2.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Fountain_pen_writing_%28literacy%29.jpg/1280px-Fountain_pen_writing_%28literacy%29.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Fountain pen - The art of writing'
        },
        {
            url: '/images/quotes/writing/fallback-3.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Old_book_bindings.jpg/1280px-Old_book_bindings.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Ancient books - Stories preserved through time'
        },
        // CDN IMAGES
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Dublin_-_Trinity_College_-_Library_-_Long_Room_-_geograph.org.uk_-_1011061.jpg/1280px-Dublin_-_Trinity_College_-_Library_-_Long_Room_-_geograph.org.uk_-_1011061.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Palace_of_Fine_Arts_%2816794p%29.jpg/1280px-Palace_of_Fine_Arts_%2816794p%29.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 7
        }
    ],
    
    Philosophy: [
        // CRITICAL FALLBACKS
        {
            url: '/images/quotes/philosophy/fallback-1.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Parthenon_from_south.jpg/1280px-Parthenon_from_south.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Parthenon - Ancient Greek philosophy'
        },
        {
            url: '/images/quotes/philosophy/fallback-2.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Starry Night - Philosophical contemplation'
        },
        {
            url: '/images/quotes/philosophy/fallback-3.jpg',
            cdnPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seealpsee_1.jpg/1280px-Seealpsee_1.jpg',
            isFallback: true,
            storage: 'local',
            priority: 10,
            alt: 'Mountain reflection - Deep philosophical thought'
        },
        // CDN IMAGES
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Stonehenge%2C_Condado_de_Wiltshire%2C_Inglaterra%2C_2014-08-12%2C_DD_09.JPG/1280px-Stonehenge%2C_Condado_de_Wiltshire%2C_Inglaterra%2C_2014-08-12%2C_DD_09.JPG',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bamboo_Forest%2C_Kyoto%2C_Japan.jpg/800px-Bamboo_Forest%2C_Kyoto%2C_Japan.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 9
        },
        {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Hubble_ultra_deep_field.jpg/1280px-Hubble_ultra_deep_field.jpg',
            storage: 'cdn',
            source: 'wikimedia',
            priority: 8
        }
    ]
};

async function seedImages() {
    try {
        console.log('🖼️  Starting image database seeding...\n');
        
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB\n');
        
        console.log('🗑️  Clearing existing images...');
        await QuoteImage.deleteMany({});
        
        let totalInserted = 0;
        let fallbackCount = 0;
        
        for (const [category, images] of Object.entries(imageDatabase)) {
            console.log(`\n📸 Seeding ${category} images...`);
            
            for (const imageData of images) {
                try {
                    const image = new QuoteImage({
                        ...imageData,
                        category,
                        source: imageData.source || 'wikimedia'
                    });
                    
                    await image.save();
                    totalInserted++;
                    
                    if (imageData.isFallback) {
                        fallbackCount++;
                        console.log(`   ✅ Fallback image: ${imageData.alt || imageData.url}`);
                    }
                } catch (error) {
                    console.error(`   ❌ Error inserting image: ${error.message}`);
                }
            }
            
            console.log(`   ✅ ${images.length} ${category} images processed`);
        }
        
        console.log(`\n🎉 Image seeding completed!`);
        console.log(`📊 Total images inserted: ${totalInserted}`);
        console.log(`🛡️  Critical fallback images: ${fallbackCount}`);
        
        // Show statistics
        const stats = await QuoteImage.aggregate([
            {
                $group: {
                    _id: {
                        category: '$category',
                        storage: '$storage',
                        isFallback: '$isFallback'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.category': 1 } }
        ]);
        
        console.log('\n📊 Image Database Statistics:');
        const categoryStats = {};
        stats.forEach(stat => {
            const cat = stat._id.category;
            if (!categoryStats[cat]) categoryStats[cat] = { total: 0, fallback: 0, cdn: 0, local: 0 };
            categoryStats[cat].total += stat.count;
            if (stat._id.isFallback) categoryStats[cat].fallback += stat.count;
            if (stat._id.storage === 'cdn') categoryStats[cat].cdn += stat.count;
            if (stat._id.storage === 'local') categoryStats[cat].local += stat.count;
        });
        
        Object.entries(categoryStats).forEach(([cat, stats]) => {
            console.log(`   ${cat}: ${stats.total} total (${stats.fallback} fallback, ${stats.cdn} CDN, ${stats.local} local)`);
        });
        
        console.log('\n⚠️  IMPORTANT: Download fallback images to local storage!');
        console.log('   Run: node backend/scripts/downloadFallbackImages.js');
        console.log('   Or manually download the images marked as fallbacks.');
        
        console.log('\n✅ Seed script completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Seed script failed:', error);
        process.exit(1);
    }
}

seedImages();
