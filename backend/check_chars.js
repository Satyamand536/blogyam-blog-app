
require('dotenv').config();

const name = process.env.CLOUDINARY_CLOUD_NAME;
console.log(`Value: "${name}"`);
console.log('Length:', name ? name.length : 0);

if (name) {
    console.log('Character Codes:');
    for (let i = 0; i < name.length; i++) {
        console.log(`${i}: '${name[i]}' -> ${name.charCodeAt(i)}`);
    }
}
