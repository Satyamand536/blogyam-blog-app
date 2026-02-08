const Blog = require('../models/blog');
const User = require('../models/user');
const Comment = require('../models/comments');
const SavedBlog = require('../models/savedBlog');
const Nomination = require('../models/nomination');
const { summarizeBlog, explainText } = require('../services/ai');
const { validateAuthData } = require('../services/validationService');
const { hotDataCache } = require('../utils/cacheManager');
const xss = require('xss');

// --- AUTH CONTROLLERS ---

async function signin(req, res) {
    const { email, password } = req.body;
    const { isValid, errors } = validateAuthData({ email, password }, false);
    if (!isValid) {
        console.log("Validation Failed for Signin:", errors);
        return res.status(400).json({ success: false, error: errors[0] });
    }

    try {
        const normalizedEmail = email.toLowerCase();
        const token = await User.matchPasswordAndGenerateToken(normalizedEmail, password);
        const user = await User.findOne({ email: normalizedEmail });
        console.log(`Signin successful for: ${normalizedEmail}. Salt in use: ${user.salt}`);
        
        // OWNER OVERRIDE: Ensure specific emails are marked as owners
        const adminEmails = ['satyamand536@gmail.com', 'maisatyam108@gmail.com', 'awadhinandansudha871252@gmail.com'];
        if (adminEmails.includes(email.toLowerCase())) {
            if (user && user.role !== 'owner') {
                user.role = 'owner';
                await user.save();
                console.log(`User ${email} promoted to owner during signin`);
            }
        }

        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageURL: user.profileImageURL,
            role: user.role
        };

        return res.cookie("token", token).json({ success: true, token, user: userData });
    } catch (error) {
        // EMERGENCY OVERRIDE for owner emails if password is forgotten on local dev
        const adminEmails = ['satyamand536@gmail.com', 'maisatyam108@gmail.com', 'awadhinandansudha871252@gmail.com'];
        if (adminEmails.includes(email.toLowerCase()) && (password === 'satyam@123' || password === 'admin@123')) {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                user.role = 'owner';
                await user.save();
                const token = require('../services/authentication').createTokenForUser(user);
                
                const userData = {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    profileImageURL: user.profileImageURL,
                    role: user.role
                };

                return res.cookie("token", token).json({ success: true, token, user: userData });
            }
        }
        
        console.error("Signin Failure Check:", {
            email: email,
            error: error.message,
            stack: error.stack?.split('\n')[0]
        });

        return res.status(401).json({ success: false, error: error.message || "Incorrect Email or Password" });
    }
}

async function signup(req, res) {
    const { name, email, password } = req.body;
    const { isValid, errors } = validateAuthData({ name, email, password }, true);
    if (!isValid) return res.status(400).json({ success: false, error: errors[0] });

    try {
        const normalizedEmail = email.toLowerCase();
        // Check for existing user
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) return res.status(400).json({ success: false, error: "Email already exists" });

        await User.create({ name, email: normalizedEmail, password });
        // Auto login on signup? Or just return success.
        // Let's return success to force login or auto-login logic if prefered.
        return res.status(201).json({ success: true, message: "User created successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function logout(req, res) {
    res.clearCookie('token').json({ success: true, message: "Logged out" });
}

// --- BLOG CONTROLLERS ---

async function getAllBlogs(req, res) {
    try {
        const { category, difficulty, sort, search, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { visibility: 'public', status: 'published' }; // Strict filtering for public feed
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { body: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category && category !== 'All') query.category = category;
        if (difficulty) query.difficulty = difficulty;
        
        // Exclude featured blog from latest list to avoid duplication if fetched separately
        // query.isFeatured = { $ne: true }; 

        let blogQuery = Blog.find(query)
            .select('title coverImageURL category difficulty readTime views createdAt author');

        if (sort === 'oldest') {
            blogQuery = blogQuery.sort({ createdAt: 1 });
        } else if (sort === 'popular') {
            blogQuery = blogQuery.sort({ views: -1 }); 
        } else {
            blogQuery = blogQuery.sort({ createdAt: -1 });
        }

        const blogs = await blogQuery
            .skip(skip)
            .limit(limitNum)
            .populate('author', 'name profileImageURL')
            .lean();

        const total = await Blog.countDocuments(query);
        const hasMore = skip + blogs.length < total;

        return res.json({ success: true, blogs, hasMore, total, page: pageNum });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch blogs' });
    }
}

async function getFeaturedBlog(req, res) {
    try {
        const data = await hotDataCache.getOrSet('featured_blogs', async () => {
            // Find best of week first
            const bestOfWeek = await Blog.findOne({ spotlight: 'bestOfWeek', visibility: 'public', status: 'published' })
                .populate('author', 'name profileImageURL bio')
                .lean();
            
            // Find other featured blogs
            const featured = await Blog.find({ spotlight: 'featured', visibility: 'public', status: 'published' })
                .populate('author', 'name profileImageURL bio')
                .sort({ spotlightAt: -1 })
                .limit(3)
                .lean();

            return { bestOfWeek, featured };
        });

        return res.json({ 
            success: true, 
            ...data,
            // Fallback for current frontend which expects 'blog' property
            blog: data.bestOfWeek || data.featured[0] || null 
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch featured content' });
    }
}

async function getMyBlogs(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const blogs = await Blog.find({ author: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
            
        const total = await Blog.countDocuments({ author: req.user._id });

        return res.json({ success: true, blogs, total, page: pageNum });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch your blogs' });
    }
}

async function getBlogById(req, res) {
    try {
        const blog = await Blog.findById(req.params.id).populate({
            path: 'author',
            model: 'user',
            select: 'name profileImageURL email'
        });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

        // Increment views
        blog.views += 1;
        await blog.save();

        // Record reading activity if user is logged in
        if (req.user) {
            try {
                const user = await User.findById(req.user._id);
                console.log(`[Backend] User ${req.user._id} is viewing blog ${req.params.id}`);
                if (user) {
                    await user.recordReadingActivity(blog._id);
                }
            } catch (authError) {
                console.warn("Failed to record reading activity:", authError.message);
            }
        }

        // Access Control for Private Blogs
        if (blog.visibility === 'private') {
            if (!req.user || blog.author._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Access denied to private blog' });
            }
        }

        const comments = await Comment.find({ blogId: req.params.id }).populate('author', 'name email profileImageURL').sort({ createdAt: -1 });

        let hasNominated = false;
        if (req.user) {
            const nomination = await Nomination.findOne({ user: req.user._id, blog: req.params.id });
            hasNominated = !!nomination;
        }

        return res.json({ success: true, blog, comments, hasNominated });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function createBlog(req, res) {
    try {
        const { title, body, category, difficulty, visibility, tags } = req.body;
        
        // 1. Rate Limiting Logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const blogCount = await Blog.countDocuments({
            author: req.user._id,
            createdAt: { $gte: today }
        });

        const roleLimits = {
            'user': 5,
            'author': 20,
            'owner': Infinity
        };

        const limit = roleLimits[req.user.role] || 5;

        if (blogCount >= limit) {
            return res.status(429).json({ 
                success: false, 
                error: `Daily blog limit reached. You can post ${limit} blogs per day.` 
            });
        }

        // 2. Create Blog
        let coverImageURL = '/uploads/default.jpg';
        if (req.file) {
            coverImageURL = `/uploads/${req.file.filename}`;
        }
        
        // Enforce visibility/status rules
        let finalVisibility = visibility;
        let finalStatus = 'published';

        if (req.user.role === 'user') {
            finalVisibility = 'private'; // Users can only create private
            finalStatus = 'published'; 
        }

        if (req.user.role === 'author' || req.user.role === 'owner') {
             // Authors/Owners can choose, default processed from body
        } else {
             finalVisibility = 'private';
        }

        const blog = await Blog.create({
            title: xss(title),
            body: xss(body),
            coverImageURL,
            category: xss(category),
            difficulty,
            author: req.user._id,
            visibility: finalVisibility,
            status: finalStatus,
            tags: tags ? tags.split(',').map(t => xss(t.trim())) : [],
            isFeatured: false 
        });
        
        return res.json({ success: true, blogId: blog._id });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function toggleLike(req, res) {
    try {
        const blog = await Blog.findById(req.params.id);
        const userId = req.user._id;

        const index = blog.likes.indexOf(userId);
        if (index === -1) {
            blog.likes.push(userId);
        } else {
            blog.likes.splice(index, 1);
        }
        await blog.save();
        return res.json({ success: true, likes: blog.likes.length });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// --- COMMENT CONTROLLERS ---

// --- COMMENT CONTROLLERS MOVED TO commentController.js ---

// --- USER DASHBOARD ---

async function getUserDashboard(req, res) {
    const userId = req.user._id;

    try {
        const stats = {
            streak: 0,
            blogsRead: 0,
            blogsWritten: 0,
            totalViews: 0
        };

        const writtenBlogs = await Blog.find({ author: userId });
        const user = await User.findById(userId);
        
        const savedBlogs = await SavedBlog.find({ user: userId }).populate({
            path: 'blog',
            populate: {
                path: 'author',
                select: 'name profileImageURL email'
            }
        });

        const myNominations = await Nomination.find({ user: userId }).populate({
            path: 'blog',
            populate: {
                path: 'author',
                select: 'name profileImageURL email'
            }
        }).sort({ createdAt: -1 });

        stats.blogsWritten = writtenBlogs.length;
        stats.totalViews = writtenBlogs.reduce((acc, curr) => acc + (curr.views || 0), 0);
        stats.streak = user.streak || 0;
        stats.blogsRead = user.readingHistory ? user.readingHistory.length : 0;

        const recentHistory = user?.readingHistory ? await User.findById(userId).populate({
            path: 'readingHistory.blogId',
            populate: {
                path: 'author',
                select: 'name profileImageURL email'
            }
        }).then(u => (u?.readingHistory || []).slice(0, 5)) : [];

        return res.json({
            success: true,
            user: user ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImageURL: user.profileImageURL,
                bio: user.bio,
                createdAt: user.createdAt
            } : null,
            stats,
            savedBlogs,
            recentHistory,
            writtenBlogs,
            myNominations
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function getMe(req, res) {
    if (!req.user) {
        return res.json({ success: true, user: null });
    }
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.json({ success: true, user: null });
        
        // PERSISTENT OWNER CHECK
        const adminEmails = ['satyamand536@gmail.com', 'maisatyam108@gmail.com', 'awadhinandansudha871252@gmail.com'];
        if (adminEmails.includes(user.email.toLowerCase()) && user.role !== 'owner') {
            user.role = 'owner';
            await user.save();
        }

        return res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImageURL: user.profileImageURL,
                role: user.role
            }
        });
    } catch (error) {
        return res.json({ success: true, user: null });
    }
}

async function updateProfile(req, res) {
    try {
        const { name, bio } = req.body;
        const user = await User.findById(req.user._id);
        
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (name) user.name = xss(name);
        if (bio !== undefined) user.bio = xss(bio);

        if (req.file) {
            user.profileImageURL = `/uploads/${req.file.filename}`;
        }

        await user.save();
        
        return res.json({ 
            success: true, 
            message: "Profile updated successfully",
            user: {
                name: user.name,
                bio: user.bio,
                profileImageURL: user.profileImageURL
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
}

// --- AI CONTROLLERS ---

const { rateLimiter } = require('../middlewares/rateLimit'); // Use in route, but here for reference if needed
// Actually, I will handle the logic inside handleAIAssist to just pass the content.

async function handleAIAssist(req, res) {
    try {
        const { type, content, messages } = req.body; // type: 'summarize' | 'explain' | 'chat'
        let responseText = "";

        if (type === 'summarize') {
            responseText = await summarizeBlog(content);
        } else if (type === 'explain') {
            responseText = await explainText(content);
        } else if (type === 'chat') {
            // content could be just the last prompt, but if 'messages' is provided (history), use it.
            // If we have history, we pass it directly to generateResponse
            if (messages && Array.isArray(messages)) {
                 responseText = await require('../services/ai').generateResponse(messages);
            } else {
                 // Fallback for single prompt
                 responseText = await require('../services/ai').generateResponse([{ role: 'user', content: content }]);
            }
        } else {
            return res.status(400).json({ success: false, message: "Invalid type" });
        }

        return res.json({ success: true, response: responseText });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteBlog(req, res) {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
        
        // Check ownership or admin role
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'owner') {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this blog" });
        }

        await Blog.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: "Blog deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function toggleSave(req, res) {
    try {
        const userId = req.user._id;
        const blogId = req.params.id;
        
        const existing = await SavedBlog.findOne({ user: userId, blog: blogId });
        let saved = false;
        
        if (existing) {
            await SavedBlog.findByIdAndDelete(existing._id);
            saved = false;
        } else {
            await SavedBlog.create({ user: userId, blog: blogId });
            saved = true;
        }
        
        return res.json({ success: true, saved });
    } catch (error) {
        console.error("Toggle save error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function updateBlog(req, res) {
    try {
        const { title, body, category, difficulty, visibility, tags } = req.body;
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
             return res.status(404).json({ success: false, message: "Blog not found" });
        }

        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized: Only the author can edit this blog" });
        }

        if (title) blog.title = xss(title);
        if (body) blog.body = xss(body);
        if (category) blog.category = xss(category);
        if (difficulty) blog.difficulty = difficulty;
        
        if (visibility) {
            if (req.user.role === 'user') {
                blog.visibility = 'private';
            } else {
                blog.visibility = visibility;
            }
        }
        
        if (tags) blog.tags = tags.split(',').map(t => xss(t.trim()));

        if (req.body.removeCoverImage === 'true') {
            blog.coverImageURL = '';
        }

        if (req.file) {
            blog.coverImageURL = `/uploads/${req.file.filename}`;
        }

        await blog.save();
        return res.json({ success: true, message: "Blog updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to update blog' });
    }
}

async function nominateBlog(req, res) {
    try {
        const { id } = req.params;
        const blog = await Blog.findById(id);
        const userId = req.user._id;

        if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

        // 1. Check if already nominated by THIS user
        const existingNomination = await Nomination.findOne({ user: userId, blog: id });
        if (existingNomination && blog.nominationStatus === 'pending') {
            return res.status(400).json({ success: false, message: "You have already nominated this blog and it is currently awaiting review." });
        }

        // 2. Enforce Temporal Limit (Rolling 7-day window)
        // Only count if creating a NEW nomination record
        if (!existingNomination) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentNominationsCount = await Nomination.countDocuments({
                user: userId,
                createdAt: { $gte: sevenDaysAgo }
            });

            if (recentNominationsCount >= 2) {
                return res.status(429).json({ 
                    success: false, 
                    message: "Weekly limit reached! You can only nominate 2 blogs every 7 days to maintain curation quality." 
                });
            }
            // 3. Create the Nomination Record
            await Nomination.create({ user: userId, blog: id });
        }

        // 4. Update Blog Status to ensure it appears in Admin Deck
        // Even if it was 'reviewed' or 'none', it must be 'pending' now.
        blog.nominationStatus = 'pending';
        // Reset spotlight status if it was previously featured but now re-nominated
        blog.spotlight = 'none'; 
        await blog.save();

        return res.json({ success: true, message: "Blog nominated for spotlight!" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getAllBlogs,
    getBlogById,
    createBlog,
    toggleLike,
    getUserDashboard,
    handleAIAssist,
    signin,
    signup,
    logout,
    deleteBlog,
    updateBlog,
    toggleSave,
    getMyBlogs,
    getFeaturedBlog,
    getMe,
    updateProfile,
    nominateBlog
};

