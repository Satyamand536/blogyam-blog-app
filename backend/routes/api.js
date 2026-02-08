const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const router = Router();
const { 
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
} = require('../controllers/apiController');

const { 
    getUsers, 
    makeAuthor, 
    removeAuthor, 
    getSpotlightQueue,
    getActiveSpotlight,
    setBlogSpotlight,
    getAuthors,
    getAuthorPublicBlogs
} = require('../controllers/adminController');

const { addComment, reportComment, updateComment } = require('../controllers/commentController');

const { requireOwner, requireAuthorOrOwner, requireRole } = require('../middlewares/roles');

// Cloudinary Setup
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage: storage });

// Auth Routes
router.post('/signin', signin);
router.post('/signup', signup);
router.post('/logout', logout);

// Public Routes
router.get('/blogs', getAllBlogs);
router.get('/blogs/featured', getFeaturedBlog);
router.get('/blogs/:id', getBlogById);
router.get('/authors', getAuthors);
router.get('/authors/:id/blogs', getAuthorPublicBlogs);

// Import Security Layer
const { checkModeration, restrictCommentFrequency } = require('../middlewares/moderation');

// Apply Global Moderation Shield (Screen all protected & public interactions)
router.use(checkModeration);

// Protected Routes (auth middleware in app.js applies to all?)
// We will assume authentication middleware is handled at app level or needs to be applied here.
// For now, let's assume `req.user` is populated if logged in.
// We should probably explicitly import middleware if we were being very strict, but `app.js` has `app.use(checkForAuthenticationCookie("token"))`.
// However, that middleware usually just sets req.user if valid. To PROTECT routes, we likely need a `restrictToLoggedinUserOnly` middleware equivalent for API.

// Debug Middleware for API routes
router.use((req, res, next) => {
    console.log(`[API Request]: ${req.method} ${req.url}`);
    next();
});

const { checkForAuthenticationCookie, restrictToLoggedinUserOnly } = require('../middlewares/auth');

router.post('/blogs', restrictToLoggedinUserOnly, upload.single('coverImage'), createBlog);
router.patch('/blogs/:id', restrictToLoggedinUserOnly, upload.single('coverImage'), updateBlog);
router.put('/blogs/:id', restrictToLoggedinUserOnly, upload.single('coverImage'), updateBlog); // Added PUT as fallback
router.delete('/blogs/:id', restrictToLoggedinUserOnly, deleteBlog);
router.post('/blogs/:id/like', restrictToLoggedinUserOnly, toggleLike);
router.post('/blogs/:id/save', restrictToLoggedinUserOnly, toggleSave);
router.post('/blogs/:id/nominate', restrictToLoggedinUserOnly, nominateBlog);
router.post('/blogs/:blogId/comment', restrictToLoggedinUserOnly, addComment);

router.get('/user/me', getMe);
router.get('/user/dashboard', restrictToLoggedinUserOnly, getUserDashboard);
router.get('/user/blogs', restrictToLoggedinUserOnly, getMyBlogs);
router.patch('/user/profile', restrictToLoggedinUserOnly, upload.single('profileImage'), updateProfile);

const { rateLimiter, memeRateLimiter } = require('../middlewares/rateLimit');
const { getQuotes, getDailyQuote, getStats } = require('../controllers/quotesController');
const { quotesLimiter, dailyQuoteLimiter, statsLimiter } = require('../middlewares/quotesRateLimit');

const { getTemplates, incrementPopularity, getStats: getMemeStats } = require('../controllers/memeController');

router.post('/ai/assist', rateLimiter, handleAIAssist);

// Quotes Routes (with rate limiting)
router.get('/quotes/daily', dailyQuoteLimiter, getDailyQuote);
router.get('/quotes', quotesLimiter, getQuotes);
router.get('/quotes/stats', statsLimiter, getStats);

// Meme Routes (Database-first)
router.get('/memes/templates', memeRateLimiter, getTemplates);
router.post('/memes/templates/:id/popularity', memeRateLimiter, incrementPopularity);
router.get('/memes/stats', getMemeStats);

// --- ADMIN ROUTES (Owner Only) ---
router.get('/admin/users', requireOwner, getUsers);
router.patch('/admin/make-author/:id', requireOwner, makeAuthor);
router.patch('/admin/remove-author/:id', requireOwner, removeAuthor);
router.get('/admin/spotlight-queue', requireOwner, getSpotlightQueue);
router.get('/admin/active-spotlight', requireOwner, getActiveSpotlight);
router.patch('/admin/spotlight/:id', requireOwner, setBlogSpotlight);

// --- MODERATION & ABUSE PREVENTION ---
router.patch('/comments/:id', restrictToLoggedinUserOnly, updateComment);
router.post('/comments/:id/report', restrictToLoggedinUserOnly, reportComment);

// Admin Moderation Tools
router.post('/admin/ban-user/:id', requireOwner, (req, res) => {
    const { banUser } = require('../controllers/adminController');
    return banUser(req, res);
});
router.post('/admin/blacklist-ip', requireOwner, (req, res) => {
    const { blacklistIP } = require('../controllers/adminController');
    return blacklistIP(req, res);
});
router.post('/admin/blacklist-email', requireOwner, (req, res) => {
    const { blacklistEmail } = require('../controllers/adminController');
    return blacklistEmail(req, res);
});

router.get('/admin/reports', requireOwner, (req, res) => {
    const { getReports } = require('../controllers/adminController');
    return getReports(req, res);
});

router.patch('/admin/reports/:id/dismiss', requireOwner, (req, res) => {
    const { dismissReport } = require('../controllers/adminController');
    return dismissReport(req, res);
});

// Health Checks (Internally protected by requireOwner for metrics)
const healthRoutes = require('./health');
router.use('/system', healthRoutes); // e.g., /api/system/health, /api/system/metrics

module.exports = router;
