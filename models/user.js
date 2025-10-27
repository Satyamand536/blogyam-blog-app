const {Schema,model}=require('mongoose');
const { createHmac,randomBytes } = require('crypto');
const { createTokenForUser } = require('../services/authentication');
const userSchema=new Schema({
    fullName:{
        type:'String',
        required:true,

    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    salt:{
        type:String,
        
    },
    password:{
        type:String,
        required:true,
        unique:true,
    },
    profileImageURL:{
        type:String,
        default:'/images/hacker.png'
    },
    role:{
        type:String,
        enum:['USER','ADMIN'],
        default:'USER',
    },

},{timestamps:true});

//jab bhi hum userschema ko save krne lagenge to hmare paas next function aayega to
userSchema.pre('save',function (next){
    const user=this;//user ko le rhe hain then 
    if(!user.isModified('password')) return;

    const salt=randomBytes(16).toString();
    const hashedPassword=createHmac('sha256',salt)//createhmac hepls to hash the paasword, sha is algo
    .update(user.password)
    .digest('hex');//give us in hex form

    this.salt=salt;
    this.password=hashedPassword;

    next();

})

//to ise krna se ye fayda hoga ki jab hum user ko save krne ka try karenge to ye function run krega aur user ke paasword ko hash krega.

userSchema.static('matchPasswordAndGenerateToken',async function(email,password){
    const user=await this.findOne({email});
    if(!user) throw new Error('User not found!');
console.log(user);
    const salt=user.salt;
    const hashedPassword=user.password;

    const userProvidedHash=createHmac('sha256',salt)
    .update(password)
    .digest('hex');
    if(hashedPassword!==userProvidedHash)
        throw new Error('incorrect password');

    const token=createTokenForUser(user);
    return token;

})

const User=model('user',userSchema);
module.exports=User;