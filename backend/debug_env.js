
require('dotenv').config();
console.log('--- CLOUDINARY CONFIG DEBUG ---');
console.log(`Cloud Name: "${process.env.CLOUDINARY_CLOUD_NAME}"`);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Present (Starts with ' + process.env.CLOUDINARY_API_KEY.substring(0, 3) + ')' : 'MISSING');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'MISSING');
