const JWT=require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

function createTokenForUser(user){
    const payload = {
        _id: user._id,
        role: user.role,
    };
const token=JWT.sign(payload,secret);
return token
}
//ye function user object lega aur token return kr dega.

function validateToken(token){
    const payload=JWT.verify(token,secret);
    return payload;
}

module.exports={
    createTokenForUser,
    validateToken,
}