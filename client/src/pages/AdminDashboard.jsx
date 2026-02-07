import { useState, useEffect } from 'react';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUtils';
import { Loader2, Shield, CheckCircle, XCircle, Star, User, Award, PenTool, Search } from 'lucide-react';
import PremiumModal from '../components/PremiumModal';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [spotlightQueue, setSpotlightQueue] = useState([]);
    const [activeSpotlight, setActiveSpotlight] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [spotlightLoading, setSpotlightLoading] = useState(null);
    
    // Direct Spotlight Search Power
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    
    // Moderation Inputs
    const [ipInput, setIpInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [banReason, setBanReason] = useState('');

    // Toast Notification
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

    useEffect(() => {
        fetchUsers();
        fetchSpotlightQueue();
        fetchActiveSpotlight();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            if (data.success) setUsers(data.users);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const fetchActiveSpotlight = async () => {
        try {
            const { data } = await api.get('/admin/active-spotlight');
            if (data.success) setActiveSpotlight(data.blogs);
        } catch (error) {
            console.error("Failed to fetch active spotlight", error);
        }
    };

    const fetchSpotlightQueue = async () => {
        try {
            const { data } = await api.get('/admin/spotlight-queue');
            if (data.success) setSpotlightQueue(data.nominations || []);
        } catch (error) {
            console.error("Failed to fetch spotlight queue", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'author' ? 'user' : 'author';
        
        setModalConfig({
            isOpen: true,
            title: currentRole === 'author' ? "Revoke Author Status?" : "Appoint as Author?",
            message: currentRole === 'author' 
                ? "This user will no longer be able to publish public blogs or nominate content. Are you sure?" 
                : "This user will gain the ability to publish stories and nominate them for the spotlight. Proceed?",
            confirmText: "Yes, Update",
            cancelText: "Cancel",
            type: currentRole === 'author' ? "danger" : "info",
            onConfirm: () => executeRoleUpdate(userId, currentRole)
        });
    };

    const executeRoleUpdate = async (userId, currentRole) => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const newRole = currentRole === 'author' ? 'user' : 'author';
        const endpoint = currentRole === 'author' ? `/admin/remove-author/${userId}` : `/admin/make-author/${userId}`;
        
        setActionLoading(userId);
        try {
            await api.patch(endpoint);
            // Optimistic update
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Failed to update role", error);
            setModalConfig({
                isOpen: true,
                title: "Update Failed",
                message: "We encountered an issue while updating the user role. Please try again later.",
                confirmText: "Understood",
                cancelText: null,
                type: "danger",
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleSetSpotlight = async (blogId, spotlight) => {
        // Confirmation first for elite actions
        if (spotlight !== 'none') {
            setModalConfig({
                isOpen: true,
                title: spotlight === 'bestOfWeek' ? 'Crown as Supreme Masterpiece?' : 'Appoint as Elite Pick?',
                message: `Are you sure you want to promote this story to ${spotlight === 'bestOfWeek' ? 'the Supreme Masterpiece' : 'Elite Picks'}? This will instantly refresh the Home discovery flow.`,
                confirmText: "Yes, Proceed",
                cancelText: "Not Now",
                type: spotlight === 'bestOfWeek' ? 'warning' : 'info',
                onConfirm: () => executeSpotlightUpdate(blogId, spotlight)
            });
        } else {
            setModalConfig({
                isOpen: true,
                title: "Remove from Spotlight?",
                message: "This blog will be returned to the standard feed. Are you sure you want to remove its featured status?",
                confirmText: "Yes, Remove",
                cancelText: "Keep Featured",
                type: "danger",
                onConfirm: () => executeSpotlightUpdate(blogId, spotlight)
            });
        }
    };

    const executeSpotlightUpdate = async (blogId, spotlight) => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setSpotlightLoading(blogId);
        try {
            const { data } = await api.patch(`/admin/spotlight/${blogId}`, { spotlight });
            if (data.success) {
                // If we're updating from the queue, we need to refresh the queue
                fetchSpotlightQueue();
                
                setActiveSpotlight(prev => {
                    const filtered = prev.filter(b => b._id !== blogId);
                    if (spotlight !== 'none') {
                        // Refresh active spotlight after update to ensure we have the new titles/authors
                        fetchActiveSpotlight();
                    }
                    return filtered;
                });
                // Show Success Modal
                setModalConfig({
                    isOpen: true,
                    title: "Success",
                    message: `The blog has been successfully ${spotlight === 'none' ? 'removed from spotlight' : 'promoted to ' + spotlight}.`,
                    confirmText: "Great",
                    cancelText: null,
                    type: "success",
                    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error("Failed to set spotlight", error);
            setModalConfig({
                isOpen: true,
                title: "Action Failed",
                message: error.response?.data?.message || "There was an error while updating the spotlight status.",
                confirmText: "Understood",
                cancelText: null,
                type: "danger",
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSpotlightLoading(null);
        }
    };

    const handleDirectSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const { data } = await api.get('/blogs', { params: { search: query, limit: 10 } });
            if (data.success) setSearchResults(data.blogs);
        } catch (error) {
            console.error("Direct search failed", error);
        } finally {
            setSearching(false);
        }
    };

    const handleModerationAction = async (type, value, reason) => {
        if (!value || value.trim() === '') {
            showToast(`${type === 'ip' ? 'IP Address' : type === 'email' ? 'Email Address' : 'User ID'} is required`, 'error');
            return;
        }

        setModalConfig({
            isOpen: true,
            title: `Execute ${type === 'ban' ? 'Account Suspension' : 'Access Blacklist'}?`,
            message: `Are you sure you want to block this ${type}? They will lose all access to the platform immediately.`,
            confirmText: "Yes, Block",
            cancelText: "Cancel",
            type: "danger",
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    let endpoint = '/admin/blacklist-ip';
                    let payload = { ip: value, reason };
                    
                    if (type === 'email') {
                        endpoint = '/admin/blacklist-email';
                        payload = { email: value, reason };
                    } else if (type === 'ban') {
                        endpoint = `/admin/ban-user/${value}`;
                        payload = { reason };
                    }

                    const { data } = await api.post(endpoint, payload);
                    if (data.success) {
                        showToast(data.message, 'success');
                        fetchUsers();
                        // Clear inputs
                        if (type === 'ip') setIpInput('');
                        if (type === 'email') setEmailInput('');
                    }
                } catch (error) {
                    showToast(error.response?.data?.message || "Moderation action failed", 'error');
                }
            }
        });
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-500">
            <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                <Shield className="text-primary-600" /> Admin Control Center
            </h1>

            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm mb-12">
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-between">
                    <h2 className="font-bold text-[var(--text-primary)]">User Management</h2>
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md uppercase tracking-wide">Platform Governance</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[var(--text-secondary)]">
                        <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {users.map(user => (
                                <tr key={user._id} className="hover:bg-[var(--bg-primary)] transition-colors">
                                    <td className="px-6 py-4 font-medium text-[var(--text-primary)] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                            {user.profileImageURL ? (
                                                <img src={getImageUrl(user.profileImageURL)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {(user.name || 'U')[0]}
                                                </div>
                                            )}
                                        </div>
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'author' ? 'bg-green-100 text-green-800' :
                                            'bg-slate-100 text-slate-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {user.role !== 'owner' && (
                                                <>
                                                    <button
                                                        onClick={() => toggleRole(user._id, user.role)}
                                                        disabled={actionLoading === user._id}
                                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                                                            user.role === 'author' 
                                                            ? 'text-amber-600 hover:bg-amber-50 border border-amber-200' 
                                                            : 'text-primary-600 hover:bg-primary-50 border border-primary-200'
                                                        }`}
                                                    >
                                                        {actionLoading === user._id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            user.role === 'author' ? "Demote" : "Promote"
                                                        )}
                                                    </button>
                                                    {!user.isBanned && (
                                                        <button
                                                            onClick={() => handleModerationAction('ban', user._id, 'Community management')}
                                                            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-all"
                                                        >
                                                            Ban
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Moderation Command Center */}
            <div className="bg-red-950/20 rounded-2xl p-8 mb-12 shadow-xl border border-red-500/20 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Shield size={120} className="text-red-500" />
                </div>
                
                <div className="relative z-10">
                    <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
                        <Shield className="text-red-500" /> Moderation Command Center
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-8 italic">Manual access control for high-risk IPs and malicious entities.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* IP Blacklist Form */}
                        <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-color)]">
                            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <XCircle className="text-red-500" size={18} /> Blacklist IP Address
                            </h3>
                            <div className="flex gap-2">
                                <input 
                                    value={ipInput}
                                    onChange={(e) => setIpInput(e.target.value)}
                                    type="text" 
                                    placeholder="e.g. 192.168.1.1"
                                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 transition-all outline-none"
                                />
                                <button 
                                    onClick={() => handleModerationAction('ip', ipInput, 'Manual IP block')}
                                    disabled={!ipInput}
                                    className="px-4 py-2 bg-red-600 text-white text-xs font-black uppercase rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Block IP
                                </button>
                            </div>
                        </div>

                        {/* Email Blacklist Form */}
                        <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-color)]">
                            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <Shield className="text-red-500" size={18} /> Blacklist Email Domain
                            </h3>
                            <div className="flex gap-2">
                                <input 
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    type="email" 
                                    placeholder="e.g. spam@ghost.com"
                                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 transition-all outline-none"
                                />
                                <button 
                                    onClick={() => handleModerationAction('email', emailInput, 'Manual Email block')}
                                    disabled={!emailInput}
                                    className="px-4 py-2 bg-red-600 text-white text-xs font-black uppercase rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Block Email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Direct Spotlight Search (Owner Superpower) */}
            <div className="bg-slate-900 rounded-2xl p-8 mb-12 shadow-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Shield size={120} className="text-white" />
                </div>
                
                <div className="relative z-10">
                    <h2 className="text-2xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <Star className="text-amber-400" /> Direct Spotlight Assignment
                    </h2>
                    <p className="text-slate-400 text-sm mb-8 italic">Search for any story to instantly promote it to the Home page Hero.</p>
                    
                    <div className="relative max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="text-slate-500" size={20} />
                        </div>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleDirectSearch(e.target.value)}
                            placeholder="Type title of the blog to crown..."
                            className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                        />
                        {searching && <Loader2 className="absolute right-4 top-4 animate-spin text-amber-500" size={20} />}
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                            {searchResults.map(blog => (
                                <div key={blog._id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between group hover:border-amber-500/50 transition-all">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-slate-200 font-bold truncate">{blog.title}</h4>
                                        <p className="text-slate-500 text-[10px] uppercase font-black">By {blog.author?.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleSetSpotlight(blog._id, 'bestOfWeek')}
                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg transition-all"
                                        >
                                            Supreme
                                        </button>
                                        <button 
                                            onClick={() => handleSetSpotlight(blog._id, 'featured')}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all"
                                        >
                                            Elite Pick
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Active Spotlight Management (Ownership Oversight) */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl mb-12 animate-fade-in delay-100">
                <div className="px-8 py-6 border-b border-[var(--border-color)] bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                             <PenTool className="text-amber-600" /> Active Spotlight Archive
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 italic">Manage currently featured masterpieces and the Weekly Crown</p>
                    </div>
                </div>
                
                <div className="p-8">
                    {activeSpotlight.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeSpotlight.map(blog => (
                                <div key={blog._id} className={`relative group rounded-3xl p-6 border transition-all duration-500 hover:shadow-2xl ${
                                    blog.spotlight === 'bestOfWeek' 
                                    ? 'bg-amber-50/30 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/50 shadow-amber-500/5' 
                                    : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
                                }`}>
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5 border ${
                                            blog.spotlight === 'bestOfWeek' 
                                            ? 'bg-amber-500 text-white border-amber-400' 
                                            : 'bg-indigo-600 text-white border-indigo-500'
                                        }`}>
                                            {blog.spotlight === 'bestOfWeek' ? (
                                                <><Award size={10} /> Supreme Award</>
                                            ) : (
                                                <><Star size={10} /> Elite Pick</>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className={`w-9 h-9 rounded-full overflow-hidden border-2 ${
                                            blog.spotlight === 'bestOfWeek' ? 'border-amber-400 shadow-amber-200' : 'border-indigo-100'
                                        }`}>
                                            <img 
                                                src={blog.author?.profileImageURL ? getImageUrl(blog.author.profileImageURL) : '/uploads/default-avatar.png'} 
                                                alt="" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{blog.author?.name}</p>
                                            <p className={`text-[8px] font-bold uppercase ${blog.spotlight === 'bestOfWeek' ? 'text-amber-600' : 'text-indigo-500'}`}>
                                                {blog.spotlight === 'bestOfWeek' ? 'Crowned Master' : 'Elite Author'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <h4 className="font-serif font-bold text-[var(--text-primary)] text-base line-clamp-2 min-h-[2.5rem] leading-tight group-hover:text-primary-600 transition-colors">
                                            {blog.title}
                                        </h4>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-[var(--border-color)]">
                                        <button 
                                            onClick={() => handleSetSpotlight(blog._id, 'none')}
                                            disabled={spotlightLoading === blog._id}
                                            className="w-full py-2 bg-slate-100/80 text-slate-600 hover:bg-red-600 hover:text-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-red-600 dark:hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
                                        >
                                            <XCircle size={14} /> Unset Spotlight
                                        </button>
                                    </div>
                                    
                                    {spotlightLoading === blog._id && (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[2px] rounded-[1.5rem] flex items-center justify-center z-20">
                                            <Loader2 className="animate-spin text-primary-600" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 flex flex-col items-center bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-[var(--border-color)]">
                            <PenTool size={32} className="text-slate-300 mb-2" />
                            <p className="text-sm text-[var(--text-secondary)] font-medium">Spotlight Archive is currently empty.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Spotlight Curation Deck */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl animate-fade-in">
                <div className="px-8 py-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-card)] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                             <Award className="text-amber-500" /> Spotlight Curation Deck
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 italic">Review nominations and select the elite 1%</p>
                    </div>
                </div>

                <div className="p-8">
                    {spotlightQueue.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {spotlightQueue.map(group => {
                                const blog = group.blog;
                                const nominators = group.nominators;
                                if (!blog) return null;

                                return (
                                    <div key={blog._id} className="relative group bg-[var(--bg-primary)] rounded-3xl p-6 border border-[var(--border-color)] hover:shadow-2xl hover:border-amber-400/50 transition-all duration-500 overflow-hidden">
                                        {/* Dynamic Gradient Background on Hover */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-indigo-600 rounded-3xl blur opacity-0 group-hover:opacity-10 transition duration-1000 group-hover:duration-200"></div>

                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-200 shadow-sm">
                                                        <img 
                                                            src={blog.author?.profileImageURL ? getImageUrl(blog.author.profileImageURL) : '/uploads/default-avatar.png'} 
                                                            alt={blog.author?.name} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">{blog.author?.name || 'Anonymous'}</p>
                                                        <p className="text-[9px] text-amber-600 font-bold uppercase">Original Author</p>
                                                    </div>
                                                </div>
                                                {/* Multi-Nominator Avatars */}
                                                <div className="flex -space-x-3 hover:space-x-1 transition-all">
                                                    {nominators.map((nominator, idx) => (
                                                        <div key={idx} className="w-8 h-8 rounded-full border-2 border-[var(--bg-primary)] shadow-sm bg-indigo-50 flex items-center justify-center overflow-hidden z-[10]">
                                                            <img 
                                                                src={nominator?.profileImageURL ? getImageUrl(nominator.profileImageURL) : '/uploads/default-avatar.png'} 
                                                                alt={nominator?.name} 
                                                                className="w-full h-full object-cover" 
                                                                title={nominator?.name}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <div className="flex flex-col gap-2 mb-3">
                                                    <span className="px-2 py-0.5 bg-indigo-100/50 text-indigo-700 text-[8px] font-black uppercase rounded-md w-fit">
                                                        {nominators.length} {nominators.length === 1 ? 'Nomination' : 'Collective Nominations'}
                                                    </span>
                                                    <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-tighter line-clamp-1">
                                                        By: {nominators.map(n => n.name).join(', ')}
                                                    </p>
                                                </div>
                                                <h4 className="font-serif font-bold text-[var(--text-primary)] text-lg line-clamp-2 min-h-[3.5rem] group-hover:text-amber-600 transition-colors">
                                                    {blog.title}
                                                </h4>
                                            </div>

                                            <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-color)]">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleSetSpotlight(blog._id, 'bestOfWeek')}
                                                        disabled={spotlightLoading === blog._id}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <Award size={14} /> Supreme
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSetSpotlight(blog._id, 'featured')}
                                                        disabled={spotlightLoading === blog._id}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <Star size={14} /> Elite Pick
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => handleSetSpotlight(blog._id, 'none')}
                                                    disabled={spotlightLoading === blog._id}
                                                    className="w-full py-2 bg-[var(--bg-primary)] text-slate-500 hover:text-red-600 border border-[var(--border-color)] hover:border-red-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Dismiss Nomination
                                                </button>
                                            </div>
                                            
                                            {spotlightLoading === blog._id && (
                                                <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-[4px] rounded-3xl flex items-center justify-center z-20">
                                                    <Loader2 className="animate-spin text-primary-600" size={32} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <Award size={32} />
                            </div>
                            <h3 className="font-bold text-[var(--text-primary)]">All Caught Up!</h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">There are no new nominations to review right now. Everything is in order.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Infrastructure */}
            <PremiumModal 
                {...modalConfig} 
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
            />
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up ${
                    toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}>
                    {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
                    <span className="font-bold">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
