/**
 * Indian Quotes Static Collection
 * Curated collection of profound quotes from Indian authors
 * Categorized by: Wisdom, Knowledge, Life, Writing, Philosophy
 */

const INDIAN_QUOTES = {
    Wisdom: [
        { quote: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
        { quote: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
        { quote: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
        { quote: "You cannot believe in God until you believe in yourself.", author: "Swami Vivekananda" },
        { quote: "The highest education is that which does not merely give us information but makes our life in harmony with all existence.", author: "Rabindranath Tagore" },
        { quote: "You can't cross the sea merely by standing and staring at the water.", author: "Rabindranath Tagore" },
        { quote: "The weak can never forgive. Forgiveness is the attribute of the strong.", author: "Mahatma Gandhi" },
        { quote: "Take up one idea. Make that one idea your life.", author: "Swami Vivekananda" }
    ],
    Knowledge: [
        { quote: "Learning gives creativity, creativity leads to thinking, thinking provides knowledge, knowledge makes you great.", author: "APJ Abdul Kalam" },
        { quote: "If you want to shine like a sun, first burn like a sun.", author: "APJ Abdul Kalam" },
        { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Mother Teresa" },
        { quote: "Real education enhances the dignity of a human being and increases his or her self-respect.", author: "APJ Abdul Kalam" },
        { quote: "The roots of education are bitter, but the fruit is sweet.", author: "Chanakya" },
        { quote: "A person should not be too honest. Straight trees are cut first.", author: "Chanakya" },
        { quote: "Before you start some work, always ask yourself three questions - Why am I doing it, What the results might be and Will I be successful.", author: "Chanakya" }
    ],
    Life: [
        { quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
        { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
        { quote: "We are what our thoughts have made us; so take care about what you think.", author: "Swami Vivekananda" },
        { quote: "Let us sacrifice our today so that our children can have a better tomorrow.", author: "APJ Abdul Kalam" },
        { quote: "It is not the load that breaks you down, it's the way you carry it.", author: "Mother Teresa" },
        { quote: "The greatest religion is to be true to your own nature. Have faith in yourselves.", author: "Swami Vivekananda" },
        { quote: "Where the mind is without fear and the head is held high.", author: "Rabindranath Tagore" },
        { quote: "Do not wait for leaders; do it alone, person to person.", author: "Mother Teresa" }
    ],
    Writing: [
        { quote: "Don't limit a child to your own learning, for he was born in another time.", author: "Rabindranath Tagore" },
        { quote: "A mind all logic is like a knife all blade. It makes the hand bleed that uses it.", author: "Rabindranath Tagore" },
        { quote: "Words are, of course, the most powerful drug used by mankind.", author: "Rudyard Kipling" },
        { quote: "The pen is mightier than the sword, but the tongue is mightier than them both put together.", author: "Chanakya" },
        { quote: "Let noble thoughts come to us from every side.", author: "Rig Veda" }
    ],
    Philosophy: [
        { quote: "The mind is everything. What you think you become.", author: "Buddha" },
        { quote: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha" },
        { quote: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
        { quote: "In the process of letting go you will lose many things from the past, but you will find yourself.", author: "Deepak Chopra" },
        { quote: "Realization of Truth is higher than all else. Higher still is truthful living.", author: "Guru Nanak" },
        { quote: "The world is a drama, staged in a dream.", author: "Sri Aurobindo" },
        { quote: "All know that the drop merges into the ocean, but few know that the ocean merges into the drop.", author: "Kabir" },
        { quote: "The soul is neither born, and nor does it die.", author: "Bhagavad Gita" }
    ]
};

async function fetchQuote(category = null) {
    try {
        // Select category or random
        const selectedCategory = category || getRandomCategory();
        const quotes = INDIAN_QUOTES[selectedCategory] || INDIAN_QUOTES.Wisdom;
        
        // Get random quote from selected category
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        return {
            text: randomQuote.quote,
            author: randomQuote.author,
            author_origin: 'Indian',
            tags: [selectedCategory.toLowerCase(), 'indian', 'wisdom'],
            source: 'indian_quotes_collection'
        };
    } catch (error) {
        // This adapter uses static data, so errors are unlikely
        console.error('Indian Quotes adapter error:', error.message);
        return null;
    }
}

function getRandomCategory() {
    const categories = Object.keys(INDIAN_QUOTES);
    return categories[Math.floor(Math.random() * categories.length)];
}

module.exports = { fetchQuote };
