/**
 * ZenQuotes API Adapter
 * https://zenquotes.io/api/random
 * Motivational quotes with good author attribution
 */

const INDIAN_AUTHORS = new Set([
    'Mahatma Gandhi', 'Swami Vivekananda', 'Rabindranath Tagore', 
    'APJ Abdul Kalam', 'Mother Teresa', 'Chanakya', 'Buddha',
    'Guru Nanak', 'Rumi', 'Kabir', 'Sadhguru', 'Sri Aurobindo'
]);

async function fetchQuote(category = null) {
    try {
        // ZenQuotes doesn't support category filtering, but provides high-quality quotes
        const url = 'https://zenquotes.io/api/random';

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`ZenQuotes API error: ${response.status}`);

        const data = await response.json();
        const quote = data[0]; // Returns array with one element

        // Infer tags based on content keywords
        const tags = inferTags(quote.q, category);

        return {
            text: quote.q,
            author: quote.a,
            author_origin: INDIAN_AUTHORS.has(quote.a) ? 'Indian' : 'Non-Indian',
            tags: tags,
            source: 'zenquotes'
        };
    } catch (error) {
        // Silently fail - the QuotesAggregator will handle fallbacks
        if (!error.message.includes('fetch failed') && !error.name.includes('AbortError')) {
            console.error('ZenQuotes adapter error:', error.message);
        }
        return null;
    }
}

function inferTags(quoteText, category) {
    const tags = [];
    const text = quoteText.toLowerCase();

    if (category) {
        tags.push(category.toLowerCase());
    }

    // Keyword-based tag inference
    if (text.includes('life') || text.includes('live')) tags.push('life');
    if (text.includes('wisdom') || text.includes('wise')) tags.push('wisdom');
    if (text.includes('knowledge') || text.includes('learn')) tags.push('knowledge');
    if (text.includes('write') || text.includes('book')) tags.push('writing');
    if (text.includes('philosophy') || text.includes('think')) tags.push('philosophy');

    return tags.length > 0 ? tags : ['inspirational'];
}

module.exports = { fetchQuote };
