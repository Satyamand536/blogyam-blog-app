const {Router}=require('express');
const router=Router();
const User=require('../models/user');

router.get('/signin',(req,res)=>{
    return res.render('signin');
});

router.get('/signup',(req,res)=>{
    return res.render('signup');
});

router.post('/signin',async(req,res)=>{
    const {email,password}=req.body;
    console.log(email,password)
    try {
        const token=await User.matchPasswordAndGenerateToken(email,password);
         // console.log('token',token);
    return res.cookie("token",token).redirect('/') //iska matlab hai ki user agar sahi password deta hai to humne cookie bnayi aur usko homepage pe redirect kr diya.
    //pehle user ke email aur password ko find krna hoga and
    //purane aur naye salt password ke hashes(hashedpasswords) ko match krna hoga.
    } catch (error) {
        return res.render('signin',{
            error:"incorrect email or password"
        })
    }
    

   
})
router.post('/signup',async(req,res)=>{
    const {fullName,email,password}=req.body;
    await User.create({
        fullName,
        email,
        password
    });
    return res.redirect('/');
})

router.get('/logout',(req,res)=>{
    res.clearCookie('token').redirect('/')
})

module.exports=router;