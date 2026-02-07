const {Schema,model}=require('mongoose');
const { createHash, randomBytes } = require('crypto');
const { createTokenForUser } = require('../services/authentication');
const userSchema=new Schema({
    name:{
        type:String,
        required:true,
        default: function() {
            // Generate name from email if not provided
            return this.email ? this.email.split('@')[0] : 'User';
        }
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    salt:{
        type:String,
        
    },
    password:{
        type:String,
        required:true,
    },
    profileImageURL:{
        type:String,
        default:'/images/hacker.png'
    },
    role: {
        type: String,
        enum: ['user', 'author', 'owner', 'USER', 'ADMIN'], // Keeping USER/ADMIN for backward compatibility if needed, but 'user' is default
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
        progress: { type: Number, default: 0 } // Percentage
    }],
    lastReadAt: {
        type: Date,
    },
    // --- MODERATION STACK ---
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

// Index for scalable author lookups
userSchema.index({ role: 1 });

//jab bhi hum userschema ko save krne lagenge to hmare paas next function aayega to
userSchema.pre('save',function (next){
    const user=this;//user ko le rhe hain then 
    
    // Auto-generate name from email if missing and lowercase email
    if (user.email) {
        user.email = user.email.toLowerCase();
        if (!user.name) {
            user.name = user.email.split('@')[0];
        }
    }
    
    if(!user.isModified('password')) return next(); // FIXED: Must call next() to continue save

    const salt = randomBytes(16).toString('hex');
    const hashedPassword = createHash('sha256')
        .update(user.password + salt)
        .digest('hex');

    this.salt = salt;
    this.password = hashedPassword;

    next();

})

//to ise krna se ye fayda hoga ki jab hum user ko save krne ka try karenge to ye function run krega aur user ke paasword ko hash krega.

userSchema.methods.recordReadingActivity = async function(blogId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastRead = this.lastReadAt ? new Date(this.lastReadAt) : null;
    let lastReadCopy = null;
    if (lastRead) {
        lastReadCopy = new Date(lastRead);
        lastReadCopy.setHours(0, 0, 0, 0);
    }

    // Calculate new streak
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
            newStreak = this.streak; // Same day, keep current streak
        }
    }

    // Use atomic update to prevent version conflicts
    const User = require('./user');
    const updated = await User.findByIdAndUpdate(
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

    // Now add to front
    await User.findByIdAndUpdate(
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

userSchema.static('matchPasswordAndGenerateToken',async function(email,password){
    const normalizedEmail = email.toLowerCase();
    const user=await this.findOne({email: normalizedEmail});
    if(!user) throw new Error('User not found!');
console.log(user);
    const salt=user.salt;
    const hashedPassword=user.password;

    const userProvidedHash=createHash('sha256')
    .update(password + salt)
    .digest('hex');

    if(hashedPassword!==userProvidedHash) {
        console.log(`Password mismatch for ${email}`);
        console.log(`Stored Hash: ${hashedPassword}`);
        console.log(`Computed Hash: ${userProvidedHash}`);
        console.log(`Salt used: ${salt}`);
        throw new Error('incorrect password');
    }

    const token=createTokenForUser(user);
    return token;

})

const User=model('user',userSchema);
module.exports=User;