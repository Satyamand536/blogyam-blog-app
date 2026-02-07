const { Schema, model } = require('mongoose');

const nominationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: 'blog',
        required: true,
        index: true
    }
}, { timestamps: true });

// Prevent duplicate nominations for the same blog by the same user
nominationSchema.index({ user: 1, blog: 1 }, { unique: true });

const Nomination = model('nomination', nominationSchema);
module.exports = Nomination;
