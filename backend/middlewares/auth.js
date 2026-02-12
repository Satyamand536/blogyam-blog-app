//this middleware will check every request and response

const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName){
    return (req,res,next)=>{
        // ENTERPRISE HARDENING: Dynamically resolve cookie name for stealth
        const activeCookieName = process.env.NODE_ENV === 'production' ? "__Host-session_auth" : (cookieName || "token");
        const tokenCookieValue = req.cookies[activeCookieName];

        if(!tokenCookieValue){
            return next();
        }
        try {
            // Decrypt cookie value (Obfuscation)
            const { decryptCookie, encryptCookie } = require('../services/encryption');
            const decryptedToken = decryptCookie(tokenCookieValue);
            
            const userPayload=validateToken(decryptedToken);
            req.user=userPayload;

            // AUTO-MIGRATE LEGACY TOKENS:
            // If the token was NOT encrypted (decrypted === original), we must encrypt it now
            // and update the cookie to ensure "old users" also get hidden tokens immediately.
            if (decryptedToken === tokenCookieValue) {
                const encryptedNewCookie = encryptCookie(decryptedToken);
                
                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
                    path: '/',
                    maxAge: 7 * 24 * 60 * 60 * 1000
                };

                // Update the cookie securely on the fly
                res.cookie(activeCookieName, encryptedNewCookie, cookieOptions);
                console.log(`[Security] Automatically migrated legacy token for user ${userPayload._id} to encrypted format`);
            }
        }
        catch (error) {
            // Silently fail if token is invalid, req.user remains undefined
        };
        return next()
    }
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