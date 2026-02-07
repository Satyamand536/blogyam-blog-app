//this middleware will check every request and response

const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName){
    return (req,res,next)=>{
        const tokenCookieValue=req.cookies[cookieName];
        if(!tokenCookieValue){
            return next();
        }
        try {
            const userPayload=validateToken(tokenCookieValue);
            req.user=userPayload;
    }
        catch (error) {
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