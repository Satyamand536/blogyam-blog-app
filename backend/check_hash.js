const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkLegacyHash() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blogyam');
    console.log("Connected to DB.");

    try {
        const User = mongoose.model('user', new mongoose.Schema({
            email: String,
            password: String,
            salt: String
        }));

        const user = await User.findOne({ email: 'satyamand536@gmail.com' });
        if (!user) {
            console.error("User satyamand536@gmail.com not found!");
            process.exit(1);
        }

        console.log(`User: ${user.email}`);
        console.log(`Stored Hash: ${user.password}`);
        console.log(`Stored Salt: ${user.salt}`);

        // We don't know the password, but we can check the LENGTH and FORMAT
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            console.log("This user is ALREADY using Bcrypt.");
        } else {
            console.log("This user is using a LEGACY hash.");
            console.log(`Hash Length: ${user.password.length}`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkLegacyHash();
