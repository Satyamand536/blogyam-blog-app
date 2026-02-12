import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import BlogCard from '../components/BlogCard';
import api, { API_URL } from '../api/axios';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import { Loader2, Search, ArrowDown, Award, PenTool } from 'lucide-react';
import { stripHtml } from '../utils/textUtils';

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [bestOfWeek, setBestOfWeek] = useState(null);
    const [featuredBlogs, setFeaturedBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    const location = useLocation();
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Scroll to section based on hash after data loads
    useEffect(() => {
        if (!loading && location.hash) {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [loading, location.hash]);

    // Initial Fetch (Featured + First Page)
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch Featured Blog Separately
                const featuredRes = await api.get('/blogs/featured');
                if (featuredRes.data.success) {
                    setBestOfWeek(featuredRes.data.bestOfWeek);
                    setFeaturedBlogs(featuredRes.data.featured || []);
                }

                // Fetch First Page of Latest Blogs
                await fetchBlogs(1, true);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [debouncedSearch, filter]);

    const fetchBlogs = async (pageNum, isReset = false) => {
        try {
            if (!isReset) setLoadingMore(true);
            
            const params = { page: pageNum, limit: 10 }; // Scalable limit
            if (debouncedSearch) params.search = debouncedSearch;
            if (filter !== 'All') params.category = filter;

            const { data } = await api.get('/blogs', { params });
            
            if (data.success) {
                if (isReset) {
                    setBlogs(data.blogs);
                } else {
                    setBlogs(prev => [...prev, ...data.blogs]);
                }
                setHasMore(data.hasMore);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Failed to fetch blogs", error);
        } finally {
            if (!isReset) setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchBlogs(page + 1);
        }
    };

    const handleBlogClick = (blogId) => {
        if (user) {
            navigate(`/blog/${blogId}`);
        } else {
            navigate('/signup');
        }
    };

    // Placeholder Categories
    const categories = ['All', 'Technology', 'Spiritual', 'Lifestyle', 'Career', 'Poem'];

    return (
        <div>
            <Hero />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-500">
                
                {/* Search Bar - Professional & Clean */}
                <div className="max-w-2xl mx-auto mb-16 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="text-[var(--text-secondary)]" size={20} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search for wisdom, stories, or authors..."
                        className="w-full pl-12 pr-4 py-4 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-300 text-lg"
                    />
                </div>

                {/* Weekly Crown (Hero Section for Best of Week) */}
                {!debouncedSearch && bestOfWeek && (
                    <div className="mb-24 animate-fade-in">
                        <div className="flex items-center gap-6 mb-8">
                            <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Award size={18} /> Supreme Masterpiece
                            </h2>
                            <div className="h-px bg-gradient-to-r from-orange-500/50 to-transparent flex-1"></div>
                        </div>
                        
                        <div className="group relative bg-violet-50/50 dark:bg-violet-950 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 hover:shadow-orange-500/10 border border-violet-100 dark:border-violet-800/30 max-w-5xl mx-auto">
                            <div className="flex flex-col md:flex-row items-stretch">
                                {/* Image Section */}
                                <div className="w-full md:w-[60%] relative min-h-[240px] md:min-h-[500px] flex-grow overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 dark:from-[rgba(17,17,17,0.6)] via-transparent to-transparent z-10 opacity-100 dark:opacity-40 hidden md:block transition-all duration-500" />
                                    <img 
                                        src={getImageUrl(bestOfWeek.coverImageURL)} 
                                        alt={bestOfWeek.title} 
                                        className="absolute inset-0 w-full h-full object-contain object-center transform group-hover:scale-105 transition-transform duration-1000"
                                    />
                                    <div className="absolute top-6 left-6 z-20">
                                        <div className="px-5 py-2 bg-orange-600 text-white font-black text-xs rounded-full uppercase tracking-widest shadow-xl flex items-center gap-2 animate-pulse">
                                            <Award size={14} /> Supreme Award
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-[40%] p-3 md:p-8 lg:p-10 flex flex-col justify-between text-[var(--text-primary)] relative z-20 bg-orange-50 dark:bg-transparent md:min-h-[500px] flex-grow">
                                    <div className="flex items-center gap-3 mb-1.5 md:mb-6 text-orange-600 dark:text-orange-300 font-bold uppercase tracking-widest text-xs">
                                        <span>{bestOfWeek.category}</span>
                                        <span className="w-1 h-1 bg-current opacity-30 rounded-full"></span>
                                        <span>{bestOfWeek.readTime} min read</span>
                                    </div>
                                    <h3 
                                        className="text-xl md:text-3xl lg:text-3xl font-serif font-bold mb-2 md:mb-5 leading-tight text-black dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors cursor-pointer"
                                        onClick={() => handleBlogClick(bestOfWeek._id)}
                                    >
                                        {bestOfWeek.title}
                                    </h3>
                                    <p className="text-gray-800 dark:text-gray-300 text-base md:text-lg leading-relaxed mb-2 md:mb-10 line-clamp-3 font-serif italic">
                                        "{stripHtml(bestOfWeek.body).slice(0, 180)}..."
                                    </p>
                                    <div className="mt-auto pt-4 md:pt-8 border-t border-[var(--border-color)] dark:border-white/10 flex flex-col items-center gap-4 md:gap-6 md:-ml-[460px] lg:-ml-[500px] relative z-30">
                                        <div className="flex items-center gap-5 bg-white/80 dark:bg-violet-900/80 backdrop-blur-md p-3 rounded-2xl shadow-xl md:shadow-2xl border border-orange-100 dark:border-violet-700/30">
                                            <img 
                                                src={getImageUrl(bestOfWeek.author.profileImageURL)} 
                                                alt={bestOfWeek.author.name} 
                                                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-orange-500/50 object-cover shrink-0 shadow-lg"
                                            />
                                            <div className="flex flex-col">
                                                <p className="font-bold text-lg md:text-xl text-black dark:text-white">{bestOfWeek.author.name}</p>
                                                <p className="text-[10px] md:text-xs text-orange-500 font-black uppercase tracking-[0.2em]">Master Author</p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleBlogClick(bestOfWeek._id)} 
                                            className="px-10 md:px-32 py-2.5 md:py-4 bg-orange-600 text-white rounded-full font-bold uppercase tracking-widest text-[11px] md:text-sm hover:bg-orange-700 transition-all transform hover:scale-105 shadow-xl shadow-orange-600/40 whitespace-nowrap"
                                        >
                                            Explore Masterpiece
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Editor's Deck (Featured Selection) */}
                {!debouncedSearch && featuredBlogs.length > 0 && (
                    <div className="mb-24 animate-fade-in delay-200">
                        <div className="flex items-center gap-6 mb-10">
                            <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <PenTool size={18} /> Elite Selects
                            </h2>
                            <div className="h-px bg-gradient-to-r from-orange-500/30 to-transparent flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {featuredBlogs.map(blog => (
                                <div key={blog._id} className="group cursor-pointer" onClick={() => handleBlogClick(blog._id)}>
                                    <div className="relative aspect-video rounded-[2rem] overflow-hidden mb-6 border border-white/10 shadow-lg group-hover:shadow-orange-500/20 transition-all duration-500">
                                        <img 
                                            src={getImageUrl(blog.coverImageURL)} 
                                            alt={blog.title}
                                            className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest self-start mb-4">
                                                {blog.category}
                                            </span>
                                            <h4 className="text-xl font-serif font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-orange-400 transition-colors">
                                                {blog.title}
                                            </h4>
                                            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
                                                By {blog.author.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-[var(--border-color)] pb-6">
                    <h2 id="latest-writings" className="text-3xl font-bold font-serif text-[var(--text-primary)] transition-colors duration-500">
                        {debouncedSearch ? `Results for "${debouncedSearch}"` : "Latest Writings"}
                    </h2>
                    
                    {/* Filter Tabs */}
                    <div className="flex gap-2 flex-wrap w-full md:w-auto">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                                    filter === cat 
                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25 scale-105' 
                                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-orange-500 hover:text-orange-600'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-32">
                        <Loader2 className="animate-spin text-primary-600" size={48} />
                    </div>
                ) : (
                    <>
                        {blogs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-16">
                                {blogs.map(blog => (
                                    <BlogCard key={blog._id} blog={blog} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32">
                                <p className="text-xl text-[var(--text-secondary)] font-serif italic">No stories found matching your criteria.</p>
                            </div>
                        )}
                        
                        {/* Pagination Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center pb-20">
                                <button 
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="group flex items-center gap-2 px-8 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] font-bold hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm hover:shadow-lg disabled:opacity-50"
                                >
                                    {loadingMore ? <Loader2 className="animate-spin" size={20} /> : <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />}
                                    {loadingMore ? 'Loading More Stories...' : 'Load More Stories'}
                                </button>
                            </div>
                        )}

                        {/* Pagination Hint / "View Authors" prompt if many blogs exist */}
                        {!hasMore && blogs.length > 30 && (
                            <div className="mt-10 text-center border-t border-[var(--border-color)] pt-10">
                                <p className="text-lg text-[var(--text-secondary)] mb-6">You've reached the end of the list.</p>
                                <a href="/authors" className="px-8 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] font-bold hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm">
                                    Explore Our Authors Archive
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
