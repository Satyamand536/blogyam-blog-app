
export const LOCAL_QUOTES = [
    {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        category: "Wisdom"
    },
    {
        text: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs",
        category: "Wisdom"
    },
    {
        text: "Strive not to be a success, but rather to be of value.",
        author: "Albert Einstein",
        category: "Wisdom"
    },
    {
        text: "The mind is everything. What you think you become.",
        author: "Buddha",
        category: "Wisdom"
    },
    {
        text: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb",
        category: "Wisdom"
    },
    {
        text: "Your time is limited, so don't waste it living someone else's life.",
        author: "Steve Jobs",
        category: "Life"
    },
    {
        text: "Life is what happens when you're busy making other plans.",
        author: "John Lennon",
        category: "Life"
    },
    {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        category: "Life"
    },
    {
        text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
        author: "Benjamin Franklin",
        category: "Knowledge"
    },
    {
        text: "An investment in knowledge pays the best interest.",
        author: "Benjamin Franklin",
        category: "Knowledge"
    },
    {
        text: "It does not matter how slowly you go as long as you do not stop.",
        author: "Confucius",
        category: "Philosophy"
    },
    {
        text: "The unexamined life is not worth living.",
        author: "Socrates",
        category: "Philosophy"
    },
    {
        text: "I think, therefore I am.",
        author: "René Descartes",
        category: "Philosophy"
    },
    {
        text: "Either write something worth reading or do something worth writing.",
        author: "Benjamin Franklin",
        category: "Writing"
    },
    {
        text: "No tears in the writer, no tears in the reader.",
        author: "Robert Frost",
        category: "Writing"
    },
    {
        text: "You must be the change you wish to see in the world.",
        author: "Mahatma Gandhi",
        category: "Wisdom"
    },
    {
        text: "Happiness depends upon ourselves.",
        author: "Aristotle",
        category: "Life"
    },
    {
        text: "Turn your wounds into wisdom.",
        author: "Oprah Winfrey",
        category: "Wisdom"
    },
    {
        text: "Do what you can, with what you have, where you are.",
        author: "Theodore Roosevelt",
        category: "Life"
    },
    {
        text: "Be the change that you wish to see in the world.",
        author: "Mahatma Gandhi",
        category: "Philosophy"
    }
    // Add more as needed... 
];

export const getRandomLocalQuote = (category) => {
    const filtered = category 
        ? LOCAL_QUOTES.filter(q => q.category === category)
        : LOCAL_QUOTES;
    
    // Fallback to all quotes if category has no matches
    const source = filtered.length > 0 ? filtered : LOCAL_QUOTES;
    return source[Math.floor(Math.random() * source.length)];
};
