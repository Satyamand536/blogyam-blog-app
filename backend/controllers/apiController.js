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
    let { email, password } = req.body;
    
    // RSA Decryption (Transport Security - Hidden from Network Panel)
    const { decryptPassword } = require('../services/encryption');
    
    if (password && password.length > 100) {
        try {
            const decrypted = decryptPassword(password);
            if (!decrypted) throw new Error('Decryption failed');
            password = decrypted;
        } catch (decryptError) {
            console.error('[Auth FAIL] Decryption failed:', decryptError.message);
            return res.status(400).json({ 
                success: false, 
                error: 'Security Handshake Failed. Please refresh the page.' 
            });
        }
    }

    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password required" });
    }

    try {
        const normalizedEmail = email.toLowerCase();
        
        // Find user
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Incorrect Email or Password' });
        }

        const token = await User.matchPasswordAndGenerateToken(normalizedEmail, password);
        
        // Encrypt token for cookie (Obfuscation)
        const { encryptCookie } = require('../services/encryption');
        const encryptedToken = encryptCookie(token);
        
        // OWNER OVERRIDE
        const adminEmails = ['satyamand536@gmail.com', 'maisatyam108@gmail.com', 'awadhinandansudha871252@gmail.com'];
        if (adminEmails.includes(normalizedEmail) && user.role !== 'owner') {
            user.role = 'owner';
            await user.save();
        }

        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageURL: user.profileImageURL,
            role: user.role
        };

        const cookieName = process.env.NODE_ENV === 'production' ? "__Host-session_auth" : "token";
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax', 
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        };

        return res.cookie(cookieName, encryptedToken, cookieOptions).json({ 
            success: true, 
            message: "Signin successful",
            user: userData 
        });
    } catch (error) {
        console.error(`[Signin Error]:`, error.message);
        return res.status(401).json({ success: false, error: 'Incorrect Email or Password' });
    }
}

async function signup(req, res) {
    let { name, email, password } = req.body;
    
    // RSA Decryption
    const { decryptPassword } = require('../services/encryption');
    
    if (password && password.length > 100) {
        try {
            const decrypted = decryptPassword(password);
            if (!decrypted) throw new Error('Decryption failed');
            password = decrypted;
        } catch (decryptError) {
            console.error('[Signup FAIL] Decryption failed:', decryptError.message);
            return res.status(400).json({ success: false, error: 'Security Handshake Failed.' });
        }
    }

    // Validation Regex (from user snippet)
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: "All fields required" });
    }

    if (name.trim().length < 3) {
        return res.status(400).json({ success: false, error: "Full name must be at least 3 characters" });
    }

    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            error: "Password must be 8+ chars, include uppercase, lowercase, number & special char"
        });
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedPassword = password.toLowerCase();

    // ⛔ BLOCKED PATTERNS
    if (normalizedEmail.includes("testuser") || name.toLowerCase().includes("testuser")) {
        return res.status(400).json({ success: false, error: "Registration with 'testuser' patterns is not allowed." });
    }
    if (normalizedPassword === "password@123") {
        return res.status(400).json({ success: false, error: "This password is too common and not allowed." });
    }

    try {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) return res.status(400).json({ success: false, error: "User already exists" });

        const user = await User.create({ name, email: normalizedEmail, password });
        
        return res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (error) {
        console.error('[Signup Error]:', error);
        return res.status(500).json({ success: false, error: "Registration failed" });
    }
}

async function logout(req, res) {
    const cookieName = process.env.NODE_ENV === 'production' ? "__Host-session_auth" : "token";
    
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
        path: '/'
    };
    res.clearCookie(cookieName, cookieOptions).json({ success: true, message: "Logged out" });
}

async function checkEmail(req, res) {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, error: "Email required" });
        
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(email)) return res.status(400).json({ success: false, error: "Invalid email format" });

        const user = await User.findOne({ email: email.toLowerCase() });
        res.json({ success: true, exists: !!user });
    } catch (err) {
        console.error("Email check error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
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

        if (res.headersSent) return;
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

        if (res.headersSent) return;
        return res.json({ 
            success: true, 
            ...data,
            // Fallback for current frontend which expects 'blog' property
            blog: data.bestOfWeek || data.featured[0] || null 
        });
    } catch (error) {
        if (res.headersSent) return;
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

        if (res.headersSent) return;
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

        if (res.headersSent) return;
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

        if (res.headersSent) return;

        // 2. Create Blog
        let coverImageURL = '/uploads/default.jpg';
        if (req.file) {
            // Cloudinary returns full URL in path, local multer returns filename
            // FIX: Prioritize secure_url from Cloudinary response
            coverImageURL = req.file.secure_url || req.file.url || req.file.path || `/uploads/${req.file.filename}`;
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
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')).map(t => xss(t.trim())) : [],
            isFeatured: false 
        });
        
        console.log(`✅ Blog Created Successfully: ${blog._id}`, {
            coverImageURL: blog.coverImageURL,
            title: blog.title,
            author: req.user._id
        });
        
        
        if (res.headersSent) return;
        return res.json({ success: true, blogId: blog._id });
    } catch (error) {
        console.error("Create Blog Backend Error:", {
            message: error.message,
            stack: error.stack,
            body: req.body,
            file: req.file ? {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                path: req.file.path
            } : 'No file'
        });
        return res.status(500).json({ success: false, error: error.message || "Failed to create blog" });
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
        if (res.headersSent) return;
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

        if (res.headersSent) return;
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

        
        if (res.headersSent) return;
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

        // AI service always returns a string (either success or error message)
        // No need to check for errors, just return the response
        if (!res.headersSent) {
            return res.json({ success: true, response: responseText });
        }
    } catch (error) {
        console.error('[AI Controller] Error:', error);
        if (!res.headersSent) {
            return res.status(503).json({ 
                success: false, 
                error: "AI service is temporarily unavailable. Please try again." 
            });
        }
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
        
        if (tags) {
            blog.tags = (Array.isArray(tags) ? tags : tags.split(',')).map(t => xss(t.trim()));
        }

        if (req.body.removeCoverImage === 'true') {
            blog.coverImageURL = '';
        }

        if (req.file) {
            // FIX: Prioritize secure_url from Cloudinary response
            blog.coverImageURL = req.file.secure_url || req.file.url || req.file.path || `/uploads/${req.file.filename}`;
        }

        await blog.save();
        console.log(`✅ Blog Updated Successfully: ${blog._id}`, {
            coverImageURL: blog.coverImageURL,
            title: blog.title,
            author: req.user._id
        });
        if (res.headersSent) return;
        return res.json({ success: true, message: "Blog updated successfully" });
    } catch (error) {
        console.error("Update Blog Backend Error:", {
            message: error.message,
            stack: error.stack,
            blogId: req.params.id,
            body: req.body
        });
        return res.status(500).json({ success: false, error: error.message || 'Failed to update blog' });
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
    checkEmail,
    deleteBlog,
    updateBlog,
    toggleSave,
    getMyBlogs,
    getFeaturedBlog,
    getMe,
    updateProfile,
    nominateBlog
};

