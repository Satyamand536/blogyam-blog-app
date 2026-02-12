const bcrypt = require('bcryptjs');
const { Schema, model } = require('mongoose');
const { createTokenForUser } = require('../services/authentication');

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        default: function() {
            return this.email ? this.email.split('@')[0] : 'User';
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
        // salt is no longer needed for new bcrypt hashes, but kept for legacy check
    },
    password: {
        type: String,
        required: true,
    },
    profileImageURL: {
        type: String,
        default: '/images/hacker.png'
    },
    role: {
        type: String,
        enum: ['user', 'author', 'owner', 'USER', 'ADMIN'],
        default: 'user',
    },
    bio: {
        type: String,
        default: '',
    },
    streak: {
        type: Number,
        default: 0,
    },
    savedBlogs: [{
        type: Schema.Types.ObjectId,
        ref: 'blog',
    }],
    readingHistory: [{
        blogId: { type: Schema.Types.ObjectId, ref: 'blog' },
        readAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 }
    }],
    lastReadAt: {
        type: Date,
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    banReason: {
        type: String,
        default: '',
    },
    lastIP: {
        type: String,
        default: '',
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    deletedAt: {
        type: Date,
    }
}, { timestamps: true });

// --- MIDDLEWARES ---
userSchema.pre(/^find/, function(next) {
    this.where({ isDeleted: { $ne: true } });
    next();
});

userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
    const user = this;
    
    // Auto-generate name from email if missing and lowercase email
    if (user.email) {
        user.email = user.email.toLowerCase();
        if (!user.name) {
            user.name = user.email.split('@')[0];
        }
    }
    
    if (!user.isModified('password')) return next();
    
    // Generate a unique custom salt for this user (different from Bcrypt's internal salt)
    const crypto = require('crypto');
    user.salt = crypto.randomBytes(16).toString('hex');

    // Use Bcrypt to hash the 'password + customSalt' string
    const bcryptSalt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password + user.salt, bcryptSalt);

    next();
});

userSchema.methods.recordReadingActivity = async function(blogId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastRead = this.lastReadAt ? new Date(this.lastReadAt) : null;
    let lastReadCopy = null;
    if (lastRead) {
        lastReadCopy = new Date(lastRead);
        lastReadCopy.setHours(0, 0, 0, 0);
    }

    let newStreak = 1;
    if (!lastRead) {
        newStreak = 1;
    } else {
        const diffTime = today - lastReadCopy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            newStreak = this.streak + 1;
        } else if (diffDays > 1) {
            newStreak = 1;
        } else {
            newStreak = this.streak;
        }
    }

    const updated = await model('user').findByIdAndUpdate(
        this._id,
        {
            $set: { 
                lastReadAt: new Date(),
                streak: newStreak
            },
            $pull: { readingHistory: { blogId: blogId } }
        },
        { new: false }
    );

    await model('user').findByIdAndUpdate(
        this._id,
        {
            $push: { 
                readingHistory: {
                    $each: [{ blogId, readAt: new Date() }],
                    $position: 0
                }
            }
        },
        { new: true }
    );

    return updated;
};

userSchema.static("matchPasswordAndGenerateToken", async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error("User not found!");

    console.log(`[User Model Debug] Checking password for: ${email}`);
    
    const storedPassword = user.password;
    const salt = user.salt;
    let isMatch = false;

    // Check if it's a Bcrypt hash (starts with $2a$ or $2b$)
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        console.log(`[User Model Debug] Verifying Bcrypt hash...`);
        // Use password + salt if salt exists, else just password (for transitional users)
        const checkValue = salt ? (password + salt) : password;
        isMatch = await bcrypt.compare(checkValue, storedPassword);
    } else {
        console.log(`[User Model Debug] Verifying Legacy SHA256 hash...`);
        const crypto = require('crypto');
        
        // Strategy A: password + salt
        const hashA = crypto.createHash('sha256').update(password + salt).digest('hex');
        // Strategy B: salt + password
        const hashB = crypto.createHash('sha256').update(salt + password).digest('hex');
        // Strategy C: HMAC
        const hashC = crypto.createHmac('sha256', salt).update(password).digest('hex');

        if (storedPassword === hashA) {
            console.log(`[User Model Debug] Match found (Strategy A: pass + salt)`);
            isMatch = true;
        } else if (storedPassword === hashB) {
            console.log(`[User Model Debug] Match found (Strategy B: salt + pass)`);
            isMatch = true;
        } else if (storedPassword === hashC) {
            console.log(`[User Model Debug] Match found (Strategy C: HMAC)`);
            isMatch = true;
        }
        
        // AUTO-MIGRATE TO BCRYPT ON SUCCESSFUL LOGIN
        if (isMatch) {
            console.log(`[Security] Migrating user ${email} from legacy SHA256 to modern Bcrypt...`);
            user.password = password; // pre-save hook will hash it with modern Bcrypt + Salt
            await user.save();
        }
    }

    if (!isMatch) {
        console.log(`[User Model Debug] Password mismatch.`);
        throw new Error('incorrect password');
    }

    console.log(`[User Model Debug] Password matched. Generating token...`);
    const token = createTokenForUser(user);
    return token;
});

const User = model('user', userSchema);
module.exports = User;