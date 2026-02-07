const Comment = require('../models/comments');
const Blacklist = require('../models/blacklist');

// Smart Content Filter (Banned Words)
const bannedWords = [/fake/i, /spam/i, /abuse/i, /stupid/i, /idiot/i, /bc/i, /mc/i, /bs/i];

async function addComment(req, res) {
    try {
        const { content, parentId, highlightedText } = req.body;
        
        // Layer 1: Smart Content Filter
        const containsAbuse = bannedWords.some(regex => regex.test(content));
        if (containsAbuse) {
            return res.status(400).json({ 
                success: false, 
                message: "Your comment contains language that violates our community guidelines. Please be respectful." 
            });
        }

        const comment = await Comment.create({
            content,
            blogId: req.params.blogId,
            author: req.user._id,
            parentId: parentId || null,
            highlightedText: highlightedText || null,
            authorIP: req.ip || req.connection.remoteAddress
        });
        
        await comment.populate('author', 'name email profileImageURL');
        return res.status(201).json({ success: true, comment });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function reportComment(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

        // Prevent duplicate reporting
        if (comment.reportedBy.includes(userId)) {
            return res.status(400).json({ success: false, message: "You have already reported this comment." });
        }

        comment.reportedBy.push(userId);
        comment.reportCount += 1;

        // Layer 3: Auto-Hide Logic
        if (comment.reportCount >= 3) {
            comment.isHidden = true;
        }

        await comment.save();

        return res.json({ 
            success: true, 
            message: comment.isHidden ? "Comment hidden for review." : "Comment reported successfully." 
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}


async function updateComment(req, res) {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

        // Check ownership
        if (comment.author.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this comment" });
        }

        // Layer 1: Smart Content Filter (Re-check)
        const containsAbuse = bannedWords.some(regex => regex.test(content));
        if (containsAbuse) {
            return res.status(400).json({ 
                success: false, 
                message: "Your comment contains language that violates our community guidelines." 
            });
        }

        comment.content = content;
        await comment.save();

        return res.json({ success: true, comment });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { addComment, reportComment, updateComment };
