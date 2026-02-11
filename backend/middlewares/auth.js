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
            const userPayload=validateToken(tokenCookieValue);
            req.user=userPayload;
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