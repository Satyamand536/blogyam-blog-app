/**
 * Download Meme Templates for Production Resilience
 * Downloads 10 core templates to local storage
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const MEME_DIR = path.join(__dirname, '..', 'public', 'images', 'memes');

// core templates to download
const TEMPLATES = [
    { name: 'drake', url: 'https://i.imgflip.com/30b1gx.jpg' },
    { name: 'distracted_boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg' },
    { name: 'two_buttons', url: 'https://i.imgflip.com/1g8my4.jpg' },
    { name: 'change_my_mind', url: 'https://i.imgflip.com/24y43o.jpg' },
    { name: 'batman_slapping_robin', url: 'https://i.imgflip.com/9ehk.jpg' },
    { name: 'success_kid', url: 'https://i.imgflip.com/1bip.jpg' },
    { name: 'expanding_brain', url: 'https://i.imgflip.com/1jwhww.jpg' },
    { name: 'one_does_not_simply', url: 'https://i.imgflip.com/1bij.jpg' },
    { name: 'grumpy_cat', url: 'https://i.imgflip.com/8p0a.jpg' },
    { name: 'disaster_girl', url: 'https://i.imgflip.com/23ls.jpg' }
];

async function downloadTemplates() {
    if (!fs.existsSync(MEME_DIR)) {
        fs.mkdirSync(MEME_DIR, { recursive: true });
    }

    console.log(`🚀 Starting download of ${TEMPLATES.length} templates to ${MEME_DIR}...`);

    for (const template of TEMPLATES) {
        const filePath = path.join(MEME_DIR, `${template.name}.jpg`);
        
        try {
            console.log(`Downloading: ${template.name}...`);
            const response = await axios({
                url: template.url,
                method: 'GET',
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`✅ Saved: ${template.name}.jpg`);
        } catch (error) {
            console.error(`❌ Failed to download ${template.name}:`, error.message);
        }
    }

    console.log('\n✨ Download complete!');
}

downloadTemplates();
