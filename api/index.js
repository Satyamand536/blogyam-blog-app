const app = require('./backend/app');

// Vercel Serverless Adapter
// Strips /api prefix since Express app expects routes at /api internally
module.exports = (req, res) => {
    // Vercel routes /api/* to this function
    // But our Express app mounts routes at /api
    // So we need to preserve the /api prefix in the URL
    req.url = `/api${req.url}`;
    return app(req, res);
};

