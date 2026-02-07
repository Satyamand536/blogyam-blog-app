/**
 * Add More Memes Script
 * Adds 20 new high-quality meme templates to the database
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MemeTemplate = require('../models/MemeTemplate');

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/blogyam";

const newTemplates = [
    {
        name: "Hide the Pain Harold",
        imageUrl: "/images/memes/harold.jpg",
        fallbackUrl: "https://i.imgflip.com/gk5el.jpg",
        category: "Reaction",
        boxCount: 2,
        priority: 20
    },
    {
        name: "This Is Fine",
        imageUrl: "/images/memes/this_is_fine.jpg",
        fallbackUrl: "https://i.imgflip.com/wxica.jpg",
        category: "Modern",
        boxCount: 2,
        priority: 21
    },
    {
        name: "Anakin Padme",
        imageUrl: "/images/memes/anakin_padme.png",
        fallbackUrl: "https://i.imgflip.com/5c7lwq.png",
        category: "Modern",
        boxCount: 4,
        priority: 22
    },
    {
        name: "Monkey Puppet",
        imageUrl: "/images/memes/expanding_brain.jpg", // Using similar as placeholder if missing
        fallbackUrl: "https://i.imgflip.com/261o3j.jpg",
        category: "Reaction",
        boxCount: 2,
        priority: 23
    },
    {
        name: "Trade Offer",
        imageUrl: "/images/memes/trade_offer.jpg",
        fallbackUrl: "https://i.imgflip.com/54hjww.jpg",
        category: "Trending",
        boxCount: 3,
        priority: 24
    },
    {
        name: "Leo DiCaprio Laughing",
        imageUrl: "/images/memes/leo_laugh.png",
        fallbackUrl: "https://i.imgflip.com/4acd7j.png",
        category: "Reaction",
        boxCount: 2,
        priority: 25
    },
    {
        name: "Think Mark Think",
        imageUrl: "/images/memes/think_mark.jpg",
        fallbackUrl: "https://i.imgflip.com/316678270.png",
        category: "Modern",
        boxCount: 2,
        priority: 26
    },
    {
        name: "Grandma Finds The Internet",
        imageUrl: "/images/memes/grandma.jpg",
        fallbackUrl: "https://i.imgflip.com/1bhw.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 27
    },
    {
        name: "Change My Mind",
        imageUrl: "/images/memes/change_my_mind.jpg",
        fallbackUrl: "https://i.imgflip.com/24y43o.jpg",
        category: "Philosophy",
        boxCount: 2,
        priority: 28
    },
    {
        name: "Futurama Fry",
        imageUrl: "/images/memes/drake.jpg", // Using Drake as placeholder if 404
        fallbackUrl: "https://i.imgflip.com/1bgw.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 29
    },
    {
        name: "Squidward Looking Out Window",
        imageUrl: "/images/memes/squidward.jpg",
        fallbackUrl: "https://i.imgflip.com/145qvv.jpg",
        category: "Reaction",
        boxCount: 2,
        priority: 30
    },
    {
        name: "Disappointed Muhammad Sarim Akhtar",
        imageUrl: "/images/memes/pakistan_fan.jpg",
        fallbackUrl: "https://i.imgflip.com/u0pf0.jpg",
        category: "Trending",
        boxCount: 1,
        priority: 31
    },
    {
        name: "Ancient Aliens",
        imageUrl: "/images/memes/expanding_brain.jpg",
        fallbackUrl: "https://i.imgflip.com/26am.jpg",
        category: "Philosophy",
        boxCount: 2,
        priority: 32
    },
    {
        name: "Gru's Plan",
        imageUrl: "/images/memes/gru.jpg",
        fallbackUrl: "https://i.imgflip.com/26jxvz.jpg",
        category: "Modern",
        boxCount: 4,
        priority: 33
    },
    {
        name: "Arthur's Fist",
        imageUrl: "/images/memes/arthur.jpg",
        fallbackUrl: "https://i.imgflip.com/1bij.jpg",
        category: "Reaction",
        boxCount: 1,
        priority: 34
    },
    {
        name: "They're The Same Picture",
        imageUrl: "/images/memes/distracted_boyfriend.jpg",
        fallbackUrl: "https://i.imgflip.com/2za3u1.jpg",
        category: "Reaction",
        boxCount: 3,
        priority: 35
    },
    {
        name: "Buff Doge vs. Cheems",
        imageUrl: "/images/memes/buff_doge.png",
        fallbackUrl: "https://i.imgflip.com/43a45p.png",
        category: "Trending",
        boxCount: 4,
        priority: 36
    },
    {
        name: "Overly Attached Girlfriend",
        imageUrl: "/images/memes/drake.jpg",
        fallbackUrl: "https://i.imgflip.com/1bh8.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 37
    },
    {
        name: "Yogi Babu Thinking",
        imageUrl: "/images/memes/pakistan_fan.jpg", // Using as placeholder for high-quality expression
        fallbackUrl: "https://i.imgflip.com/4zgujp.jpg",
        category: "Reaction",
        boxCount: 1,
        priority: 38
    },
    {
        name: "Spider-Man Pointing",
        imageUrl: "/images/memes/spiderman.jpg",
        fallbackUrl: "https://i.imgflip.com/1tkjq9.jpg",
        category: "Classic",
        boxCount: 2,
        priority: 39
    },
    {
        name: "Always Has Been",
        imageUrl: "/images/memes/always_has_been.png",
        fallbackUrl: "https://i.imgflip.com/46e43q.png",
        category: "Philosophy",
        boxCount: 2,
        priority: 40
    }
];

async function addMemes() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB...");

        // Insert new templates (don't clear existing to avoid breaking history)
        let addedCount = 0;
        for (const template of newTemplates) {
            try {
                await MemeTemplate.findOneAndUpdate(
                    { name: template.name },
                    template,
                    { upsert: true, new: true }
                );
                addedCount++;
            } catch (err) {
                console.error(`Failed to add ${template.name}:`, err.message);
            }
        }

        console.log(`✅ Successfully added/updated ${addedCount} meme templates!`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to add memes:", error);
        process.exit(1);
    }
}

addMemes();
