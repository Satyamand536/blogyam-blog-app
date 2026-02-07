import { useState, useEffect } from 'react';
import api from '../api/axios';
import { RefreshCw, Quote, Sparkles, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';
import { getRandomLocalQuote } from '../data/localQuotes';

export default function Quotes() {
    // Daily Quote State
    const [dailyQuote, setDailyQuote] = useState(null);
    const [dailyQuoteLoading, setDailyQuoteLoading] = useState(true);
    
    // Random Quote State
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [backgroundImage, setBackgroundImage] = useState('');
    const [imageError, setImageError] = useState(false);
    const [category, setCategory] = useState('Wisdom');
    
    // Quote History State (for Previous/Next navigation)
    const [quoteHistory, setQuoteHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [viewedQuoteIds, setViewedQuoteIds] = useState(new Set());
    
    // Toast Notification State
    const [showCopyToast, setShowCopyToast] = useState(false);

    const categories = ['Wisdom', 'Knowledge', 'Life', 'Writing', 'Philosophy'];
    const HISTORY_LIMIT = 100; // Prevent memory issues

    // Production-grade emergency fallback images (Legacy / Absolute Offline Fallback)
    const EMERGENCY_IMAGES = {
        'Wisdom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lotus_temple_evening.jpg/1280px-Lotus_temple_evening.jpg',
        'Knowledge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Trinity_College_Library%2C_Dublin%2C_Ireland_-_Diliff.jpg/1280px-Trinity_College_Library%2C_Dublin%2C_Ireland_-_Diliff.jpg',
        'Life': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg/1280px-Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg',
        'Writing': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Vintage_typewriter_and_books.jpg/1280px-Vintage_typewriter_and_books.jpg',
        'Philosophy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Parthenon_from_south.jpg/1280px-Parthenon_from_south.jpg'
    };

    // Fallback gradient using beautiful blue palette from iColorPalette
    const categoryGradients = {
        'Wisdom': 'bg-gradient-to-br from-[#003788] via-[#1558a9] to-[#428eff]',
        'Knowledge': 'bg-gradient-to-br from-[#0065d9] via-[#1b73de] to-[#5799ea]',
        'Life': 'bg-gradient-to-br from-[#89b9ff] via-[#a6cde7] to-[#e2f0f9]',
        'Writing': 'bg-gradient-to-br from-[#428eff] via-[#6aabd6] to-[#a6cde7]',
        'Philosophy': 'bg-gradient-to-br from-[#00398e] via-[#0f427f] to-[#1b73de]'
    };

    const fetchDailyQuote = async () => {
        setDailyQuoteLoading(true);
        const today = new Date().toDateString();
        const storageKey = `dailyQuote_${today}`;
        
        const cached = localStorage.getItem(storageKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Validate cache structure - must have 'text' property
                if (parsed && parsed.text) {
                    setDailyQuote(parsed);
                    setDailyQuoteLoading(false);
                    return;
                } else {
                    localStorage.removeItem(storageKey); // Clear invalid cache
                }
            } catch (e) {
                console.error('Failed to parse cached daily quote:', e);
                localStorage.removeItem(storageKey);
            }
        }
        
        try {
            const response = await api.get('/quotes/daily', {
                signal: AbortSignal.timeout(10000)
            });

            const result = response.data;
            
            if (result.success && result.data) {
                const quoteData = {
                    text: result.data.text || result.data.quote, // Handle both for safety
                    author: result.data.author || 'Unknown',
                    origin: result.data.author_origin,
                    source: result.data.source,
                    image: result.data.image,
                    fingerprint: result.data.fingerprint
                };
                setDailyQuote(quoteData);
                localStorage.setItem(storageKey, JSON.stringify(quoteData));
            }
        } catch (error) {
            console.error("Error fetching daily quote:", error.message);
            // Robust local fallback for variety during outages
            const localFallback = getRandomLocalQuote('Wisdom');
            setDailyQuote({
                text: localFallback.text,
                author: localFallback.author,
                origin: "Indian"
            });
        }
        setDailyQuoteLoading(false);
    };

    const fetchQuote = async (navigating = false, direction = 'next') => {
        setLoading(true);
        setImageError(false);
        
        if (navigating) {
            if (direction === 'prev' && historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                const prevQuote = quoteHistory[newIndex];
                setQuote(prevQuote);
                updateBackgroundImage(prevQuote);
                setLoading(false);
                return;
            } else if (direction === 'next' && historyIndex < quoteHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                const nextQuote = quoteHistory[newIndex];
                setQuote(nextQuote);
                updateBackgroundImage(nextQuote);
                setLoading(false);
                return;
            }
        }
        
        try {
            const excludeParam = Array.from(viewedQuoteIds).join(',');
            const url = `/quotes?random=true&limit=1&category=${category}${excludeParam ? `&exclude=${excludeParam}` : ''}`;
            
            // Increased timeout to 15s for better reliability on slow networks
            const response = await api.get(url, {
                signal: AbortSignal.timeout(15000)
            });

            const result = response.data;
            
            if (result.success) {
                // Fix: API returns { quotes: [...] }, not { data: ... } for random quotes
                const quoteData = result.quotes && result.quotes.length > 0 ? result.quotes[0] : null;
                
                if (quoteData) {
                   const newQuote = {
                        text: quoteData.text,
                        author: quoteData.author || 'Unknown',
                        origin: quoteData.author_origin,
                        source: quoteData.source,
                        image: quoteData.image,
                        fingerprint: quoteData.fingerprint
                    };
                    
                    const newHistory = [...quoteHistory.slice(0, historyIndex + 1), newQuote];
                    const trimmedHistory = newHistory.slice(-HISTORY_LIMIT);
                    setQuoteHistory(trimmedHistory);
                    setHistoryIndex(trimmedHistory.length - 1);
                    
                    setViewedQuoteIds(prev => {
                        const newSet = new Set(prev);
                        if (quoteData.fingerprint) newSet.add(quoteData.fingerprint.toLowerCase());
                        return newSet.size > HISTORY_LIMIT ? new Set(Array.from(newSet).slice(-HISTORY_LIMIT)) : newSet;
                    });
                    
                    setQuote(newQuote);
                    updateBackgroundImage(newQuote);
                } else {
                    throw new Error("No quotes found in API response");
                }
            } else {
                throw new Error("API reported failure");
            }
        } catch (error) {
            // SILENT FALLBACK: Don't scare the user with standard error logs
            // Instead of error, we just treat it as "offline mode"
            // Check for axios specific error codes or standard error types
            if (error.code === 'ECONNABORTED' || error.name === 'TimeoutError' || error.name === 'AbortError') {
                console.warn("Request timed out - switching to local library (Offline Mode)");
            } else {
                console.warn("Network issue - switching to local library");
            }

            const localQuote = getRandomLocalQuote(category);
            const fallbackQuote = {
                text: localQuote.text,
                author: localQuote.author,
                origin: "International",
                category: localQuote.category,
                image: {
                    url: EMERGENCY_IMAGES[category],
                    fallbackUrl: EMERGENCY_IMAGES[category]
                }
            };
            
            setQuote(fallbackQuote);
            updateBackgroundImage(fallbackQuote);
        }
        setLoading(false);
    };
    
    const updateBackgroundImage = (activeQuote) => {
        // Production logic: 
        // 1. Use image from API if available
        // 2. Fallback to emergency list
        // 3. Fallback to gradient
        const imgUrl = activeQuote?.image?.url || EMERGENCY_IMAGES[category];
        setBackgroundImage(imgUrl);
    };

    // Load daily quote ONCE on mount (independent of category)
    useEffect(() => {
        fetchDailyQuote();
    }, []); // Empty dependency - runs only once!

    // Load random quote when category changes
    useEffect(() => {
        // Reset history when category changes
        setQuoteHistory([]);
        setHistoryIndex(-1);
        setViewedQuoteIds(new Set());
        fetchQuote();
    }, [category]);

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-500">
            {/* Header Section */}
            <div className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] py-8 transition-colors duration-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="text-primary-600" size={32} />
                            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--text-primary)]">
                                Daily Wisdom
                            </h1>
                        </div>
                        <p className="text-[var(--text-secondary)] text-lg font-serif italic">
                            Discover timeless wisdom from around the world
                        </p>
                    </div>
                    
                    {/* Daily Wisdom Quote Display */}
                    <div className="mt-8 max-w-3xl mx-auto">
                        {dailyQuoteLoading ? (
                            <div className="text-center py-4">
                                <RefreshCw className="animate-spin mx-auto text-primary-600" size={24} />
                            </div>
                        ) : dailyQuote && (
                            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 rounded-xl p-6 border-l-4 border-primary-600 shadow-md hover:shadow-lg transition-all duration-500">
                                <div className="flex items-start gap-3">
                                    <Quote className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={24} />
                                    <div className="flex-1">
                                        <p className="text-lg font-serif text-slate-800 dark:text-slate-100 leading-relaxed mb-2">
                                            "{dailyQuote.text}"
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                            — {dailyQuote.author}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Explore More Wisdom Section */}
            <div className="text-center mt-12 mb-6">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-primary)] mb-2">
                    Explore More Wisdom
                </h2>
                <p className="text-[var(--text-secondary)] text-sm">
                    Navigate through inspiring quotes from great minds
                </p>
            </div>

            {/* Category Filter */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-wrap justify-center gap-3">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                                category === cat
                                    ? 'bg-slate-900 dark:bg-primary-600 text-white shadow-lg scale-105'
                                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 border border-[var(--border-color)]'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            
                {/* Quote Display Card */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[var(--bg-card)] transition-colors duration-500">
                        {/* Background Image or Gradient Fallback */}
                        <div className="relative h-96 sm:h-[500px] overflow-hidden">
                            {(!loading && !imageError && backgroundImage) ? (
                                <>
                                    <OptimizedImage
                                        src={backgroundImage}
                                        alt={category}
                                        priority={true} // LCP Candidate
                                        className="w-full h-full object-cover"
                                        onError={handleImageError}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-slate-900/40"></div>
                                </>
                            ) : (
                                <>
                                    <div className={`w-full h-full ${categoryGradients[category]}`}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/20 to-transparent"></div>
                                </>
                            )}
                            
                            {/* Quote Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-12">
                                {loading && !quote ? (
                                    <div className="animate-spin">
                                        <RefreshCw className="text-white" size={48} />
                                    </div>
                                ) : (
                                    <div className="text-center max-w-3xl animate-fade-in">
                                        <Quote className="text-primary-300 mx-auto mb-6" size={48} />
                                        <blockquote className="text-2xl sm:text-3xl md:text-4xl font-serif text-white leading-relaxed mb-6">
                                            "{quote?.text}"
                                        </blockquote>
                                        <div className="flex items-center justify-center gap-2 text-primary-200 text-sm uppercase tracking-widest">
                                            <span>—</span>
                                            <span className="font-semibold">{quote?.author || 'Unknown'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-[var(--bg-card)] p-6 border-t border-[var(--border-color)] transition-colors duration-500">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                {/* Navigation Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchQuote(true, 'prev')}
                                        disabled={loading || historyIndex <= 0}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white font-medium rounded-full hover:bg-slate-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Previous Quote"
                                    >
                                        <ChevronLeft size={20} />
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => fetchQuote(false, 'next')}
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Next Random Quote"
                                    >
                                        Next Random
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(quote?.text || '');
                                        setShowCopyToast(true);
                                        setTimeout(() => setShowCopyToast(false), 3000);
                                    }}
                                    className="px-8 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                                >
                                    Copy Quote
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid View: All Quotes in Category */}
                <QuoteGrid category={category} />

                {/* Info Section */}
                <div className="mb-12 text-center px-4">
                    <p className="text-[var(--text-secondary)] font-serif italic">
                        "Arise, awake, and stop not till the goal is reached."
                    </p>
                    <p className="mt-2 text-[var(--text-secondary)] opacity-70 text-sm">— Swami Vivekananda</p>
                </div>

                {/* Professional Toast Notification */}
                <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${showCopyToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
                    <div className="flex items-center gap-3 px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl border-2 bg-green-500/95 dark:bg-green-600/90 border-green-400 text-white">
                        <CheckCircle size={22} className="animate-bounce-short" />
                        <span className="font-bold text-sm tracking-wide">Quote copied to clipboard!</span>
                    </div>
                </div>
        </div>
    );
}

function QuoteGrid({ category }) {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGridQuotes = async () => {
             setLoading(true);
             try {
                const response = await api.get(`/quotes?category=${category}&limit=24`);
                const result = response.data;
                if (result.success && result.quotes) {
                    setQuotes(result.quotes);
                }
             } catch (error) {
                 console.warn("Grid fetch failed, using local fallback");
                 const local = [];
                 for(let i=0; i<12; i++) local.push(getRandomLocalQuote(category));
                 setQuotes(local);
             }
             setLoading(false);
        };
        fetchGridQuotes();
    }, [category]);

    if (loading) return (
        <div className="flex justify-center py-20">
            <RefreshCw className="animate-spin text-primary-600" size={40} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
            <div className="flex items-center gap-6 mb-16">
                <div className="w-1.5 h-12 bg-primary-600 rounded-full"></div>
                <div>
                    <h3 className="text-3xl md:text-4xl font-serif font-black text-[var(--text-primary)]">
                        Insights on <span className="text-primary-600">{category}</span>
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm font-bold tracking-widest uppercase opacity-60 mt-2">
                        Timeless Collection
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {quotes.map((q, idx) => (
                    <div 
                        key={idx} 
                        className="group relative bg-[var(--bg-card)] rounded-3xl p-10 border border-[var(--border-color)] hover:border-primary-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 flex flex-col justify-between overflow-hidden"
                    >
                        <div className="relative z-10 flex-1">
                            <div className="inline-flex p-3 rounded-2xl bg-primary-600 mb-10 shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-500">
                                <Quote className="text-white fill-current" size={24} />
                            </div>
                            
                            <blockquote className="text-2xl font-serif text-[var(--text-primary)] mb-12 leading-relaxed font-semibold italic">
                                "{q.text}"
                            </blockquote>
                        </div>

                        <div className="relative z-10 pt-10 border-t border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden bg-slate-200 shadow-sm transition-transform duration-500 group-hover:scale-105">
                                    {q.image ? (
                                         <OptimizedImage 
                                            src={q.image.url || q.image} 
                                            alt={q.author}
                                            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                                            fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(q.author)}&background=random&color=fff&size=128&bold=true`}
                                         />
                                    ) : (
                                        <div className="w-full h-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600">
                                            {q.author?.[0] || 'A'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-[var(--text-primary)] tracking-tight">
                                        {q.author}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary-600 opacity-80 flex items-center gap-1">
                                        <Sparkles size={10} /> Signature Thinker
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(q.text);
                                }}
                                className="w-12 h-12 flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-primary-600 rounded-2xl transition-all duration-300 shadow-sm border border-[var(--border-color)]"
                                title="Copy Masterpiece"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
