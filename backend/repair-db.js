require('dotenv').config();
const mongoose = require('mongoose');

async function repair() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const db = mongoose.connection.db;

        console.log('=== Repairing Users ===');
        const users = await db.collection('users').find({}).toArray();
        for (const user of users) {
            let newName = user.name;
            // If name is null, undefined, or the string "null"
            if (!newName || newName === "null" || newName === "undefined") {
                // Extract from email: satyamand536@gmail.com -> Satyamand536
                const prefix = user.email.split('@')[0];
                // Capitalize first letter and make it look like a name
                newName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[0-9]/g, '');
                if (newName.length < 3) newName = prefix; // Fallback if too short

                console.log(`Repairing User ${user.email}: -> ${newName}`);
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $set: { name: newName } }
                );
            }
        }

        console.log('\n=== Repairing Blogs ===');
        const blogs = await db.collection('blogs').find({}).toArray();
        for (const blog of blogs) {
            if (!blog.author) {
                // Find any valid user to attribute it to (prefer admin or first user)
                const firstUser = await db.collection('users').findOne({});
                if (firstUser) {
                    console.log(`Attributing Blog "${blog.title}" to ${firstUser.email}`);
                    await db.collection('blogs').updateOne(
                        { _id: blog._id },
                        { $set: { author: firstUser._id } }
                    );
                }
            }
        }

        console.log('\n=== Repairing Comments ===');
        const comments = await db.collection('comments').find({}).toArray();
        for (const comment of comments) {
            if (!comment.author) {
                // Similar to blogs, attribute to a default user if authorship is lost
                const firstUser = await db.collection('users').findOne({});
                if (firstUser) {
                    console.log(`Attributing Comment "${comment.content.substring(0,10)}..." to ${firstUser.email}`);
                    await db.collection('comments').updateOne(
                        { _id: comment._id },
                        { $set: { author: firstUser._id } }
                    );
                }
            }
        }

        console.log('Repair completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
}

repair();
