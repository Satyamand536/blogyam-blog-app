import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { API_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MembershipGate from '../components/MembershipGate';
import { Loader2, Calendar } from 'lucide-react';
import BlogCard from '../components/BlogCard';

export default function AuthorProfile() {
    const { id } = useParams();
    const { user } = useAuth();
    const [author, setAuthor] = useState(null);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuthorData = async () => {
            try {
                const { data } = await api.get(`/authors/${id}/blogs`);
                if (data.success) {
                    setAuthor(data.author);
                    setBlogs(data.blogs);
                }
            } catch (error) {
                console.error("Failed to fetch author data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuthorData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    if (!author) return <div className="text-center py-20">Author not found</div>;

    if (!user) {
        return <MembershipGate title="Explore This Mind." message="Author profiles and their full story archives are reserved for members. Join BlogYam to explore their complete body of work." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-500">
            {/* Header / Profile Card */}
            <div className="bg-[var(--bg-card)] rounded-3xl p-8 mb-16 border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                    <img 
                        src={getImageUrl(author.profileImageURL)} 
                        alt={author.name} 
                        className="w-full h-full rounded-full object-cover ring-4 ring-primary-100 dark:ring-primary-900/30"
                    />
                </div>
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-2">{author.name}</h1>
                    <p className="text-[var(--text-secondary)] mb-6 text-lg max-w-2xl">{author.bio || "Sharing wisdom through words."}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-[var(--text-secondary)]">
                        <span className="flex items-center gap-2">
                            <Calendar size={16} />
                            Joined {new Date().getFullYear()} {/* Ideally fetching createdAt */}
                        </span>
                        <span className="font-semibold text-[var(--text-primary)]">
                            {blogs.length} Stories Published
                        </span>
                    </div>
                </div>
            </div>

            {/* Blogs List */}
            <h2 className="text-2xl font-bold font-serif text-[var(--text-primary)] mb-8 border-b border-[var(--border-color)] pb-4 inline-block">Published Stories</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map(blog => (
                    <BlogCard key={blog._id} blog={blog} />
                ))}
            </div>

            {blogs.length === 0 && (
                <div className="text-center text-[var(--text-secondary)] py-10 italic">
                    This author hasn't published any stories yet.
                </div>
            )}
        </div>
    );
}
