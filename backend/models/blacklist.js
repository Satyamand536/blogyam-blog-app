const { Schema, model } = require('mongoose');

const blacklistSchema = new Schema({
    type: {
        type: String,
        enum: ['email', 'ip'],
        required: true,
    },
    value: {
        type: String, // The actual email or IP address
        required: true,
        unique: true,
    },
    reason: {
        type: String,
        default: 'Abusive behavior or policy violation',
    },
    bannedBy: {
        type: Schema.Types.ObjectId,
        ref: 'user',
    }
}, { timestamps: true });

const Blacklist = model('blacklist', blacklistSchema);
module.exports = Blacklist;
