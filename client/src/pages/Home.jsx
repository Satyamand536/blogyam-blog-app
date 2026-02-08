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
                            <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Award size={18} /> Supreme Masterpiece
                            </h2>
                            <div className="h-px bg-gradient-to-r from-amber-500/50 to-transparent flex-1"></div>
                        </div>
                        
                        <div className="group relative bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-indigo-500/20 border border-white/5">
                            <div className="flex flex-col lg:flex-row min-h-[550px]">
                                <div className="w-full lg:w-[55%] relative group-hover:scale-105 transition-transform duration-1000">
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent z-10 hidden lg:block" />
                                    <img 
                                        src={getImageUrl(bestOfWeek.coverImageURL)} 
                                        alt={bestOfWeek.title} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-6 left-6 z-20">
                                        <div className="px-5 py-2 bg-amber-500 text-white font-black text-xs rounded-full uppercase tracking-widest shadow-xl flex items-center gap-2 animate-pulse">
                                            <Award size={14} /> Supreme Award
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full lg:w-[45%] p-10 lg:p-16 flex flex-col justify-center text-white relative z-20">
                                    <div className="flex items-center gap-3 mb-6 text-indigo-300 font-bold uppercase tracking-widest text-xs">
                                        <span>{bestOfWeek.category}</span>
                                        <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                                        <span>{bestOfWeek.readTime} min read</span>
                                    </div>
                                    <h3 
                                        className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-8 leading-[1.1] hover:text-amber-400 transition-colors cursor-pointer"
                                        onClick={() => handleBlogClick(bestOfWeek._id)}
                                    >
                                        {bestOfWeek.title}
                                    </h3>
                                    <p className="text-slate-300 text-lg leading-relaxed mb-10 opacity-80 line-clamp-3 font-serif italic">
                                        "{stripHtml(bestOfWeek.body).slice(0, 180)}..."
                                    </p>
                                    <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-6">
                                        <div className="flex items-center gap-5">
                                            <img 
                                                src={getImageUrl(bestOfWeek.author.profileImageURL)} 
                                                alt={bestOfWeek.author.name} 
                                                className="w-16 h-16 rounded-full border-2 border-amber-500/50 object-cover shrink-0 shadow-lg"
                                            />
                                            <div className="flex flex-col">
                                                <p className="font-bold text-xl text-white">{bestOfWeek.author.name}</p>
                                                <p className="text-xs text-amber-500 font-black uppercase tracking-[0.2em]">Master Author</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex sm:justify-start">
                                            <button 
                                                onClick={() => handleBlogClick(bestOfWeek._id)} 
                                                className="px-10 py-4 bg-white text-slate-900 rounded-full font-black uppercase tracking-widest text-sm hover:bg-amber-500 hover:text-white transition-all transform hover:scale-105 shadow-xl"
                                            >
                                                Explore Masterpiece
                                            </button>
                                        </div>
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
                            <h2 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <PenTool size={18} /> Elite Selects
                            </h2>
                            <div className="h-px bg-gradient-to-r from-indigo-500/30 to-transparent flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {featuredBlogs.map(blog => (
                                <div key={blog._id} className="group cursor-pointer" onClick={() => handleBlogClick(blog._id)}>
                                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 border border-[var(--border-color)] shadow-lg group-hover:shadow-2xl transition-all duration-500">
                                        <img 
                                            src={getImageUrl(blog.coverImageURL)} 
                                            alt={blog.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest self-start mb-4">
                                                {blog.category}
                                            </span>
                                            <h4 className="text-xl font-serif font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary-400 transition-colors">
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
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 scale-105' 
                                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-primary-600 hover:text-primary-600'
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
