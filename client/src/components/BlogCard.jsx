import { Clock, BarChart, Tag, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import { stripHtml } from '../utils/textUtils';
import OptimizedImage from './OptimizedImage';

const categoryColors = {
    'technology': 'bg-blue-50 text-blue-600 border-blue-100',
    'spiritual': 'bg-orange-50 text-orange-600 border-orange-100',
    'lifestyle': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'career': 'bg-purple-50 text-purple-600 border-purple-100',
    'poem': 'bg-rose-50 text-rose-600 border-rose-100',
    'general': 'bg-gray-50 text-gray-600 border-gray-100'
};

export default function BlogCard({ blog }) {
    const { user } = useAuth();
    const categoryKey = (blog.category || 'General').toLowerCase();
    const catClass = categoryColors[categoryKey] || categoryColors['general'];
    return (
        <div className="card group h-full flex flex-col overflow-hidden">
            <div className="relative aspect-video -mx-4 -mt-4 mb-4 sm:-mx-6 sm:-mt-6 overflow-hidden">
                <OptimizedImage 
                    src={blog.coverImageURL ? getImageUrl(blog.coverImageURL) : '/images/default-blog.png'} 
                    alt={blog.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackSrc="/images/default-blog.png"
                />
            </div>
            <div className="flex-1">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border premium-tag-fix ${catClass}`}>
                    <Tag size={10} />
                    {blog.category || 'General'}
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors mb-2 font-serif line-clamp-2">
                    <Link to={user ? `/blog/${blog._id}` : `/signup`} className="flex items-center gap-2">
                        {blog.title}
                        {!user && <Lock size={16} className="text-primary-600 shrink-0" />}
                    </Link>
                </h3>
                <p className="text-[var(--text-secondary)] text-sm line-clamp-3 mb-4">
                    {stripHtml(blog.body)}
                </p>
            </div>

            <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)] transition-colors duration-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <Clock size={14} /> {blog.readTime || 5} min
                    </span>
                    <span className="flex items-center gap-1">
                        <BarChart size={14} /> {blog.difficulty || 'Medium'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                     {blog.author ? (
                        <span>by {blog.author.name || (blog.author.email ? blog.author.email.split('@')[0] : 'User')}</span>
                     ) : (
                        <span>by Anonymous</span>
                     )}
                </div>
            </div>
        </div>
    );
}
