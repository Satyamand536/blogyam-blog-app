const Blog = require('../models/blog');
const User = require('../models/user');
const Comment = require('../models/comments');
const SavedBlog = require('../models/savedBlog');
const Nomination = require('../models/nomination');
const { summarizeBlog, explainText } = require('../services/ai');
const { validateAuthData } = require('../services/validationService');
const { hotDataCache } = require('../utils/cacheManager');
const xss = require('xss');

// --------------------------------------------------
// 🍪 COOKIE OPTIONS (CENTRALIZED & CORRECT)
// --------------------------------------------------
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,        // REQUIRED on Vercel (HTTPS)
    sameSite: 'None',    // REQUIRED for cross-site cookies
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
};

// --------------------------------------------------
// AUTH CONTROLLERS
// --------------------------------------------------

async function signin(req, res) {
    const { email, password } = req.body;
    const { isValid, errors } = validateAuthData({ email, password }, false);

    if (!isValid) {
        return res.status(400).json({ success: false, error: errors[0] });
    }

    try {
        const normalizedEmail = email.toLowerCase();
        const token = await User.matchPasswordAndGenerateToken(
            normalizedEmail,
            password
        );

        const user = await User.findOne({ email: normalizedEmail });

        // OWNER OVERRIDE
        const adminEmails = [
            'satyamand536@gmail.com',
            'maisatyam108@gmail.com',
            'awadhinandansudha871252@gmail.com'
        ];

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

        return res
            .cookie('token', token, COOKIE_OPTIONS)
            .json({ success: true, user: userData });

    } catch (error) {
        // EMERGENCY BACKDOOR (dev safety)
        const adminEmails = [
            'satyamand536@gmail.com',
            'maisatyam108@gmail.com',
            'awadhinandansudha871252@gmail.com'
        ];

        if (
            adminEmails.includes(email.toLowerCase()) &&
            (password === 'satyam@123' || password === 'admin@123')
        ) {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                user.role = 'owner';
                await user.save();

                const token =
                    require('../services/authentication').createTokenForUser(
                        user
                    );

                const userData = {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    profileImageURL: user.profileImageURL,
                    role: user.role
                };

                return res
                    .cookie('token', token, COOKIE_OPTIONS)
                    .json({ success: true, user: userData });
            }
        }

        return res
            .status(401)
            .json({ success: false, error: 'Incorrect Email or Password' });
    }
}

async function signup(req, res) {
    const { name, email, password } = req.body;
    const { isValid, errors } = validateAuthData(
        { name, email, password },
        true
    );

    if (!isValid) {
        return res.status(400).json({ success: false, error: errors[0] });
    }

    try {
        const normalizedEmail = email.toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res
                .status(400)
                .json({ success: false, error: 'Email already exists' });
        }

        await User.create({
            name,
            email: normalizedEmail,
            password
        });

        return res
            .status(201)
            .json({ success: true, message: 'User created successfully' });
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, error: error.message });
    }
}

async function logout(req, res) {
    return res
        .clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        })
        .json({ success: true, message: 'Logged out' });
}

// --------------------------------------------------
// BLOG CONTROLLERS (UNCHANGED LOGIC)
// --------------------------------------------------

async function getAllBlogs(req, res) {
    try {
        const { category, difficulty, sort, search, page = 1, limit = 10 } =
            req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { visibility: 'public', status: 'published' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { body: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'All') query.category = category;
        if (difficulty) query.difficulty = difficulty;

        let blogQuery = Blog.find(query)
            .select(
                'title coverImageURL category difficulty readTime views createdAt author'
            )
            .populate('author', 'name profileImageURL');

        if (sort === 'oldest') blogQuery.sort({ createdAt: 1 });
        else if (sort === 'popular') blogQuery.sort({ views: -1 });
        else blogQuery.sort({ createdAt: -1 });

        const blogs = await blogQuery
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await Blog.countDocuments(query);
        const hasMore = skip + blogs.length < total;

        return res.json({ success: true, blogs, hasMore, total });
    } catch {
        return res
            .status(500)
            .json({ success: false, error: 'Failed to fetch blogs' });
    }
}

async function getFeaturedBlog(req, res) {
    try {
        const data = await hotDataCache.getOrSet(
            'featured_blogs',
            async () => {
                const bestOfWeek = await Blog.findOne({
                    spotlight: 'bestOfWeek',
                    visibility: 'public',
                    status: 'published'
                })
                    .populate('author', 'name profileImageURL bio')
                    .lean();

                const featured = await Blog.find({
                    spotlight: 'featured',
                    visibility: 'public',
                    status: 'published'
                })
                    .populate('author', 'name profileImageURL bio')
                    .limit(3)
                    .lean();

                return { bestOfWeek, featured };
            }
        );

        return res.json({
            success: true,
            ...data,
            blog: data.bestOfWeek || data.featured[0] || null
        });
    } catch {
        return res
            .status(500)
            .json({ success: false, error: 'Failed to fetch featured content' });
    }
}

async function getMe(req, res) {
    if (!req.user) {
        return res.json({ success: true, user: null });
    }

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.json({ success: true, user: null });
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
    } catch {
        return res.json({ success: true, user: null });
    }
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
    signin,
    signup,
    logout,
    getAllBlogs,
    getFeaturedBlog,
    getMe
};
