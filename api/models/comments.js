const {Schema,model}=require('mongoose');



const commentSchema=new Schema({
    content: {
        type: String,
        required: true,
    },
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'blog',
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'comment',
        default: null, // If null, it's a top-level comment
    },
    highlightedText: {
        type: String, // Text selected by user to comment on
        default: null,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user',
    },
    // --- MODERATION STACK ---
    reportCount: {
        type: Number,
        default: 0,
    },
    reportedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'user',
    }],
    isHidden: {
        type: Boolean,
        default: false,
    },
    authorIP: {
        type: String,
        default: '',
    }
}, { timestamps: true });

const Comment=model('comment',commentSchema);
module.exports=Comment;