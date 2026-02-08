import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_URL } from '../api/axios';
import AIAssistant from '../components/AIAssistant';
import MembershipGate from '../components/MembershipGate';
import { Loader2, Heart, MessageCircle, Share2, Bookmark, Trash2, User, Tag, Sparkles, Edit3, Shield, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BlogReader() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [blog, setBlog] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [aiContext, setAiContext] = useState(null);

    // Comment State
    const [newComment, setNewComment] = useState('');
    const [reportingCommentId, setReportingCommentId] = useState(null);
    const [nominating, setNominating] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success', sticky: false });
    const [hasNominated, setHasNominated] = useState(false);
    const [unsaving, setUnsaving] = useState(false);

    const showNotification = (message, type = 'success', sticky = false) => {
        const safeMessage = typeof message === 'string' ? message : (message?.message || JSON.stringify(message) || "An unexpected error occurred");
        setNotification({ show: true, message: safeMessage, type, sticky });
        if (!sticky) {
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
        }
    };

    const dismissNotification = () => {
        setNotification(prev => ({ ...prev, show: false }));
    };

    useEffect(() => {
        console.log(`[BlogReader] Fetching blog for ID: ${id}`); // Added console.log as per instruction
        const fetchBlog = async () => {

            try {
                const { data } = await api.get(`/blogs/${id}`);
                if (data.success) {
                    setBlog(data.blog);
                    setComments(data.comments);
                    setLikeCount(data.blog.likes.length);
                    if (user) {
                        if (data.blog.likes.includes(user._id)) setLiked(true);
                        if (user.savedBlogs && user.savedBlogs.includes(data.blog._id)) {
                             setSaved(true);
                        }
                        // Check if nominated (Direct from API)
                        if (data.hasNominated) {
                             setHasNominated(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching blog", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [id, user]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection.toString();
        if (text.length > 5) {
            // Can show a mini popup near cursor here
        }
    };

    const handleSummarizeClick = () => {
        setAiContext({ prompt: "Summarize this blog for me.", type: 'summarize' });
    };

    const handleExplainClick = () => {
        const selection = window.getSelection();
        const text = selection.toString();
        if(text) setAiContext({ prompt: text, type: 'explain' });
    };

    const handleLike = async () => {
        if (!user) return;
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
        try {
             await api.post(`/blogs/${id}/like`);
             if (refreshUser) await refreshUser();
        } catch (error) {
            setLiked(!liked);
            setLikeCount(prev => liked ? prev + 1 : prev - 1);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        
        // If already saved, ask for confirmation to remove
        if (saved) {
            setUnsaving(true);
            return;
        }

        // If not saved, save immediately
        try {
            await api.post(`/blogs/${id}/save`);
            setSaved(true);
            if (refreshUser) await refreshUser();
            showNotification("Blog saved successfully!", "success");
        } catch (error) {
            console.error("Save failed", error);
            showNotification("Failed to save blog", "error");
        }
    };

    const confirmUnsave = async () => {
        try {
            await api.post(`/blogs/${id}/save`); // Toggle endpoint handles removal too
            setSaved(false);
            if (refreshUser) await refreshUser();
            showNotification("Blog removed from saved.", "success");
        } catch (error) {
            console.error("Unsave failed", error);
            showNotification("Failed to remove blog", "error");
        } finally {
            setUnsaving(false);
        }
    };

    const cancelUnsave = () => {
        setUnsaving(false);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this blog?")) return;
        try {
            const { data } = await api.delete(`/blogs/${id}`);
            if (data.success) {
                navigate('/');
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete blog");
        }
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const { data } = await api.post(`/blogs/${id}/comment`, { content: newComment });
            if (data.success) {
                // Construct comment object with current user info to avoid "Anonymous" flash
                // This ensures we don't have to wait for a refresh to see the user's name/avatar
                const commentWithUser = {
                    ...data.comment,
                    author: {
                        _id: user._id,
                        name: user.name,
                        profileImageURL: user.profileImageURL
                    }
                };
                setComments(prev => [commentWithUser, ...prev]); 
                setNewComment('');
            }
        } catch (error) {
            console.error("Comment failed", error);
        }
    };

    const handleReportClick = (commentId) => {
        setReportingCommentId(commentId);
    };

    const confirmReport = async (commentId) => {
        try {
            const { data } = await api.post(`/comments/${commentId}/report`);
            if (data.success) {
                alert(data.message);
                // Refresh comments to reflect status
                const { data: blogData } = await api.get(`/blogs/${id}`);
                setComments(blogData.comments);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to report comment");
        } finally {
            setReportingCommentId(null);
        }
    };

    const cancelReport = () => {
        setReportingCommentId(null);
    };
    const handleEditClick = (comment) => {
        setEditingCommentId(comment._id);
        setEditedContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditedContent('');
    };

    const handleSaveEdit = async (commentId) => {
        if (!editedContent.trim()) return;
        try {
            const { data } = await api.patch(`/comments/${commentId}`, { content: editedContent });
            if (data.success) {
                setComments(prev => prev.map(c => c._id === commentId ? { ...c, content: editedContent } : c));
                setEditingCommentId(null);
                setEditedContent('');
            }
        } catch (error) {
            console.error("Failed to update comment", error);
            alert(error.response?.data?.message || "Failed to update comment");
        }
    };

    const handleNominateClick = () => {
        setNominating(true);
    };

    const confirmNominate = async () => {
        if (!user) return;
        try {
            const { data } = await api.post(`/blogs/${id}/nominate`);
            if (data.success) {
                showNotification(data.message, 'success');
                setHasNominated(true);
            }
        } catch (error) {
            const isLimitError = error.response?.status === 429;
            const msg = error.response?.data?.message || "Nomination failed";
            
            // Show sticky error for limit to ensure user can read it
            showNotification(msg, 'error', isLimitError);
            
            // Only log if it's NOT a business logic limit error to keep console clean
            if (!isLimitError) {
                console.error("Nomination error:", error);
            }
        } finally {
            setNominating(false);
        }
    };

    const cancelNominate = () => {
        setNominating(false);
    };

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `${API_URL}${path}`;
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;
    if (!blog) return <div className="text-center py-20">Blog not found.</div>;

    // MEMBERSHIP GATE: Blogs are for community members only
    if (!user) {
        return <MembershipGate title="Legendary Story Found." message="This exclusive deep-dive is reserved for our community. Join us to read the full story and unlock AI tools." />;
    }

    return (
        <div className="min-h-screen transition-colors duration-500" onMouseUp={handleTextSelection}>
            {/* Context Menu Simulation Button */}
            <div className="fixed bottom-24 right-6 z-40">
                 <button onClick={handleExplainClick} className="bg-slate-950 dark:bg-primary-600 text-white text-xs px-4 py-2 rounded-full shadow-xl opacity-90 hover:opacity-100 mb-2 transition-all hover:scale-105 border border-white/10">
                    Selected something? Click to Explain
                 </button>
            </div>

            <AIAssistant contextContent={blog.body} initialContext={aiContext} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-6">
                        <span className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-md border border-primary-700 premium-tag-fix">
                            <Tag size={14} />
                            {blog.category || 'General'}
                        </span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[var(--text-primary)] leading-tight selection:bg-primary-100 dark:selection:bg-primary-900/30">
                        {blog.title}
                    </h1>

                    <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-[var(--text-secondary)] text-sm">
                         <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                         <span>•</span>
                         <span>{blog.readTime || 5} min read</span>
                         <span>•</span>
                         <span>{blog.difficulty || 'Medium'}</span>
                    </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-lg mb-10">
                    <img 
                        src={blog.coverImageURL ? getImageUrl(blog.coverImageURL) : '/images/default-blog.png'} 
                        alt={blog.title} 
                        className="w-full h-80 object-cover"
                    />
                </div>

                <article className="blog-content selection:bg-primary-100 dark:selection:bg-primary-900/30">
                    <div className="ql-editor-display">
                        <div dangerouslySetInnerHTML={{ __html: blog.body }} />
                    </div>
                </article>

                {/* Professional Author Signature */}
                <div className="mt-12 p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl flex items-center gap-6 animate-fade-in">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-100 flex-shrink-0 shadow-inner">
                        <img 
                            src={blog.author?.profileImageURL ? getImageUrl(blog.author.profileImageURL) : '/images/hacker.png'} 
                            alt={blog.author?.name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">Author</p>
                        <h4 className="text-xl font-serif font-bold text-[var(--text-primary)]">
                            Written by <span className="text-primary-600">{blog.author?.name || 'Anonymous'}</span>
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)] italic mt-1">{blog.author?.email}</p>
                    </div>
                </div>

                <style>{`
                    .ql-editor-display {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        font-size: 1.15rem;
                        line-height: 1.6;
                        color: var(--text-primary);
                        word-spacing: normal;
                        letter-spacing: -0.011em;
                        text-align: left;
                        text-rendering: optimizeLegibility;
                        overflow-wrap: break-word;
                    }
                    .ql-editor-display p {
                        margin-bottom: 1.5rem;
                    }
                    .ql-editor-display .ql-size-small { font-size: 0.75em; }
                    .ql-editor-display .ql-size-large { font-size: 1.5em; font-weight: 600; }
                    .ql-editor-display .ql-size-huge { font-size: 2.5em; font-weight: 800; line-height: 1.2; }
                    .ql-editor-display .ql-align-center { text-align: center; }
                    .ql-editor-display .ql-align-right { text-align: right; }
                    .ql-editor-display .ql-align-justify { text-align: left; }
                    .ql-editor-display pre.ql-syntax {
                        background-color: #1e293b;
                        color: #f8fafc;
                        padding: 1.5rem;
                        border-radius: 0.75rem;
                        overflow-x: auto;
                        font-family: 'Fira Code', 'Cascadia Code', monospace;
                        font-size: 0.9em;
                        margin: 2rem 0;
                        border: 1px solid rgba(255,255,255,0.1);
                    }
                    .ql-editor-display .ql-video {
                        width: 100%;
                        aspect-ratio: 16/9;
                        border-radius: 1rem;
                        margin: 2.5rem 0;
                        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                    }
                    .ql-editor-display blockquote {
                        border-left: 4px solid #4f46e5;
                        padding-left: 1.5rem;
                        font-style: italic;
                        margin: 2rem 0;
                        color: var(--text-secondary);
                    }
                    .ql-editor-display img {
                        border-radius: 1rem;
                        margin: 2rem auto;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    }
                    .ql-editor-display a {
                        color: #4f46e5;
                        text-decoration: underline;
                        text-underline-offset: 4px;
                    }
                    .dark .ql-editor-display a {
                        color: #818cf8;
                    }
                    /* nbsp fix */
                    .ql-editor-display p:empty::before {
                        content: "\\00a0";
                    }
                    .ql-editor-display * {
                        background-color: transparent !important;
                        color: inherit !important;
                        text-justify: none !important;
                        text-align: left !important;
                    }
                    .ql-editor-display p, .ql-editor-display span, .ql-editor-display div {
                        background: none !important;
                    }
                `}</style>

                <div className="border-t border-[var(--border-color)] mt-12 py-8 flex justify-between items-center">
                    <div className="flex gap-4">
                        <button 
                            onClick={handleLike}
                            title="Like this story"
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                                liked 
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-500' 
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-red-200'
                            }`}
                        >
                            <Heart size={20} className={liked ? 'fill-current' : ''} />
                            <span className="font-medium">{likeCount}</span>
                        </button>
                        
                        <button 
                            title="Comments"
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl transition-all duration-300"
                        >
                            <MessageCircle size={20} />
                            <span className="font-medium">{comments.length}</span>
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {unsaving ? (
                            <div className="flex items-center gap-2 animate-fade-in bg-red-50 dark:bg-red-900/10 px-3 py-1 rounded-full border border-red-200">
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Remove?</span>
                                <button 
                                    onClick={confirmUnsave}
                                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full transition-colors shadow-sm"
                                    title="Yes, Remove"
                                >
                                    Yes
                                </button>
                                <button 
                                    onClick={cancelUnsave}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 transition-colors"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleSave}
                                title={saved ? "Remove from saved" : "Save for later"}
                                className={`p-2 border rounded-xl transition-all duration-300 ${
                                    saved 
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-primary-200' 
                                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-primary-600 hover:bg-[var(--bg-primary)] border-[var(--border-color)]'
                                }`}
                            >
                                <Bookmark size={20} className={saved ? 'fill-current' : ''} />
                            </button>
                        )}
                        <div className="relative group">
                             <button 
                                onClick={() => {
                                    const url = window.location.href;
                                    const text = `Check out this blog: ${url}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                title="Share on WhatsApp"
                                className="p-2 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-primary-600 hover:bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl transition-all duration-300"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>
                        {user && blog && (
                             <div className="flex gap-2">
                                {/* Edit: Author Only */}
                                {user._id === blog.author?._id && (
                                    <Link 
                                        to={`/edit/${blog._id}`}
                                        title="Edit story"
                                        className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
                                    >
                                        <Edit3 size={20} />
                                    </Link>
                                )}
                                
                                {/* Delete: Author or Owner */}
                                {(user._id === blog.author?._id || user.role === 'owner') && (
                                    <button 
                                        onClick={handleDelete}
                                        title="Delete story"
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}


                                {/* Nominate: Any Logged-in User */}
                                {hasNominated ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800" title="You have nominated this story">
                                        <CheckCircle size={16} className="fill-current text-green-600 dark:text-green-400" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Nominated</span>
                                    </div>
                                ) : nominating ? (
                                    <div className="flex items-center gap-2 animate-fade-in bg-amber-50 dark:bg-amber-900/10 px-3 py-1 rounded-full border border-amber-200">
                                        <button 
                                            onClick={confirmNominate}
                                            className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-full transition-colors shadow-sm"
                                            title="Confirm Nomination"
                                        >
                                            Yes
                                        </button>
                                        <button 
                                            onClick={cancelNominate}
                                            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 transition-colors"
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleNominateClick}
                                        title="Nominate for Spotlight"
                                        className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors"
                                    >
                                        <Sparkles size={20} />
                                    </button>
                                )}
                             </div>
                        )}
                    </div>
                </div>

                <div className="mt-10 pt-10 border-t border-[var(--border-color)] dark:border-slate-800">
                    <h3 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-6">Discussion</h3>
                    
                    {/* Comment Form with User Info */}
                    {user ? (
                        <form onSubmit={submitComment} className="mb-8">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                    {user.profileImageURL ? (
                                        <img 
                                            src={getImageUrl(user.profileImageURL)} 
                                            alt={user.name || 'You'} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'block';
                                            }}
                                        />
                                    ) : null}
                                    <User size={20} className="text-primary-600" style={{ display: user.profileImageURL ? 'none' : 'block' }} />
                                </div>
                                <div className="flex-1">
                                    <textarea 
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder={`Comment as ${user.name || user.email?.split('@')[0] || 'User'}...`}
                                        className="w-full p-4 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-[var(--text-secondary)] opacity-80"
                                        rows={3}
                                    />
                                    <button 
                                        type="submit"
                                        className="mt-2 px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50"
                                        disabled={!newComment.trim()}
                                    >
                                        Post Comment
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-[var(--bg-card)] dark:bg-slate-800/30 p-6 rounded-xl text-center border border-[var(--border-color)] dark:border-slate-700/50 mb-8 transition-colors">
                            <p className="text-[var(--text-secondary)] mb-2">Please login to join the discussion</p>
                            <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">Login here</Link>
                        </div>
                    )}

                    <div className="space-y-6">
                        {comments.map(comment => (
                            <div key={comment._id} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                     {comment.author?.profileImageURL ? (
                                         <img 
                                             src={getImageUrl(comment.author.profileImageURL)} 
                                             alt={comment.author.name || 'User'} 
                                             className="w-full h-full object-cover"
                                             onError={(e) => {
                                                 e.target.style.display = 'none';
                                                 e.target.nextElementSibling.style.display = 'block';
                                             }}
                                         />
                                     ) : null}
                                     <User size={20} className="text-primary-600" style={{ display: comment.author?.profileImageURL ? 'none' : 'block' }} />
                                </div>
                                <div className="flex-1">
                                    <div className="bg-[var(--bg-card)] px-4 py-3 rounded-2xl rounded-tl-none border border-[var(--border-color)] transition-colors duration-500">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-[var(--text-primary)] text-sm">
                                                {comment.author?.name || (comment.author?.email ? comment.author.email.split('@')[0] : 'User')}
                                            </span>
                                            <span className="text-xs text-[var(--text-secondary)] opacity-60">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {comment.isHidden ? (
                                            <p className="text-[var(--text-secondary)] text-sm italic py-2 bg-slate-100 dark:bg-slate-800/50 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                                This comment has been hidden after multiple community reports.
                                            </p>
                                        ) : (
                                                    <>
                                                        {editingCommentId === comment._id ? (
                                                            <div className="mt-2 text-[var(--text-primary)]">
                                                                <textarea 
                                                                    value={editedContent}
                                                                    onChange={(e) => setEditedContent(e.target.value)}
                                                                    className="w-full p-3 bg-stone-50 dark:bg-slate-900 text-slate-950 dark:text-slate-100 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-inner"
                                                                    rows={3}
                                                                />
                                                                <div className="flex justify-end gap-2 mt-2">
                                                                    <button 
                                                                        onClick={handleCancelEdit}
                                                                        className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleSaveEdit(comment._id)}
                                                                        className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-1 rounded-lg transition-colors"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{comment.content}</p>
                                                        )}
        
                                                        <div className="mt-2 flex justify-between items-center">
                                                            {/* Edit Button for Author */}
                                                            {user && user._id === comment.author?._id && editingCommentId !== comment._id && (
                                                                <button 
                                                                    onClick={() => handleEditClick(comment)}
                                                                    className="text-[10px] font-bold text-slate-400 hover:text-primary-600 transition-colors flex items-center gap-1"
                                                                    title="Edit Comment"
                                                                >
                                                                    <Edit3 size={12} /> Edit
                                                                </button>
                                                            )}
                                                            
                                                            {/* Report Button (Right Aligned) - Hidden for your own comments */}
                                                            <div className="ml-auto">
                                                                {user && user._id !== comment.author?._id && (
                                                                    reportingCommentId === comment._id ? (
                                                                        <div className="flex items-center gap-3 animate-fade-in bg-red-50 dark:bg-red-900/10 px-3 py-1 rounded-lg">
                                                                            <span className="text-xs text-red-600 font-bold">Report this?</span>
                                                                            <button 
                                                                                onClick={() => confirmReport(comment._id)}
                                                                                className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md transition-colors"
                                                                            >
                                                                                Yes
                                                                            </button>
                                                                            <button 
                                                                                onClick={cancelReport}
                                                                                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 transition-colors"
                                                                            >
                                                                                No
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => handleReportClick(comment._id)}
                                                                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                                                                            title="Report inappropriate content"
                                                                        >
                                                                            <Shield size={10} /> Report
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Premium Toast Notification */}
            <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${notification.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
                <div className={`flex items-center gap-4 px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl border-2 ${
                    notification.type === 'success' 
                        ? 'bg-green-500/95 dark:bg-green-600/90 border-green-400 text-white' 
                        : 'bg-red-600/95 dark:bg-red-700/90 border-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={22} className="animate-bounce-short" /> : <AlertTriangle size={22} />}
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-wide">{notification.message}</span>
                        {notification.sticky && (
                           <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-0.5">Tip: Click X to Dismiss</span>
                        )}
                    </div>
                    <button 
                        onClick={dismissNotification}
                        className="ml-2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        title="Dismiss"
                    >
                        <X size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}
