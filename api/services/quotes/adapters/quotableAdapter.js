/**
 * Quotable API Adapter
 * https://api.quotable.io/random
 * High-quality, well-attributed quotes
 * Now with Circuit Breaker for production resilience
 */

const CircuitBreaker = require('../../../utils/CircuitBreaker');

const INDIAN_AUTHORS = new Set([
    'Mahatma Gandhi', 'Swami Vivekananda', 'Rabindranath Tagore', 
    'APJ Abdul Kalam', 'Mother Teresa', 'Chanakya', 'Buddha',
    'Guru Nanak', 'Rumi', 'Kabir', 'Sadhguru', 'Sri Aurobindo'
]);

// Create circuit breaker for this adapter
const circuitBreaker = new CircuitBreaker({
    name: 'QuotableAPI',
    failureThreshold: 3,
    timeout: 5000,
    resetTimeout: 30000
});

async function fetchQuote(category = null) {
    try {
        return await circuitBreaker.execute(async () => {
            let url = 'https://api.quotable.io/random';
            
            // Map categories to Quotable tags
            const tagMap = {
                'Wisdom': 'wisdom',
                'Knowledge': 'education,wisdom',
                'Life': 'life,inspirational',
                'Writing': 'famous-quotes',
                'Philosophy': 'philosophy,wisdom'
            };

            if (category && tagMap[category]) {
                url += `?tags=${tagMap[category]}`;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`Quotable API error: ${response.status}`);

            const data = await response.json();

            return {
                text: data.content,
                author: data.author,
                author_origin: INDIAN_AUTHORS.has(data.author) ? 'Indian' : 'Non-Indian',
                tags: data.tags || [],
                source: 'quotable'
            };
        });
    } catch (error) {
        // Silently fail - the QuotesAggregator will handle fallbacks
        // Only log if it's not a network/timeout error or circuit breaker
        if (!error.message.includes('fetch failed') && 
            !error.name.includes('AbortError') && 
            error.code !== 'CIRCUIT_OPEN') {
            console.error('Quotable adapter error:', error.message);
        }
        return null;
    }
}

module.exports = { fetchQuote, circuitBreaker };
