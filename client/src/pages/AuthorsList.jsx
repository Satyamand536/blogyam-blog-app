import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MembershipGate from '../components/MembershipGate';
import { Loader2, UserCheck, Shield } from 'lucide-react';

export default function AuthorsList() {
    const { user } = useAuth();
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuthors = async () => {
            try {
                const { data } = await api.get('/authors');
                if (data.success) {
                    setAuthors(data.authors);
                }
            } catch (error) {
                console.error("Failed to fetch authors", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuthors();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    if (!user) {
        return <MembershipGate title="Meet the Masters." message="Our author community is the heart of BlogYam. Join us to discover the brilliant minds behind these perspectives." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 transition-colors duration-500">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--text-primary)] mb-4">Our Writers</h1>
                <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">Meet the voices behind the stories. Explore their perspectives and wisdom.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {authors.map(author => (
                    <Link to={`/authors/${author._id}`} key={author._id} className="group">
                        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center h-full">
                            <div className="relative w-24 h-24 mb-4">
                                <img 
                                    src={`http://localhost:8000${author.profileImageURL}`} 
                                    alt={author.name} 
                                    className="w-full h-full rounded-full object-cover ring-4 ring-primary-50 dark:ring-primary-900/20 group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-[var(--bg-card)]" title="Verified Author">
                                    <UserCheck size={12} />
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 group-hover:text-primary-600 transition-colors">{author.name}</h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">{author.bio || "Writer & Thinker"}</p>
                            
                            <div className="mt-auto w-full pt-4 border-t border-[var(--border-color)]">
                                <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">View Profile</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {authors.length === 0 && (
                <div className="text-center text-[var(--text-secondary)] py-20">
                    <p>No authors found yet.</p>
                </div>
            )}
        </div>
    );
}
