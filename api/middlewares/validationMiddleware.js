const { validateAuthData } = require('../services/validationService');

const validateSignup = (req, res, next) => {
    const { name, email, password } = req.body;
    const { isValid, errors } = validateAuthData({ name, email, password }, true);

    if (!isValid) {
        // Check if request is from API or EJS
        if (req.path.includes('/api/')) {
            return res.status(400).json({ success: false, errors });
        }
        // For EJS routes
        return res.render('signup', {
            error: errors[0] // Show the first error
        });
    }
    next();
};

const validateSignin = (req, res, next) => {
    const { email, password } = req.body;
    const { isValid, errors } = validateAuthData({ email, password }, false);

    if (!isValid) {
        if (req.path.includes('/api/')) {
            return res.status(400).json({ success: false, errors });
        }
        return res.render('signin', {
            error: errors[0]
        });
    }
    next();
};

module.exports = {
    validateSignup,
    validateSignin
};
