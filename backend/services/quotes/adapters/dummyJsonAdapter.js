/**
 * DummyJSON Quotes Adapter
 * https://dummyjson.com/quotes/random
 * Reliable, fast API with diverse quotes
 */

const INDIAN_AUTHORS = new Set([
    'Mahatma Gandhi', 'Swami Vivekananda', 'Rabindranath Tagore', 
    'APJ Abdul Kalam', 'Mother Teresa', 'Chanakya', 'Buddha',
    'Guru Nanak', 'Rumi', 'Kabir', 'Sadhguru', 'Sri Aurobindo'
]);

async function fetchQuote(category = null) {
    try {
        const url = 'https://dummyjson.com/quotes/random';

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`DummyJSON API error: ${response.status}`);

        const data = await response.json();

        // Infer tags based on category and content
        const tags = inferTags(data.quote, category);

        return {
            text: data.quote,
            author: data.author,
            author_origin: INDIAN_AUTHORS.has(data.author) ? 'Indian' : 'Non-Indian',
            tags: tags,
            source: 'dummyjson'
        };
    } catch (error) {
        // Silently fail - the QuotesAggregator will handle fallbacks
        if (!error.message.includes('fetch failed') && !error.name.includes('AbortError')) {
            console.error('DummyJSON adapter error:', error.message);
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
    if (text.includes('write') || text.includes('book') || text.includes('story')) tags.push('writing');
    if (text.includes('philosophy') || text.includes('think') || text.includes('mind')) tags.push('philosophy');
    if (text.includes('inspire') || text.includes('motivate')) tags.push('inspirational');

    return tags.length > 0 ? tags : ['general'];
}

module.exports = { fetchQuote };
