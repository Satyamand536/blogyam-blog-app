const Blacklist = require('../models/blacklist');
const User = require('../models/user');

const checkModeration = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const email = req.user?.email;
    const userId = req.user?._id;

    try {
        // 1. IP Blacklist Check
        const blacklistedIP = await Blacklist.findOne({ type: 'ip', value: ip });
        if (blacklistedIP) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Your IP address has been blacklisted due to policy violations.",
                reason: blacklistedIP.reason
            });
        }

        // 2. Email Blacklist Check
        if (email) {
            const blacklistedEmail = await Blacklist.findOne({ type: 'email', value: email });
            if (blacklistedEmail) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. This email address has been blacklisted.",
                    reason: blacklistedEmail.reason
                });
            }
        }

        // 3. Selective User Ban Check (if logged in)
        if (userId) {
            const user = await User.findById(userId);
            if (user && user.isBanned) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been suspended indefinitely.",
                    reason: user.banReason
                });
            }
            
            // Log current IP to user profile for audit trail
            if (user && user.lastIP !== ip) {
                await User.findByIdAndUpdate(userId, { lastIP: ip });
            }
        }

        next();
    } catch (error) {
        console.error("Moderation check error:", error);
        next(); // Proceed anyway, don't block legitimate users if DB fails briefly
    }
};

const commentRateLimitMap = new Map();

const restrictCommentFrequency = (req, res, next) => {
    const userId = req.user?._id;
    if (!userId) return next();

    const now = Date.now();
    const windowStart = now - 60 * 1000; // 1 minute window

    let userComments = commentRateLimitMap.get(userId.toString()) || [];
    userComments = userComments.filter(t => t > windowStart);

    if (userComments.length >= 5) {
        return res.status(429).json({
            success: false,
            message: "You are commenting too fast. Please limit your contributions to 5 per minute."
        });
    }

    userComments.push(now);
    commentRateLimitMap.set(userId.toString(), userComments);
    next();
};

module.exports = { checkModeration, restrictCommentFrequency };
