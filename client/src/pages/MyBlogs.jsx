import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MembershipGate from '../components/MembershipGate';
import api from '../api/axios';
import { Loader2, Lock, Globe } from 'lucide-react';
import BlogCard from '../components/BlogCard';

export default function MyBlogs() {
    const { user } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyBlogs = async () => {
            try {
                const { data } = await api.get('/user/blogs');
                if (data.success) {
                    setBlogs(data.blogs);
                }
            } catch (error) {
                console.error("Failed to fetch my blogs", error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchMyBlogs();
        else setLoading(false);
    }, [user]);

    if (!user) {
        return <MembershipGate title="Your Studio Awaits." message="Manage your stories and visibility in your personal studio. Join the community to start your writing journey." />;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 md:pt-10 transition-colors duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-4">
                <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)]">My Stories</h1>
                <Link to="/create" className="btn-primary">Write New Story</Link>
            </div>

            {blogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map(blog => (
                        <div key={blog._id} className="relative group">
                            <BlogCard blog={blog} />
                            {/* Visibility Badge Overlay */}
                            <div className="absolute top-4 right-4 z-10 flex gap-2">
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                                    blog.visibility === 'private' 
                                    ? 'bg-red-100/90 text-red-700 border border-red-200' 
                                    : 'bg-green-100/90 text-green-700 border border-green-200'
                                }`}>
                                    {blog.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                                    {blog.visibility === 'private' ? 'Private' : 'Public'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border-2 border-dashed border-[var(--border-color)]">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Stories Yet</h3>
                    <p className="text-[var(--text-secondary)] mb-6">Share your ideas with the world.</p>
                    <Link to="/create" className="text-primary-600 hover:text-primary-700 font-medium">Start Writing →</Link>
                </div>
            )}
        </div>
    );
}
