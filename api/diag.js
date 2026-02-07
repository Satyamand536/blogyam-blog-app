const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');
const Blacklist = require('./models/blacklist');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB connected");

        const blacklisted = await Blacklist.find({});
        console.log("BLACKLIST:", JSON.stringify(blacklisted, null, 2));

        const admin = await User.findOne({ email: 'satyamand536@gmail.com' });
        if (admin) {
            console.log("ADMIN:", JSON.stringify({ 
                email: admin.email, 
                isBanned: admin.isBanned, 
                role: admin.role,
                salt: admin.salt ? 'exists' : 'null'
            }, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
