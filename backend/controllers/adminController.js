const User = require('../models/user');
const Blog = require('../models/blog');
const Nomination = require('../models/nomination');
const Blacklist = require('../models/blacklist');
const { hotDataCache } = require('../utils/cacheManager');

async function getUsers(req, res) {
    try {
        const { page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const users = await User.find({})
            .select('-password -salt')
            .skip(skip)
            .limit(limitNum)
            .lean();
            
        const total = await User.countDocuments({});
        return res.json({ success: true, users, total, page: pageNum });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
}

async function makeAuthor(req, res) {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndUpdate(userId, { role: 'author' }, { new: true });
        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function removeAuthor(req, res) {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndUpdate(userId, { role: 'user' }, { new: true });
        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function getSpotlightQueue(req, res) {
    try {
        // Fetch all individual nominations
        const nominations = await Nomination.find({})
            .populate('user', 'name profileImageURL email')
            .populate({
                path: 'blog',
                populate: {
                    path: 'author',
                    select: 'name profileImageURL email'
                }
            })
            .sort({ createdAt: -1 });

        // Group by Blog ID to avoid duplicate cards for the same blog
        const groupedMap = new Map();

        nominations.forEach(n => {
            if (!n.blog || n.blog.nominationStatus !== 'pending') return;
            
            // SECURITY/CURATION CHECK: Only allow public & published blogs to be promoted
            if (n.blog.visibility !== 'public' || n.blog.status !== 'published') return;

            const blogId = n.blog._id.toString();
            if (!groupedMap.has(blogId)) {
                groupedMap.set(blogId, {
                    blog: n.blog,
                    nominators: []
                });
            }
            
            // Add unique nominators only
            const isAlreadyAdded = groupedMap.get(blogId).nominators.some(u => u._id.toString() === n.user._id.toString());
            if (!isAlreadyAdded) {
                groupedMap.get(blogId).nominators.push(n.user);
            }
        });

        const consolidatedNominations = Array.from(groupedMap.values());
        
        return res.json({ success: true, nominations: consolidatedNominations });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function setBlogSpotlight(req, res) {
    try {
        const { id } = req.params;
        const { spotlight } = req.body; // 'none', 'featured', 'bestOfWeek'
        
        if (!['none', 'featured', 'bestOfWeek'].includes(spotlight)) {
            return res.status(400).json({ success: false, error: 'Invalid spotlight category' });
        }

        // --- ENFORCEMENT LOGIC ---
        
        // 1. Supreme (bestOfWeek) - Max 1 (Unset previous)
        if (spotlight === 'bestOfWeek') {
            await Blog.updateMany({ spotlight: 'bestOfWeek' }, { spotlight: 'none' });
        }

        // 2. Elite Picks (featured) - Max 2
        if (spotlight === 'featured') {
            const currentFeaturedCount = await Blog.countDocuments({ spotlight: 'featured' });
            // If the blog we are setting is already featured, it's an overwrite within status (no change in count)
            const targetBlog = await Blog.findById(id);
            if (targetBlog?.spotlight !== 'featured' && currentFeaturedCount >= 2) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Maximum capacity (2) for Elite Picks reached. Please remove an existing pick before adding a new one.' 
                });
            }
        }
        
        const blog = await Blog.findByIdAndUpdate(id, { 
            spotlight,
            spotlightAt: spotlight !== 'none' ? new Date() : null,
            nominationStatus: 'reviewed'
        }, { new: true });
        
        // INVALIDATE CACHE: Clear the featured blogs cache so Home page updates instantly
        hotDataCache.del('featured_blogs');
        
        return res.json({ success: true, blog });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function getAuthors(req, res) {
    try {
        const { page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const authors = await User.find({ role: 'author' })
            .select('name email profileImageURL bio createdAt')
            .skip(skip)
            .limit(limitNum)
            .lean();
            
        const total = await User.countDocuments({ role: 'author' });
        return res.json({ success: true, authors, total, page: pageNum });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch authors' });
    }
}

async function getAuthorPublicBlogs(req, res) {
    try {
        const authorId = req.params.id;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const blogs = await Blog.find({ author: authorId, visibility: 'public', status: 'published' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
            
        const author = await User.findById(authorId).select('name profileImageURL bio').lean();
        const total = await Blog.countDocuments({ author: authorId, visibility: 'public', status: 'published' });
        
        return res.json({ success: true, blogs, author, total, page: pageNum });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch author blogs' });
    }
}

async function getActiveSpotlight(req, res) {
    try {
        const blogs = await Blog.find({ spotlight: { $in: ['featured', 'bestOfWeek'] } })
            .populate('author', 'name email profileImageURL')
            .sort({ spotlightAt: -1 });
        return res.json({ success: true, blogs });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function banUser(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const user = await User.findByIdAndUpdate(id, { isBanned: true, banReason: reason || "Violation of community guidelines" }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.json({ success: true, message: `User ${user.email} has been banned.` });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function blacklistIP(req, res) {
    try {
        const { ip, reason } = req.body;
        if (!ip || ip.trim() === '') {
            return res.status(400).json({ success: false, message: 'IP address is required' });
        }
        const entry = await Blacklist.create({ type: 'ip', value: ip, reason: reason || "Abusive activity", bannedBy: req.user._id });
        return res.json({ success: true, message: `IP ${ip} blacklisted.` });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function blacklistEmail(req, res) {
    try {
        const { email, reason } = req.body;
        if (!email || email.trim() === '') {
            return res.status(400).json({ success: false, message: 'Email address is required' });
        }
        const entry = await Blacklist.create({ type: 'email', value: email, reason: reason || "Abusive behavior", bannedBy: req.user._id });
        return res.json({ success: true, message: `Email ${email} blacklisted.` });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function getReports(req, res) {
    const Comment = require('../models/comments');
    try {
        const reports = await Comment.find({ reportCount: { $gt: 0 } })
            .populate('author', 'name email profileImageURL')
            .populate('reportedBy', 'name email')
            .populate('blogId', 'title')
            .sort({ reportCount: -1 });
        
        return res.json({ success: true, reports });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function dismissReport(req, res) {
    const Comment = require('../models/comments');
    try {
        const { id } = req.params;
        await Comment.findByIdAndUpdate(id, { reportCount: 0, reportedBy: [], isHidden: false });
        return res.json({ success: true, message: "Report dismissed" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getUsers,
    makeAuthor,
    removeAuthor,
    getSpotlightQueue,
    getActiveSpotlight,
    setBlogSpotlight,
    getAuthors,
    getAuthorPublicBlogs,
    banUser,
    blacklistIP,
    blacklistEmail,
    getReports,
    dismissReport
};
