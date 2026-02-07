/**
 * Type.fit Quotes Adapter
 * https://type.fit/api/quotes
 * Large database of quotes
 */

const INDIAN_AUTHORS = new Set([
    'Mahatma Gandhi', 'Swami Vivekananda', 'Rabindranath Tagore', 
    'APJ Abdul Kalam', 'Mother Teresa', 'Chanakya', 'Buddha',
    'Guru Nanak', 'Rumi', 'Kabir', 'Sadhguru', 'Sri Aurobindo'
]);

let cachedQuotes = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchQuote(category = null) {
    try {
        // Fetch and cache the entire quotes list
        if (!cachedQuotes || Date.now() - cacheTimestamp > CACHE_DURATION) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const response = await fetch('https://type.fit/api/quotes', { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`Type.fit API error: ${response.status}`);

            cachedQuotes = await response.json();
            cacheTimestamp = Date.now();
        }

        // Filter by category if specified
        let filteredQuotes = cachedQuotes;
        if (category) {
            filteredQuotes = cachedQuotes.filter(q => 
                matchesCategory(q.text, category)
            );
            
            // Fallback to all quotes if no matches
            if (filteredQuotes.length === 0) {
                filteredQuotes = cachedQuotes;
            }
        }

        // Get random quote from filtered set
        const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
        const author = randomQuote.author?.replace(', type.fit', '') || 'Unknown';

        const tags = inferTags(randomQuote.text, category);

        return {
            text: randomQuote.text,
            author: author,
            author_origin: INDIAN_AUTHORS.has(author) ? 'Indian' : 'Non-Indian',
            tags: tags,
            source: 'typefit'
        };
    } catch (error) {
        // Silently fail - the QuotesAggregator will handle fallbacks
        if (!error.message.includes('fetch failed') && !error.name.includes('AbortError')) {
            console.error('Type.fit adapter error:', error.message);
        }
        return null;
    }
}

function matchesCategory(quoteText, category) {
    const text = quoteText.toLowerCase();
    const categoryKeywords = {
        'Wisdom': ['wise', 'wisdom', 'sage', 'truth', 'understand'],
        'Knowledge': ['knowledge', 'learn', 'educate', 'study', 'know'],
        'Life': ['life', 'live', 'exist', 'journey', 'experience'],
        'Writing': ['write', 'book', 'story', 'word', 'pen', 'author'],
        'Philosophy': ['philosophy', 'think', 'mind', 'consciousness', 'reality']
    };

    const keywords = categoryKeywords[category] || [];
    return keywords.some(keyword => text.includes(keyword));
}

function inferTags(quoteText, category) {
    const tags = [];
    const text = quoteText.toLowerCase();

    if (category) {
        tags.push(category.toLowerCase());
    }

    if (text.includes('life') || text.includes('live')) tags.push('life');
    if (text.includes('wisdom') || text.includes('wise')) tags.push('wisdom');
    if (text.includes('knowledge') || text.includes('learn')) tags.push('knowledge');
    if (text.includes('write') || text.includes('book')) tags.push('writing');
    if (text.includes('philosophy') || text.includes('think')) tags.push('philosophy');

    return tags.length > 0 ? tags : ['inspirational'];
}

module.exports = { fetchQuote };
