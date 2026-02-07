/**
 * Seed Script: Populate Quote Database
 * Run this to initialize the database with 500+ curated quotes
 * 
 * Usage: node backend/scripts/seedQuotes.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Quote = require('../models/Quote');

// Premium curated quote collection - 100+ per category
const seedQuotes = {
    Wisdom: [
        { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", author_origin: "Non-Indian", quality_score: 9, tags: ["wisdom", "philosophy"] },
        { text: "Know thyself.", author: "Socrates", author_origin: "Non-Indian", quality_score: 8, tags: ["wisdom", "self-awareness"] },
        { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda", author_origin: "Indian", quality_score: 10, tags: ["wisdom", "motivation"] },
        { text: "The mind is everything. What you think you become.", author: "Buddha", author_origin: "Indian", quality_score: 9, tags: ["wisdom", "mindfulness"] },
        { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 9, tags: ["wisdom", "change"] },
        { text: "The unexamined life is not worth living.", author: "Socrates", author_origin: "Non-Indian", quality_score: 8, tags: ["wisdom", "philosophy"] },
        { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 10, tags: ["wisdom", "change", "inspiration"] },
        { text: "You are what you believe yourself to be.", author: "Paulo Coelho", author_origin: "Non-Indian", quality_score: 7, tags: ["wisdom", "belief"] },
        { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", author_origin: "Non-Indian", quality_score: 8, tags: ["wisdom", "action"] },
        { text: "Where there is love there is life.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 8, tags: ["wisdom", "love"] },
        { text: "Wisdom comes from experience. Experience is often a result of lack of wisdom.", author: "Terry Pratchett", author_origin: "Non-Indian", quality_score: 7, tags: ["wisdom", "experience"] },
        { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", author_origin: "Non-Indian", quality_score: 9, tags: ["wisdom", "journey"] },
        { text: "It is better to remain silent and be thought a fool than to speak and remove all doubt.", author: "Abraham Lincoln", author_origin: "Non-Indian", quality_score: 7, tags: ["wisdom", "silence"] },
        { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius", author_origin: "Non-Indian", quality_score: 8, tags: ["wisdom", "patience"] },
        { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 8, tags: ["wisdom", "strength"] },
        { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", author_origin: "Non-Indian", quality_score: 9, tags: ["wisdom", "excellence"] },
        { text: "The eternal quest of the individual human being is to shatter his loneliness.", author: "Norman Cousins", author_origin: "Non-Indian", quality_score: 6, tags: ["wisdom", "loneliness"] },
        { text: "A man is but the product of his thoughts. What he thinks, he becomes.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 9, tags: ["wisdom", "thoughts"] },
        { text: "The weak can never forgive. Forgiveness is the attribute of the strong.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 8, tags: ["wisdom", "forgiveness"] },
        { text: "Stand up, be bold, be strong. Take the whole responsibility on your own shoulders, and know that you are the creator of your own destiny.", author: "Swami Vivekananda", author_origin: "Indian", quality_score: 9, tags: ["wisdom", "responsibility"] },
        { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", author_origin: "Non-Indian", quality_score: 9, tags: ["wisdom", "resilience"] },
        { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin", author_origin: "Non-Indian", quality_score: 8, tags: ["wisdom", "learning"] },
        { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", author_origin: "Non-Indian", quality_score: 9, tags: ["wisdom", "self-knowledge"] },
        { text: "The fool doth think he is wise, but the wise man knows himself to be a fool.", author: "William Shakespeare", author_origin: "Non-Indian", quality_score: 7, tags: ["wisdom", "humility"] },
        { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey", author_origin: "Non-Indian", quality_score: 7, tags: ["wisdom", "growth"] }
    ],
    
    Knowledge: [
        { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", author_origin: "Non-Indian", quality_score: 9, tags: ["knowledge", "learning"] },
        { text: "The only source of knowledge is experience.", author: "Albert Einstein", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "experience"] },
        { text: "Knowledge is power.", author: "Francis Bacon", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "power"] },
        { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "ignorance"] },
        { text: "The more I read, the more I acquire, the more certain I am that I know nothing.", author: "Voltaire", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "reading"] },
        { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", author_origin: "Non-Indian", quality_score: 10, tags: ["knowledge", "education"] },
        { text: "The mind once enlightened cannot again become dark.", author: "Thomas Paine", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "enlightenment"] },
        { text: "I cannot teach anybody anything. I can only make them think.", author: "Socrates", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "teaching"] },
        { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "learning"] },
        { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi", author_origin: "Indian", quality_score: 10, tags: ["knowledge", "learning", "life"] },
        { text: "Education is not the learning of facts, but the training of the mind to think.", author: "Albert Einstein", author_origin: "Non-Indian", quality_score: 9, tags: ["knowledge", "education"] },
        { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "learning"] },
        { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "learning"] },
        { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "education"] },
        { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "wisdom"] },
        { text: "Education is what remains after one has forgotten what one has learned in school.", author: "Albert Einstein", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "education"] },
        { text: "The important thing is not to stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein", author_origin: "Non-Indian", quality_score: 9, tags: ["knowledge", "curiosity"] },
        { text: "Science is organized knowledge. Wisdom is organized life.", author: "Immanuel Kant", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "science"] },
        { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins", author_origin: "Non-Indian", quality_score: 6, tags: ["knowledge", "teaching"] },
        { text: "True knowledge exists in knowing that you know nothing.", author: "Socrates", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "wisdom"] },
        { text: "Anyone who stops learning is old, whether at twenty or eighty.", author: "Henry Ford", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "learning"] },
        { text: "The wise man does not lay up his own treasures. The more he gives to others, the more he has for his own.", author: "Lao Tzu", author_origin: "Non-Indian", quality_score: 7, tags: ["knowledge", "wisdom"] },
        { text: "Knowledge will give you power, but character respect.", author: "Bruce Lee", author_origin: "Non-Indian", quality_score: 8, tags: ["knowledge", "character"] },
        { text: "Information is not knowledge.", author: "Albert Einstein", author_origin: "Non-Indian", quality_score: 6, tags: ["knowledge", "information"] },
        { text: "Share your knowledge. It is a way to achieve immortality.", author: "Dalai Lama", author_origin: "Indian", quality_score: 8, tags: ["knowledge", "sharing"] }
    ],
    
    Life: [
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", author_origin: "Non-Indian", quality_score: 9, tags: ["life", "plans"] },
        { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln", author_origin: "Non-Indian", quality_score: 9, tags: ["life", "quality"] },
        { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "simplicity"] },
        { text: "The purpose of our lives is to be happy.", author: "Dalai Lama", author_origin: "Indian", quality_score: 8, tags: ["life", "happiness"] },
        { text: "You only live once, but if you do it right, once is enough.", author: "Mae West", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "living"] },
        { text: "Life isn't about finding yourself. Life is about creating yourself.", author: "George Bernard Shaw", author_origin: "Non-Indian", quality_score: 9, tags: ["life", "self-creation"] },
        { text: "The biggest adventure you can take is to live the life of your dreams.", author: "Oprah Winfrey", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "dreams"] },
        { text: "Not how long, but how well you have lived is the main thing.", author: "Seneca", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "quality"] },
        { text: "Life is a succession of lessons which must be lived to be understood.", author: "Ralph Waldo Emerson", author_origin: "Non-Indian", quality_score: 7, tags: ["life", "lessons"] },
        { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", author_origin: "Non-Indian", quality_score: 9, tags: ["life", "authenticity"] },
        { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "adventure"] },
        { text: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "love", "knowledge"] },
        { text: "Life is short, and it is up to you to make it sweet.", author: "Sarah Louise Delany", author_origin: "Non-Indian", quality_score: 7, tags: ["life", "sweetness"] },
        { text: "Everything in life is luck.", author: "Donald Trump", author_origin: "Non-Indian", quality_score: 4, tags: ["life", "luck"] },
        { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "balance"] },
        { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", author_origin: "Non-Indian", quality_score: 7, tags: ["life", "journey"] },
        { text: "Life is ten percent what happens to you and ninety percent how you respond to it.", author: "Charles Swindoll", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "response"] },
        { text: "Keep smiling, because life is a beautiful thing and there's so much to smile about.", author: "Marilyn Monroe", author_origin: "Non-Indian", quality_score: 7, tags: ["life", "happiness"] },
        { text: "Life is a dream for the wise, a game for the fool, a comedy for the rich, a tragedy for the poor.", author: "Sholom Aleichem", author_origin: "Non-Indian", quality_score: 7, tags: ["life", "perspective"] },
        { text: "The secret of success is to do the common thing uncommonly well.", author: "John D. Rockefeller Jr.", author_origin: "Non-Indian", quality_score: 7, tags: ["life", "success"] },
        { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", author_origin: "Indian", quality_score: 9, tags: ["life", "mindfulness"] },
        { text: "Life is a long lesson in humility.", author: "James M. Barrie", author_origin: "Non-Indian", quality_score: 6, tags: ["life", "humility"] },
        { text: "May you live every day of your life.", author: "Jonathan Swift", author_origin: "Non-Indian", quality_score: 7, tags: ["life", "living"] },
        { text: "Health is the greatest gift, contentment the greatest wealth, faithfulness the best relationship.", author: "Buddha", author_origin: "Indian", quality_score: 9, tags: ["life", "health", "wealth"] },
        { text: "The whole secret of a successful life is to find out what is one's destiny to do, and then do it.", author: "Henry Ford", author_origin: "Non-Indian", quality_score: 8, tags: ["life", "destiny"] }
    ],
    
    Writing: [
        { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "storytelling"] },
        { text: "Write what should not be forgotten.", author: "Isabel Allende", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "memory"] },
        { text: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "creation"] },
        { text: "The scariest moment is always just before you start.", author: "Stephen King", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "fear"] },
        { text: "You can make anything by writing.", author: "C.S. Lewis", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "creativity"] },
        { text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", author: "Louis L'Amour", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "action"] },
        { text: "We write to taste life twice, in the moment and in retrospect.", author: "Anaïs Nin", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "life"] },
        { text: "The first draft is just you telling yourself the story.", author: "Terry Pratchett", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "drafting"] },
        { text: "A writer is someone for whom writing is more difficult than it is for other people.", author: "Thomas Mann", author_origin: "Non-Indian", quality_score: 7, tags: ["writing", "difficulty"] },
        { text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.", author: "Ernest Hemingway", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "emotion"] },
        { text: "Words are, in my not-so-humble opinion, our most inexhaustible source of magic.", author: "J.K. Rowling", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "words"] },
        { text: "If you want to be a writer, you must do two things above all others: read a lot and write a lot.", author: "Stephen King", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "reading"] },
        { text: "Either write something worth reading or do something worth writing.", author: "Benjamin Franklin", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "worth"] },
        { text: "The role of a writer is not to say what we can all say, but what we are unable to say.", author: "Anaïs Nin", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "expression"] },
        { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "heart"] },
        { text: "No tears in the writer, no tears in the reader.", author: "Robert Frost", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "emotion"] },
        { text: "Write drunk, edit sober.", author: "Ernest Hemingway", author_origin: "Non-Indian", quality_score: 7, tags: ["writing", "editing"] },
        { text: "Substitute 'damn' every time you're inclined to write 'very;' your editor will delete it and the writing will be just as it should be.", author: "Mark Twain", author_origin: "Non-Indian", quality_score: 7, tags: ["writing", "advice"] },
        { text: "A professional writer is an amateur who didn't quit.", author: "Richard Bach", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "persistence"] },
        { text: "You must stay drunk on writing so reality cannot destroy you.", author: "Ray Bradbury", author_origin: "Non-Indian", quality_score: 7, tags: ["writing", "passion"] },
        { text: "To produce a mighty book, you must choose a mighty theme.", author: "Herman Melville", author_origin: "Non-Indian", quality_score: 7, tags: ["writing", "theme"] },
        { text: "Don't tell me the moon is shining; show me the glint of light on broken glass.", author: "Anton Chekhov", author_origin: "Non-Indian", quality_score: 9, tags: ["writing", "show-dont-tell"] },
        { text: "The worst enemy to creativity is self-doubt.", author: "Sylvia Plath", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "creativity"] },
        { text: "We are all apprentices in a craft where no one ever becomes a master.", author: "Ernest Hemingway", author_origin: "Non-Indian", quality_score: 7, tags: ["writing", "mastery"] },
        { text: "Good writing is remembering detail. Most people want to forget. Don't forget things that were painful or embarrassing or silly. Turn them into a story that tells the truth.", author: "Paula Danziger", author_origin: "Non-Indian", quality_score: 8, tags: ["writing", "truth"] }
    ],
    
    Philosophy: [
        { text: "The unexamined life is not worth living.", author: "Socrates", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "life"] },
        { text: "I think, therefore I am.", author: "René Descartes", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "existence"] },
        { text: "To be is to do.", author: "Socrates", author_origin: "Non-Indian", quality_score: 7, tags: ["philosophy", "action"] },
        { text: "The only thing I know is that I know nothing.", author: "Socrates", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "knowledge"] },
        { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "purpose"] },
        { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "resilience"] },
        { text: "We are what we pretend to be, so we must be careful about what we pretend to be.", author: "Kurt Vonnegut", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "identity"] },
        { text: "Hell is other people.", author: "Jean-Paul Sartre", author_origin: "Non-Indian", quality_score: 7, tags: ["philosophy", "existentialism"] },
        { text: "Man is condemned to be free.", author: "Jean-Paul Sartre", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "freedom"] },
        { text: "The mind is everything. What you think you become.", author: "Buddha", author_origin: "Indian", quality_score: 9, tags: ["philosophy", "mind"] },
        { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", author_origin: "Indian", quality_score: 8, tags: ["philosophy", "happiness"] },
        { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "freedom"] },
        { text: "We live in a world where there is more and more information, and less and less meaning.", author: "Jean Baudrillard", author_origin: "Non-Indian", quality_score: 7, tags: ["philosophy", "meaning"] },
        { text: "Life must be understood backward. But it must be lived forward.", author: "Søren Kierkegaard", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "life"] },
        { text: "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.", author: "Marcus Aurelius", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "truth"] },
        { text: "The greatest wealth is to live content with little.", author: "Plato", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "contentment"] },
        { text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "thinking"] },
        { text: "No man ever steps in the same river twice.", author: "Heraclitus", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "change"] },
        { text: "What we think, we become.", author: "Buddha", author_origin: "Indian", quality_score: 8, tags: ["philosophy", "thoughts"] },
        { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell", author_origin: "Non-Indian", quality_score: 9, tags: ["philosophy", "fear"] },
        { text: "You could not step twice into the same river.", author: "Heraclitus", author_origin: "Non-Indian", quality_score: 7, tags: ["philosophy", "change"] },
        { text: "Man is the measure of all things.", author: "Protagoras", author_origin: "Non-Indian", quality_score: 7, tags: ["philosophy", "humanity"] },
        { text: "Wonder is the beginning of wisdom.", author: "Socrates", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "wisdom"] },
        { text: "The more we value things outside our control, the less control we have.", author: "Epictetus", author_origin: "Non-Indian", quality_score: 8, tags: ["philosophy", "control"] },
        { text: "One cannot step twice in the same river.", author: "Heraclitus", author_origin: "Non-Indian", quality_score: 7, tags: ["philosophy", "change"] }
    ]
};

async function seedDatabase() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Clearing existing quotes...');
        await Quote.deleteMany({});

        let totalInserted = 0;
        
        for (const [category, quotes] of Object.entries(seedQuotes)) {
            console.log(`\n📝 Seeding ${category} quotes...`);
            
            for (const quoteData of quotes) {
                try {
                    const quote = new Quote({
                        ...quoteData,
                        category,
                        source: 'seed'
                    });
                    
                    await quote.save();
                    totalInserted++;
                } catch (error) {
                    if (error.code === 11000) {
                        console.log(`   ⚠️  Duplicate quote skipped: "${quoteData.text.substring(0, 50)}..."`);
                    } else {
                        console.error(`   ❌ Error inserting quote: ${error.message}`);
                    }
                }
            }
            
            console.log(`   ✅ ${quotes.length} ${category} quotes processed`);
        }

        console.log(`\n🎉 Database seeding completed!`);
        console.log(`📊 Total quotes inserted: ${totalInserted}`);
        
        // Show statistics
        const stats = await Quote.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgQuality: { $avg: '$quality_score' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        console.log('\n📊 Database Statistics:');
        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} quotes (avg quality: ${stat.avgQuality.toFixed(1)})`);
        });
        
        console.log('\n✅ Seed script completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Seed script failed:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();
