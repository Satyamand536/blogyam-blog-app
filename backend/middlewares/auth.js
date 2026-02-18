//this middleware will check every request and response

const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
  return async (req, res, next) => {
    // RESOLVE COOKIE NAME: Use stealth name in production
    const activeCookieName = process.env.NODE_ENV === 'production' ? "__Host-session_auth" : (cookieName || "token");
    const tokenCookieValue = req.cookies[activeCookieName];
    
    if (!tokenCookieValue) {
      return next();
    }

    try {
      // Decrypt cookie value (Obfuscation layer)
      const { decryptCookie, encryptCookie } = require('../services/encryption');
      const decryptedToken = decryptCookie(tokenCookieValue);
      
      const payload = validateToken(decryptedToken);
      
      const User = require('../models/user');
      const user = await User.findById(payload._id);
      if (user) {
        req.user = user;
      }

      // AUTO-MIGRATE LEGACY TOKENS:
      // If the token was NOT encrypted (decrypted === original), encrypt it now
      if (decryptedToken === tokenCookieValue) {
        const encryptedNewCookie = encryptCookie(decryptedToken);
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000
        };
        res.cookie(activeCookieName, encryptedNewCookie, cookieOptions);
        console.log(`[Security] Migrated legacy token for user ${user._id} to encrypted format`);
      }
    } catch (error) {
      console.error('Auth error:', error.message);
    }
    next();
  };
}

function restrictToLoggedinUserOnly(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            error: "Authentication required. Please login to access this resource." 
        });
    }
    return next();
}

module.exports={
    checkForAuthenticationCookie,
    restrictToLoggedinUserOnly
}