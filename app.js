require('dotenv').config();
const path=require('path')
const express=require('express');
const app=express();
const PORT=process.env.PORT||8000;
const mongoose=require('mongoose');
const cookieParser=require('cookie-parser');

const Blog=require('./models/blog');

mongoose.connect(process.env.MONGO_URL)
.then((e)=>console.log('mongodb connected!'));


const userRoute=require('./routes/userRoute');
const blogRoute=require('./routes/blogRoute');
const { checkForAuthenticationCookie } = require('./middlewares/auth');
app.set('view engine','ejs')//set view engine ejs
app.set('views',path.resolve('./views'));//path set ho rha hai.

app.use(express.urlencoded({extended:false}))
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve('./public')))

app.get('/',async(req,res)=>{
    try {
        const allBlogs=await Blog.find({});
    // console.log(allBlogs);
    res.render('home',{
        user:req.user,
        blogs:allBlogs,
    });
    } catch (error) {
        console.error('error fetching blogs',error);
        res.status(500).send('somethong broke!');
    }
    
})

app.use('/user',userRoute);
app.use('/blog',blogRoute);
app.listen(PORT,()=>console.log(`server started at PORT:${PORT}`));