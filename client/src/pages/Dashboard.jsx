import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_URL } from '../api/axios';
import BlogCard from '../components/BlogCard';
import { Loader2, Flame, BookOpen, PenTool, User as UserIcon, Mail, Calendar, Award, Bookmark, History, Trash2, Settings, Save, X, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PremiumModal from '../components/PremiumModal';
import MembershipGate from '../components/MembershipGate';

export default function Dashboard() {
    const { user: globalUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [dashboardUser, setDashboardUser] = useState(null);
    const [savedBlogs, setSavedBlogs] = useState([]);
    const [writtenBlogs, setWrittenBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recentHistory, setRecentHistory] = useState([]);
    const [myNominations, setMyNominations] = useState([]);
    
    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editFile, setEditFile] = useState(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    
    // Removal Confirmation State
    const [confirmingRemovalId, setConfirmingRemovalId] = useState(null);

    // Premium UI States
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        cancelText: '',
        onConfirm: () => {},
        type: 'info'
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const handleRemoveSaved = (blogId) => {
        setConfirmingRemovalId(blogId);
    };

    const executeRemoveSaved = async (blogId) => {
        try {
            const { data } = await api.post(`/blogs/${blogId}/save`);
            if (data.success) {
                // Remove from local state immediately
                setSavedBlogs(prev => prev.filter(item => item.blog._id !== blogId));
                setConfirmingRemovalId(null);
            }
        } catch (error) {
            console.error("Failed to remove saved blog", error);
            setModalConfig({
                isOpen: true,
                title: "Removal Failed",
                message: "Could not remove blog from saved list.",
                confirmText: "Close",
                cancelText: null,
                type: "danger",
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        }
    };
    
    const cancelRemoveSaved = () => {
        setConfirmingRemovalId(null);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        const formData = new FormData();
        formData.append('name', editName);
        formData.append('bio', editBio);
        if (editFile) formData.append('profileImage', editFile);

        try {
            const { data } = await api.patch('/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                setDashboardUser(prev => ({ ...prev, ...data.user }));
                setIsEditing(false);
                // Force reload of page or update AuthContext if needed, 
                // but local state update is enough for UI.
                window.location.reload(); // Quickest way to sync AuthContext and Navbar
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            setModalConfig({
                isOpen: true,
                title: "Update Failed",
                message: "We couldn't save your profile changes. Please check your connection and try again.",
                confirmText: "Understood",
                cancelText: null,
                type: "danger",
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleNominate = async (blogId) => {
        setModalConfig({
            isOpen: true,
            title: "Nominate for Spotlight?",
            message: "This will send your story to our editors for review. If selected, it will be showcased on the Home page!",
            confirmText: "Yes, Nominate",
            cancelText: "Maybe Later",
            type: "info",
            onConfirm: () => executeNomination(blogId)
        });
    };

    const executeNomination = async (blogId) => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
            const { data } = await api.post(`/blogs/${blogId}/nominate`);
            if (data.success) {
                setModalConfig({
                    isOpen: true,
                    title: "Nomination Sent!",
                    message: "Quality takes time. Our elite editors will review your masterpiece soon. Keep sharing your wisdom!",
                    confirmText: "Perfect",
                    cancelText: null,
                    type: "success",
                    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                });
                // Update local state to reflect nomination
                setWrittenBlogs(prev => prev.map(blog => 
                    blog._id === blogId ? { ...blog, nominationStatus: 'pending' } : blog
                ));
            }
        } catch (error) {
            console.error("Nomination failed", error);
            
            // Professional Limit Reached UI
            if (error.response?.status === 429) {
                setModalConfig({
                    isOpen: true,
                    title: "Nomination Limit Reached",
                    message: "You have reached your 7-day nomination limit. Great curation takes intent—focus on your best finds while your current nominees are in review!",
                    confirmText: "Understood",
                    cancelText: null,
                    type: "danger",
                    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                });
            } else {
                setModalConfig({
                    isOpen: true,
                    title: "Nomination Error",
                    message: error.response?.data?.message || "Something went wrong during nomination.",
                    confirmText: "Return",
                    cancelText: null,
                    type: "danger",
                    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                });
            }
        }
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await api.get('/user/dashboard');
                if (data.success) {
                    setStats(data.stats);
                    setDashboardUser(data.user);
                    setSavedBlogs(data.savedBlogs);
                    setRecentHistory(data.recentHistory || []);
                    setWrittenBlogs(data.writtenBlogs || []);
                    setMyNominations(data.myNominations || []);
                    setEditName(data.user.name);
                    setEditBio(data.user.bio || '');
                }
            } catch (error) {
                console.error("Fetch dashboard failed", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;

    if (!globalUser) {
        return <MembershipGate title="Commander's Deck." message="Your personal analytics, reading history, and saved masterpieces are waiting. Join the elite to claim your dashboard." />;
    }

    const displayUser = dashboardUser || globalUser;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-500">
            
            {/* Premium Hero Section */}
            <div className="relative mb-12 rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-1px">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="relative bg-[var(--bg-card)] rounded-[23px] overflow-hidden transition-colors duration-500">
                    <div className="h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 gap-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-800 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <img 
                                    src={displayUser?.profileImageURL ? `${API_URL}${displayUser.profileImageURL}` : '/images/hacker.png'} 
                                    alt="Profile" 
                                    className="relative w-32 h-32 rounded-full border-4 border-[var(--bg-card)] shadow-xl object-cover"
                                />
                            </div>
                            <div className="flex-1 text-center md:text-left mb-2">
                                <p className="text-primary-600 font-bold mb-1 uppercase tracking-wider text-sm">{getGreeting()},</p>
                                <h1 className="text-5xl font-serif font-black text-[var(--text-primary)] mb-2 tracking-tight">
                                    {displayUser?.name}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm">
                                        <Mail size={16} className="text-primary-600" /> 
                                        <span className="font-medium text-[var(--text-primary)]">{displayUser?.email}</span>
                                    </div>

                                    <button 
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-sm ${
                                            isEditing 
                                            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                            : 'bg-[var(--bg-primary)] text-primary-600 border border-[var(--border-color)] hover:border-primary-600'
                                        }`}
                                    >
                                        {isEditing ? <X size={16} /> : <Settings size={16} />}
                                        <span className="font-bold text-sm tracking-wide">{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                                    </button>
                                    
                                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm">
                                        <Calendar size={16} className="text-primary-600" /> 
                                        <span className="font-medium text-[var(--text-primary)] mb-0">
                                            Member since {displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md transform hover:scale-105 transition-transform">
                                        <Award size={16} /> 
                                        <span className="font-bold tracking-wide uppercase text-sm">
                                            {globalUser?.role || 'USER'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="mt-8 p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-xl space-y-6 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-primary-600 uppercase tracking-widest ml-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-5 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-600 outline-none transition-all"
                                            placeholder="Your Name (e.g. Satyam Tiwari)"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-primary-600 uppercase tracking-widest ml-1">Profile Photo</label>
                                        <label className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                            <Camera size={20} className="text-primary-600" />
                                            <span className="text-[var(--text-secondary)] text-sm font-medium">
                                                {editFile ? editFile.name : 'Change Photo'}
                                            </span>
                                            <input type="file" hidden onChange={(e) => setEditFile(e.target.files[0])} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary-600 uppercase tracking-widest ml-1">Professional Bio</label>
                                    <textarea 
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        className="w-full px-5 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-600 outline-none transition-all min-h-[100px]"
                                        placeholder="Write a short summary about your professional journey..."
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button 
                                        type="submit"
                                        disabled={updateLoading}
                                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-indigo-500/30 font-bold transform hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                        {updateLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            displayUser?.bio && (
                                <div className="mt-8 p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm hover:shadow-md transition-all animate-fade-in">
                                    <div className="flex items-center gap-2 mb-3 text-[var(--text-primary)] font-medium">
                                        <UserIcon size={18} className="text-primary-600" />
                                        <span>About Me</span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] leading-relaxed italic">
                                        "{displayUser.bio}"
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <div className="group relative bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-8 text-white shadow-lg transform transition hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition">
                        <Flame size={80} />
                    </div>
                    <p className="font-medium opacity-80 mb-2">Daily Streak</p>
                    <h3 className="text-5xl font-bold tracking-tight">{stats?.streak || 0} <span className="text-xl opacity-80 font-normal">Days</span></h3>
                    <div className="mt-4 pt-4 border-t border-white/20 text-sm opacity-80">
                        Top 5% of all readers
                    </div>
                </div>

                <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg transform transition hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition">
                        <BookOpen size={80} />
                    </div>
                    <p className="font-medium opacity-80 mb-2">Knowledge Gained</p>
                    <h3 className="text-5xl font-bold tracking-tight">{stats?.blogsRead || 0} <span className="text-xl opacity-80 font-normal">Blogs</span></h3>
                    <div className="mt-4 pt-4 border-t border-white/20 text-sm opacity-80">
                        Insights explored
                    </div>
                </div>

                <div className="group relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm transform transition hover:scale-[1.02] hover:shadow-xl transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition text-[var(--text-primary)]">
                        <PenTool size={80} />
                    </div>
                    <p className="text-[var(--text-secondary)] font-medium mb-2">Impact Made</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">{stats?.blogsWritten || 0}</h3>
                        <span className="text-sm text-[var(--text-secondary)] font-normal ml-0.5">published</span>
                    </div>
                    {(stats?.totalViews > 0) && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center gap-2 text-sm text-primary-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            {stats.totalViews} Total Impressions
                        </div>
                    )}
                </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                
                {/* Left Column: History & Stats Sidebar */}
                <div className="lg:col-span-1 border-r border-[var(--border-color)] pr-8 hidden lg:block">
                    <div className="sticky top-24">
                        <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] mb-8 flex items-center gap-2">
                            <History size={20} className="text-primary-600" /> Activity
                        </h2>
                        <div className="space-y-6">
                            <div className="p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
                                <p className="text-xs font-bold text-primary-600 uppercase mb-3 tracking-widest">Performance</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-secondary)]">Avg. Read Time</span>
                                        <span className="font-bold text-[var(--text-primary)]">5.2m</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-secondary)]">Retention Rate</span>
                                        <span className="font-bold text-[var(--text-primary)]">85%</span>
                                    </div>
                                    <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full overflow-hidden mt-4">
                                        <div className="bg-primary-600 h-full w-[85%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Content Lists */}
                <div className="lg:col-span-3 space-y-16">
                    
                    {/* Recently Read Section */}
                    <section>
                        <div className="flex justify-between items-end mb-8">
                            <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-3">
                                <History size={28} className="text-primary-600" /> Recently Read
                            </h2>
                            <Link to="/#latest-writings" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition">Explore More Blogs →</Link>
                        </div>
                        
                        {recentHistory.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {recentHistory.filter(h => h.blogId).map((historyItem) => (
                                    <Link 
                                        key={historyItem._id} 
                                        to={`/blog/${historyItem.blogId._id}`}
                                        className="flex group bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="w-1/3 overflow-hidden relative">
                                            <img 
                                                src={historyItem.blogId.coverImageURL ? `${API_URL}${historyItem.blogId.coverImageURL}` : '/images/default-blog.png'} 
                                                alt={historyItem.blogId.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col justify-center">
                                            <h3 className="font-serif font-bold text-lg text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors mb-4">
                                                {historyItem.blogId.title}
                                            </h3>
                                            <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex justify-between items-center">
                                                {historyItem.blogId.author && (
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary-600">
                                                        {historyItem.blogId.author.name?.split(' ')[0]}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                                                    READ ON {new Date(historyItem.readAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-[var(--bg-card)] rounded-[40px] border-2 border-dashed border-[var(--border-color)]">
                                <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-600">
                                    <BookOpen size={30} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Reading History Yet</h3>
                                <p className="text-[var(--text-secondary)] opacity-60">Your reading journey starts here. Explore blogs to build your history!</p>
                            </div>
                        )}
                    </section>

                    {/* Saved Blogs */}
                    <section>
                        <div className="flex justify-between items-end mb-8">
                            <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-3">
                                <Bookmark size={28} className="text-primary-600" /> Saved For Later
                            </h2>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">{savedBlogs.length} items curated</p>
                        </div>
                        
                        {savedBlogs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {savedBlogs.map(saved => (
                                    <div key={saved._id} className="relative group">
                                        <BlogCard blog={saved.blog} />
                                        {confirmingRemovalId === saved.blog._id ? (
                                            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 animate-fade-in bg-red-50 dark:bg-red-900/90 px-3 py-1.5 rounded-full border border-red-200 shadow-xl backdrop-blur-sm">
                                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest whitespace-nowrap">Remove?</span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        executeRemoveSaved(saved.blog._id);
                                                    }}
                                                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                                                    title="Yes, Remove"
                                                >
                                                    <span className="text-[10px] font-bold px-1">Yes</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        cancelRemoveSaved();
                                                    }}
                                                    className="px-2 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRemoveSaved(saved.blog._id);
                                                }}
                                                className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 z-10 transform translate-y-2 group-hover:translate-y-0"
                                                title="Remove from Saved"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-[var(--bg-card)] rounded-[40px] border-2 border-dashed border-[var(--border-color)]">
                                <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-600">
                                    <Bookmark size={30} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Your Library is Empty</h3>
                                <p className="text-[var(--text-secondary)] opacity-60">Bookmark blogs you love to see them here.</p>
                            </div>
                        )}
                    </section>

                    {/* My Published Stories (For Authors/Owners) */}
                    {globalUser?.role !== 'user' && (
                        <section className="animate-fade-in">
                            <div className="flex justify-between items-end mb-8">
                                <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-3">
                                    <PenTool size={28} className="text-primary-600" /> My Published Stories
                                </h2>
                                <Link to="/create" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition">Write New +</Link>
                            </div>
                            
                            {writtenBlogs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {writtenBlogs.map(blog => (
                                        <div key={blog._id} className="relative group">
                                            <BlogCard blog={blog} />
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 translate-y-2 group-hover:translate-y-0">
                                                <Link 
                                                    to={`/create/${blog._id}`}
                                                    className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-slate-400 hover:text-primary-500"
                                                    title="Edit Story"
                                                >
                                                    <Settings size={18} />
                                                </Link>
                                                {blog.nominationStatus === 'none' ? (
                                                    <button
                                                        onClick={() => handleNominate(blog._id)}
                                                        className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-slate-400 hover:text-orange-500"
                                                        title="Nominate for Spotlight"
                                                    >
                                                        <Award size={18} />
                                                    </button>
                                                ) : (
                                                    <div className={`p-2 rounded-full shadow-lg text-white ${blog.nominationStatus === 'pending' ? 'bg-orange-500' : 'bg-green-500'}`} title={blog.nominationStatus === 'pending' ? 'Nomination Pending' : 'Review Complete'}>
                                                        <Award size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-[var(--bg-card)] rounded-[40px] border-2 border-dashed border-[var(--border-color)]">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-600">
                                        <PenTool size={30} />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Stories Published Yet</h3>
                                    <p className="text-[var(--text-secondary)] opacity-60">Your journey as a storyteller begins with your first post!</p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* My Nominations Section */}
                    <section className="animate-fade-in relative">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-3">
                                    <Award size={28} className="text-amber-500" /> My Nominations
                                </h2>
                                <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mt-2 bg-amber-50 dark:bg-amber-900/10 px-3 py-1 rounded-full border border-amber-200/50 inline-block">
                                    Note: You can nominate up to 2 blogs every 7 days.
                                </p>
                            </div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">{myNominations.length} stories championed</p>
                        </div>
                        
                        {myNominations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {myNominations.map(nom => (
                                    <div key={nom._id} className="relative group">
                                        <BlogCard blog={nom.blog} />
                                        <div className="absolute top-4 right-4 z-10 transition-all duration-300">
                                            {nom.blog.nominationStatus === 'pending' ? (
                                                <div className="px-3 py-1.5 rounded-full shadow-lg bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                                    <Award size={12} />
                                                    Pending Review
                                                </div>
                                            ) : nom.blog.spotlight === 'bestOfWeek' ? (
                                                <div className="px-3 py-1.5 rounded-full shadow-lg bg-red-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border-2 border-amber-400">
                                                    <Award size={12} className="animate-pulse" />
                                                    Supreme Award
                                                </div>
                                            ) : nom.blog.spotlight === 'featured' ? (
                                                <div className="px-3 py-1.5 rounded-full shadow-lg bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border-2 border-amber-200">
                                                    <Award size={12} />
                                                    Elite Pick
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1.5 rounded-full shadow-lg bg-slate-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                                    <Award size={12} />
                                                    Reviewed - Not Selected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-[var(--bg-card)] rounded-[40px] border-2 border-dashed border-[var(--border-color)]">
                                <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-amber-600">
                                    <Award size={30} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Nominations Yet</h3>
                                <p className="text-[var(--text-secondary)] opacity-60">Spotlight masterpieces you find in the wild.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <PremiumModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                type={modalConfig.type}
            />
        </div>
    );
}
