/**
 * Seed Meme Templates - Production Grade
 * Populates database with high-quality templates and local fallbacks
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MemeTemplate = require('../models/MemeTemplate');

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://satyamand536:ramramram@cluster0.aexm7.mongodb.net/blogyam-prod?retryWrites=true&w=majority&appName=Cluster0";

const templates = [
    {
        name: "Drake Hotline Bling",
        imageUrl: "https://i.imgflip.com/30b1gx.jpg",
        fallbackUrl: "https://i.imgflip.com/30b1gx.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 10
    },
    {
        name: "Distracted Boyfriend",
        imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
        fallbackUrl: "https://i.imgflip.com/1ur9b0.jpg",
        category: "Classic",
        boxCount: 3,
        priority: 9
    },
    {
        name: "Two Buttons",
        imageUrl: "https://i.imgflip.com/1g8my4.jpg",
        fallbackUrl: "https://i.imgflip.com/1g8my4.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 8
    },
    {
        name: "Change My Mind",
        imageUrl: "https://i.imgflip.com/24y43o.jpg",
        fallbackUrl: "https://i.imgflip.com/24y43o.jpg",
        category: "Modern",
        boxCount: 2,
        priority: 7
    },
    {
        name: "Batman Slapping Robin",
        imageUrl: "https://i.imgflip.com/9ehk.jpg",
        fallbackUrl: "https://i.imgflip.com/9ehk.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 6
    },
    {
        name: "Success Kid",
        imageUrl: "https://i.imgflip.com/1bip.jpg",
        fallbackUrl: "https://i.imgflip.com/1bip.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 5
    },
    {
        name: "Expanding Brain",
        imageUrl: "https://i.imgflip.com/1jwhww.jpg",
        fallbackUrl: "https://i.imgflip.com/1jwhww.jpg",
        category: "Modern",
        boxCount: 4,
        priority: 4
    },
    {
        name: "One Does Not Simply",
        imageUrl: "https://i.imgflip.com/1bij.jpg",
        fallbackUrl: "https://i.imgflip.com/1bij.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 3
    },
    {
        name: "Grumpy Cat",
        imageUrl: "https://i.imgflip.com/8p0a.jpg",
        fallbackUrl: "https://i.imgflip.com/8p0a.jpg",
        category: "Reaction",
        boxCount: 2,
        priority: 2
    },
    {
        name: "Disaster Girl",
        imageUrl: "https://i.imgflip.com/23ls.jpg",
        fallbackUrl: "https://i.imgflip.com/23ls.jpg",
        category: "Reaction",
        boxCount: 2,
        priority: 1
    },
    {
        name: "Mocking Spongebob",
        imageUrl: "https://i.imgflip.com/1otk96.jpg",
        fallbackUrl: "https://i.imgflip.com/1otk96.jpg",
        category: "Reaction",
        boxCount: 2,
        priority: 11
    },
    {
        name: "Left Exit 12 Off Ramp",
        imageUrl: "https://i.imgflip.com/22bdq6.jpg",
        fallbackUrl: "https://i.imgflip.com/22bdq6.jpg",
        category: "Modern",
        boxCount: 3,
        priority: 12
    },
    {
        name: "Bernie I Am Once Again Asking",
        imageUrl: "https://i.imgflip.com/3oevdk.jpg",
        fallbackUrl: "https://i.imgflip.com/3oevdk.jpg",
        category: "Modern",
        boxCount: 2,
        priority: 13
    },
    {
        name: "Always Has Been",
        imageUrl: "https://i.imgflip.com/43a45p.jpg",
        fallbackUrl: "https://i.imgflip.com/43a45p.jpg",
        category: "Space",
        boxCount: 2,
        priority: 14
    },
    {
        name: "Buff Doge vs. Cheems",
        imageUrl: "https://i.imgflip.com/434i5j.jpg",
        fallbackUrl: "https://i.imgflip.com/434i5j.jpg",
        category: "Modern",
        boxCount: 4,
        priority: 15
    },
    {
        name: "Sad Pablo Escobar",
        imageUrl: "https://i.imgflip.com/1c1uej.jpg",
        fallbackUrl: "https://i.imgflip.com/1c1uej.jpg",
        category: "Reaction",
        boxCount: 3,
        priority: 16
    },
    {
        name: "Woman Yelling At Cat",
        imageUrl: "https://i.imgflip.com/26am.jpg",
        fallbackUrl: "https://i.imgflip.com/26am.jpg",
        category: "Reaction",
        boxCount: 2,
        priority: 17
    },
    {
        name: "Markiplier E",
        imageUrl: "https://i.imgflip.com/261o3j.jpg",
        fallbackUrl: "https://i.imgflip.com/261o3j.jpg",
        category: "Surreal",
        boxCount: 1,
        priority: 18
    },
    {
        name: "Is This A Pigeon",
        imageUrl: "https://i.imgflip.com/1w7ygt.jpg",
        fallbackUrl: "https://i.imgflip.com/1w7ygt.jpg",
        category: "Anime",
        boxCount: 3,
        priority: 19
    }
];

async function seedMemes() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB Atlas for Meme Seeding...");

        // Clear existing templates
        await MemeTemplate.deleteMany({});
        console.log("Cleared existing meme templates.");

        // Insert new templates
        const result = await MemeTemplate.insertMany(templates);
        console.log(`✅ Successfully seeded ${result.length} production meme templates!`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedMemes();
