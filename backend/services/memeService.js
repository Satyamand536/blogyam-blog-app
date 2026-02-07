/**
 * Meme Service with Circuit Breaker
 * Handles Imgflip API calls with production-grade error handling
 */

const CircuitBreaker = require('../utils/CircuitBreaker');
const logger = require('../utils/logger');

// Create circuit breaker for Imgflip API
const memeCircuitBreaker = new CircuitBreaker({
    name: 'ImgflipAPI',
    failureThreshold: 5,
    timeout: 8000,
    resetTimeout: 60000 // 1 minute
});

// Static fallback memes in case API fails
const FALLBACK_MEMES = [
    {
        id: 'fallback-1',
        name: 'Drake Hotline Bling',
        url: 'https://i.imgflip.com/30b1gx.jpg',
        width: 1200,
        height: 1200,
        box_count: 2
    },
    {
        id: 'fallback-2',
        name: 'Distracted Boyfriend',
        url: 'https://i.imgflip.com/1ur9b0.jpg',
        width: 1200,
        height: 800,
        box_count: 3
    },
    {
        id: 'fallback-3',
        name: 'One Does Not Simply',
        url: 'https://i.imgflip.com/1bij.jpg',
        width: 568,
        height: 335,
        box_count: 2
    },
    {
        id: 'fallback-4',
        name: 'Mocking Spongebob',
        url: 'https://i.imgflip.com/1otk96.jpg',
        width: 502,
        height: 353,
        box_count: 2
    }
];

async function getMemes() {
    try {
        return await memeCircuitBreaker.execute(async () => {
            const response = await fetch('https://api.imgflip.com/get_memes', {
                signal: AbortSignal.timeout(7000) // 7 second timeout
            });

            if (!response.ok) {
                throw new Error(`Imgflip API returned status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error('Imgflip API returned unsuccessful response');
            }

            logger.info('Successfully fetched memes from Imgflip API', {
                count: data.data.memes.length
            });

            return {
                success: true,
                memes: data.data.memes,
                source: 'imgflip'
            };
        });
    } catch (error) {
        // Check if circuit is open
        if (error.code === 'CIRCUIT_OPEN') {
            logger.warn('Meme circuit breaker is OPEN, using fallback memes');
            return {
                success: true,
                memes: FALLBACK_MEMES,
                source: 'fallback',
                message: 'Using cached memes (API temporarily unavailable)'
            };
        }

        logger.error('Error fetching memes', {
            error: error.message,
            source: 'ImgflipAPI'
        });

        // Return fallback memes on any error
        return {
            success: true,
            memes: FALLBACK_MEMES,
            source: 'fallback',
            message: 'Using fallback memes due to API error'
        };
    }
}

function getCircuitBreakerStatus() {
    return memeCircuitBreaker.getState();
}

module.exports = {
    getMemes,
    getCircuitBreakerStatus
};
