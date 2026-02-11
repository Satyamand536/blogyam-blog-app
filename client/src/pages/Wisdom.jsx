import { useEffect, useState } from 'react';
import api from '../api/axios';
import BlogCard from '../components/BlogCard';
import { Loader2, Sun, Book } from 'lucide-react';

export default function Wisdom() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWisdom = async () => {
            try {
                // Fetch only Spiritual category
                const { data } = await api.get('/blogs?category=Spiritual');
                if (data.success) {
                    setBlogs(data.blogs);
                }
            } catch (error) {
                console.error("Failed to fetch wisdom", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWisdom();
    }, []);

    // Mock Daily Scripture (In a real app, this could come from an API)
    const dailyScripture = {
        text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind.",
        source: "2 Timothy 1:7"
    };

    return (
        <div className="bg-[var(--bg-primary)] min-h-screen transition-colors duration-500">
            {/* Daily Wisdom Hero */}
            <div className="bg-wisdom-100 dark:bg-wisdom-900/20 py-20 px-4 text-center border-b border-wisdom-200 dark:border-wisdom-800 relative overflow-hidden transition-colors duration-500">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                     <Sun className="w-96 h-96 text-wisdom-500 absolute -top-20 -left-20 animate-spin-slow" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-wisdom-900 mb-6 relative z-10">
                    Daily Wisdom
                </h1>
                <div className="max-w-3xl mx-auto relative z-10">
                    <p className="text-xl md:text-2xl text-wisdom-900 font-serif leading-relaxed">
                        "{dailyScripture.text}"
                    </p>
                    <p className="mt-4 text-wisdom-900 font-bold uppercase tracking-widest text-sm">
                        — {dailyScripture.source}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-center gap-3 mb-10">
                    <Book className="text-wisdom-900 dark:text-wisdom-400" size={28} />
                    <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)]">Spiritual Readings</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-wisdom-500" size={40} />
                    </div>
                ) : (
                    <>
                        {blogs.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {blogs.map(blog => (
                                    <BlogCard key={blog._id} blog={blog} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-[var(--text-secondary)] font-serif opacity-80">"Silence is sometimes the best answer." — Dalai Lama</p>
                                <p className="mt-4 text-[var(--text-secondary)] text-sm opacity-60">(No spiritual blogs found yet. Be the first to write one!)</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
