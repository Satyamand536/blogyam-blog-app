const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function check() {
    try {
        console.log("URIs:", process.env.MONGODB_URL);
        await mongoose.connect(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 5000 });
        console.log("DB_STATUS: CONNECTED");
        process.exit(0);
    } catch (err) {
        console.log("DB_STATUS: DISCONNECTED");
        console.error(err);
        process.exit(1);
    }
}
check();
