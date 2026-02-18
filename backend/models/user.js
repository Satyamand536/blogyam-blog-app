const { Schema, model } = require('mongoose');
const { createTokenForUser } = require('../services/authentication');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); // Keep for legacy check

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
    
    // Generate a unique salt for this user
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.createHmac("sha256", salt)
        .update(user.password)
        .digest("hex");

    user.salt = salt;
    user.password = hashedPassword;

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

    const salt = user.salt;
    const hashedPassword = user.password;
    let isMatch = false;

    // 1. TRY NEW HMAC-SHA256 METHOD (User provided)
    const userProvidedHash = crypto.createHmac("sha256", salt)
        .update(password)
        .digest("hex");

    if (hashedPassword === userProvidedHash) {
        isMatch = true;
    } 
    // 2. FALLBACK: Check if it's a Bcrypt hash (Legacy support for current users)
    else if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
        console.log(`[Security] Checking legacy Bcrypt hash for ${email}...`);
        // Use password + salt if salt exists from previous implementation
        const checkValue = salt ? (password + salt) : password;
        isMatch = await bcrypt.compare(checkValue, hashedPassword);
        
        if (isMatch) {
            console.log(`[Security] Migrating user ${email} from Bcrypt to HMAC-SHA256...`);
            user.password = password; // pre-save hook will hash it with HMAC
            await user.save();
        }
    }
    // 3. FALLBACK: Legacy SHA256 (Non-HMAC, previous iterations)
    else {
        console.log(`[Security] Checking legacy SHA256 formats for ${email}...`);
        const hashA = crypto.createHash('sha256').update(password + salt).digest('hex');
        const hashB = crypto.createHash('sha256').update(salt + password).digest('hex');

        if (hashedPassword === hashA || hashedPassword === hashB) {
            isMatch = true;
            console.log(`[Security] Migrating user ${email} from legacy SHA256 to HMAC-SHA256...`);
            user.password = password;
            await user.save();
        }
    }

    if (!isMatch) throw new Error("Incorrect password");

    return createTokenForUser(user);
});

const User = model('user', userSchema);
module.exports = User;