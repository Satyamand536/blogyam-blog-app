
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Checking Cloudinary Config...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING');


// Test Upload
cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/sample.jpg", {
    public_id: "test_upload_debug"
}, function(error, result) {
    if (error) {
        console.error('Upload Failed:', error);
    } else {
        console.log('Upload Success:', result);
    }
});
