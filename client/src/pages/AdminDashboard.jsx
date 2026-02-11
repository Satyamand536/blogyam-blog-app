import { useState, useEffect } from 'react';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUtils';
import { Loader2, Shield, CheckCircle, XCircle, Star, User, Award, PenTool, Search, AlertTriangle } from 'lucide-react';
import PremiumModal from '../components/PremiumModal';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [spotlightQueue, setSpotlightQueue] = useState([]);
    const [activeSpotlight, setActiveSpotlight] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [spotlightLoading, setSpotlightLoading] = useState(null);
    const [reports, setReports] = useState([]);
    const [activeTab, setActiveTab] = useState('users'); // users, spotlight, reports, moderation
    
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
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const { data } = await api.get('/admin/reports');
            if (data.success) setReports(data.reports);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        }
    };

    const handleBan = async (userId) => {
        if (!window.confirm("CAUTION: Are you sure you want to BAN this user? They will lose access to their account immediately.")) return;
        try {
            const { data } = await api.post(`/admin/ban-user/${userId}`);
            if (data.success) {
                setUsers(data.users); // Assuming the API returns updated user list or we need to refetch
                showToast("User banned successfully!", 'success');
            }
        } catch (error) {
            console.error("Failed to ban user", error);
            showToast(error.response?.data?.message || "Failed to ban user", 'error');
        }
    };

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
            showToast(`User role updated to ${newRole}!`, 'success');
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
        // ENTERPRISE UI VALIDATION
        if (!value || value.trim() === '') {
            showToast(`${type === 'ip' ? 'IP Address' : type === 'email' ? 'Email Address' : 'User ID'} is required`, 'error');
            return;
        }

        if (type === 'ip') {
            const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
            if (!ipRegex.test(value.trim())) {
                showToast("Write valid IP address for block IP button", 'warning');
                return;
            }
        }

        if (type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.trim())) {
                showToast("Write valid Email for block email button", 'warning');
                return;
            }
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

    const handlePromote = async (userId) => {
        if (!window.confirm("Bhai, are you sure you want to promote this user to Author? This will allow them to publish public blogs.")) return;
        try {
            const { data } = await api.patch(`/admin/make-author/${userId}`);
            if (data.success) {
                setUsers(users.map(u => u._id === userId ? { ...u, role: 'author' } : u));
                showToast("User promoted to Author successfully!", 'success');
            }
        } catch (error) {
            console.error("Failed to promote user to author", error);
            showToast(error.response?.data?.message || "Failed to promote user", 'error');
        }
    };

    const handleDismissReport = async (reportId) => {
        try {
            const { data } = await api.patch(`/admin/reports/${reportId}/dismiss`);
            if (data.success) {
                showToast("Report dismissed", 'success');
                setReports(prev => prev.filter(r => r._id !== reportId));
            }
        } catch (error) {
            showToast("Failed to dismiss report", 'error');
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 md:pt-10 transition-colors duration-500">
            <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                <Shield className="text-primary-600" /> Admin Control Center
            </h1>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-[var(--border-color)] pb-4">
                {[
                    { id: 'users', label: 'Users', icon: User },
                    { id: 'spotlight', label: 'Spotlight', icon: Star },
                    { id: 'reports', label: 'Reports', icon: Shield, count: reports.length },
                    { id: 'moderation', label: 'Moderation', icon: Shield }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)]'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] animate-pulse">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'users' && (
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm mb-12 animate-fade-in text-[var(--text-primary)]">
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-between">
                    <h2 className="font-bold text-[var(--text-primary)]">User Management</h2>
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md uppercase tracking-wide">Platform Governance</span>
                </div>
                
                {/* Responsive Table for Desktop */}
                <div className="hidden md:block overflow-x-auto">
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
                                        <span className="truncate max-w-[150px]">{user.name}</span>
                                    </td>
                                    <td className="px-6 py-4 truncate max-w-[200px]">{user.email}</td>
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

                {/* Card-based Mobile View */}
                <div className="md:hidden divide-y divide-[var(--border-color)]">
                    {users.map(user => (
                        <div key={user._id} className="p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                    {user.profileImageURL ? (
                                        <img src={getImageUrl(user.profileImageURL)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">
                                            {(user.name || 'U')[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-[var(--text-primary)] truncate">{user.name}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                                </div>
                                <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'author' ? 'bg-green-100 text-green-800' :
                                    'bg-slate-100 text-slate-800'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                            
                            {user.role !== 'owner' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleRole(user._id, user.role)}
                                        disabled={actionLoading === user._id}
                                        className={`flex-1 min-h-[48px] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border flex items-center justify-center gap-2 ${
                                            user.role === 'author' 
                                            ? 'text-amber-600 border-amber-200 bg-amber-50/50' 
                                            : 'text-primary-600 border-primary-200 bg-primary-50/50'
                                        }`}
                                    >
                                        {actionLoading === user._id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            user.role === 'author' ? "Demote to User" : "Promote to Author"
                                        )}
                                    </button>
                                    {!user.isBanned && (
                                        <button
                                            onClick={() => handleModerationAction('ban', user._id, 'Community management')}
                                            className="flex-1 min-h-[48px] text-[10px] font-black uppercase tracking-widest rounded-xl text-red-600 border border-red-200 bg-red-50/50 transition-all flex items-center justify-center"
                                        >
                                            Ban User
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                </div>
            )}

            {activeTab === 'moderation' && (
                <div className="animate-fade-in">
                    {/* Moderation Command Center */}
                    <div className="bg-red-950/20 rounded-2xl p-4 sm:p-8 mb-12 shadow-xl border border-red-500/20 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Shield size={120} className="text-red-500" />
                </div>
                
                <div className="relative z-10">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
                        <Shield className="text-red-500" size={24} /> Moderation Commands
                    </h2>
                    <p className="text-[var(--text-secondary)] text-xs sm:text-sm mb-6 sm:mb-8 italic">Manual access control for high-risk IPs and malicious entities.</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        {/* IP Blacklist Form */}
                        <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-xl border border-[var(--border-color)]">
                            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <XCircle className="text-red-500" size={18} /> Blacklist IP
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    value={ipInput}
                                    onChange={(e) => setIpInput(e.target.value)}
                                    type="text" 
                                    placeholder="e.g. 192.168.1.1"
                                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 sm:py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 transition-all outline-none"
                                />
                                <button 
                                    onClick={() => handleModerationAction('ip', ipInput, 'Manual IP block')}
                                    disabled={!ipInput}
                                    className="px-6 py-3 sm:py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Block IP
                                </button>
                            </div>
                        </div>

                        {/* Email Blacklist Form */}
                        <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-xl border border-[var(--border-color)]">
                            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <Shield className="text-red-500" size={18} /> Blacklist Email
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    type="email" 
                                    placeholder="e.g. spam@ghost.com"
                                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 sm:py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 transition-all outline-none"
                                />
                                <button 
                                    onClick={() => handleModerationAction('email', emailInput, 'Manual Email block')}
                                    disabled={!emailInput}
                                    className="px-6 py-3 sm:py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Block Email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                </div>
            )}

            {activeTab === 'spotlight' && (
                <div className="animate-fade-in">
                    {/* Direct Spotlight Search (Owner Superpower) */}
                    <div className="bg-slate-900 rounded-2xl p-4 sm:p-8 mb-12 shadow-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Shield size={120} className="text-white" />
                        </div>
                        
                        <div className="relative z-10">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                                <Star className="text-amber-400" size={24} /> Spotlight Assignment
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 italic">Search for any story to instantly promote it to the Home page Hero.</p>
                            
                            <div className="relative max-w-2xl">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="text-slate-500" size={20} />
                                </div>
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleDirectSearch(e.target.value)}
                                    placeholder="Type title to crown..."
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-4 py-3 sm:py-4 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-600 text-sm"
                                />
                                {searching && <Loader2 className="absolute right-4 top-3 sm:top-4 animate-spin text-amber-500" size={20} />}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
                                    {searchResults.map(blog => (
                                        <div key={blog._id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-amber-500/50 transition-all gap-3">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="text-slate-200 font-bold truncate text-sm sm:text-base">{blog.title}</h4>
                                                <p className="text-slate-500 text-[9px] uppercase font-black">By {blog.author?.name}</p>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button 
                                                    onClick={() => handleSetSpotlight(blog._id, 'bestOfWeek')}
                                                    className="flex-1 sm:flex-none px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider"
                                                >
                                                    Supreme
                                                </button>
                                                <button 
                                                    onClick={() => handleSetSpotlight(blog._id, 'featured')}
                                                    className="flex-1 sm:flex-none px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all uppercase tracking-wider"
                                                >
                                                    Elite
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Spotlight Management */}
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl mb-12">
                        <div className="px-4 sm:px-8 py-6 border-b border-[var(--border-color)] bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-between">
                            <div>
                                <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                                     <PenTool className="text-amber-600" size={20} /> Active Spotlight
                                </h2>
                            </div>
                        </div>
                        
                        <div className="p-4 sm:p-8">
                            {activeSpotlight.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {activeSpotlight.map(blog => (
                                        <div key={blog._id} className={`relative group rounded-3xl p-5 sm:p-6 border transition-all duration-500 hover:shadow-2xl ${
                                            blog.spotlight === 'bestOfWeek' 
                                            ? 'bg-amber-50/30 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/50 shadow-amber-500/5' 
                                            : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
                                        }`}>
                                            <div className="absolute top-4 right-4 z-10">
                                                <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.1em] shadow-sm flex items-center gap-1 border ${
                                                    blog.spotlight === 'bestOfWeek' 
                                                    ? 'bg-amber-500 text-white border-amber-400' 
                                                    : 'bg-indigo-600 text-white border-indigo-500'
                                                }`}>
                                                    {blog.spotlight === 'bestOfWeek' ? <Award size={10} /> : <Star size={10} />}
                                                    {blog.spotlight === 'bestOfWeek' ? 'Supreme' : 'Elite'}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mb-4 sm:mb-5">
                                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 ${
                                                    blog.spotlight === 'bestOfWeek' ? 'border-amber-400' : 'border-indigo-100'
                                                }`}>
                                                    <img 
                                                        src={blog.author?.profileImageURL ? getImageUrl(blog.author.profileImageURL) : '/uploads/default-avatar.png'} 
                                                        alt="" 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight line-clamp-1">{blog.author?.name}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-6">
                                                <h4 className="font-serif font-bold text-[var(--text-primary)] text-sm sm:text-base line-clamp-2 min-h-[2.5rem] leading-tight group-hover:text-primary-600 transition-colors">
                                                    {blog.title}
                                                </h4>
                                            </div>
                                            
                                            <div className="pt-4 border-t border-[var(--border-color)]">
                                                <button 
                                                    onClick={() => handleSetSpotlight(blog._id, 'none')}
                                                    disabled={spotlightLoading === blog._id}
                                                    className="w-full py-2.5 bg-slate-100/80 text-slate-600 hover:bg-red-600 hover:text-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-red-600 dark:hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
                                                >
                                                    <XCircle size={14} /> Unset
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
                                <div className="text-center py-10 sm:py-16 flex flex-col items-center bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-[var(--border-color)]">
                                    <PenTool size={32} className="text-slate-300 mb-2" />
                                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Archive is empty.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Spotlight Curation Deck */}
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl animate-fade-in">
                        <div className="px-4 sm:px-8 py-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-card)] flex items-center justify-between">
                            <div>
                                <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                                     <Award className="text-amber-50" size={20} /> Curation Deck
                                </h2>
                            </div>
                        </div>

                        <div className="p-4 sm:p-8">
                            {spotlightQueue.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {spotlightQueue.map(group => {
                                        const blog = group.blog;
                                        const nominators = group.nominators;
                                        if (!blog) return null;

                                        return (
                                            <div key={blog._id} className="relative group bg-[var(--bg-primary)] rounded-3xl p-5 sm:p-6 border border-[var(--border-color)] hover:shadow-2xl hover:border-amber-400/50 transition-all duration-500 overflow-hidden">
                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-200 shadow-sm">
                                                                <img 
                                                                    src={blog.author?.profileImageURL ? getImageUrl(blog.author.profileImageURL) : '/uploads/default-avatar.png'} 
                                                                    alt={blog.author?.name} 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">{blog.author?.name || 'Anonymous'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex -space-x-3">
                                                            {nominators.slice(0, 3).map((nominator, idx) => (
                                                                <div key={idx} className="w-7 h-7 rounded-full border-2 border-[var(--bg-primary)] shadow-sm bg-indigo-50 flex items-center justify-center overflow-hidden">
                                                                    <img 
                                                                        src={nominator?.profileImageURL ? getImageUrl(nominator.profileImageURL) : '/uploads/default-avatar.png'} 
                                                                        alt={nominator?.name} 
                                                                        className="w-full h-full object-cover" 
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <span className="px-2 py-0.5 bg-indigo-100/50 text-indigo-700 text-[8px] font-black uppercase rounded-md mb-2 inline-block">
                                                            {nominators.length} {nominators.length === 1 ? 'Nomination' : 'Nominations'}
                                                        </span>
                                                        <h4 className="font-serif font-bold text-[var(--text-primary)] text-sm sm:text-base line-clamp-2 min-h-[2.5rem] group-hover:text-amber-600 transition-colors">
                                                            {blog.title}
                                                        </h4>
                                                    </div>

                                                    <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border-color)]">
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleSetSpotlight(blog._id, 'bestOfWeek')}
                                                                disabled={spotlightLoading === blog._id}
                                                                className="flex-1 flex items-center justify-center gap-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/10 transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                Supreme
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSetSpotlight(blog._id, 'featured')}
                                                                disabled={spotlightLoading === blog._id}
                                                                className="flex-1 flex items-center justify-center gap-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                Elite
                                                            </button>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleSetSpotlight(blog._id, 'none')}
                                                            disabled={spotlightLoading === blog._id}
                                                            className="w-full py-2.5 bg-[var(--bg-primary)] text-slate-500 hover:text-red-600 border border-[var(--border-color)] text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            Dismiss
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
                                <div className="text-center py-10 flex flex-col items-center">
                                    <h3 className="font-bold text-[var(--text-primary)] text-sm">No nominations.</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'reports' && (
                <div className="animate-fade-in">
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl mb-12">
                        <div className="px-4 sm:px-8 py-6 border-b border-[var(--border-color)] bg-gradient-to-r from-red-500/10 to-transparent flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Shield className="text-red-600" size={20} /> Community Reports
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                {reports.length} Priority {reports.length === 1 ? 'Alert' : 'Alerts'}
                            </span>
                        </div>

                        <div className="p-4 sm:p-8">
                            {reports.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {reports.map(report => (
                                        <div key={report._id} className="bg-[var(--bg-primary)] rounded-3xl p-6 border border-[var(--border-color)] hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                                            {/* Report Count Badge */}
                                            <div className="absolute top-0 right-0 p-4">
                                                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                                                    <AlertTriangle size={12} /> {report.reportCount} Reports
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-red-100">
                                                            <img 
                                                                src={report.author?.profileImageURL ? getImageUrl(report.author.profileImageURL) : '/uploads/default-avatar.png'} 
                                                                alt="" 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-[var(--text-primary)]">By {report.author?.name}</h4>
                                                            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black">Blog: {report.blogId?.title || 'Unknown'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-red-100 dark:border-red-900/30 mb-4">
                                                        <p className="text-sm text-[var(--text-primary)] italic">"{report.content}"</p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <span className="text-[10px] font-black uppercase text-slate-400">Reported By:</span>
                                                        {report.reportedBy.map((reporter, rIdx) => (
                                                            <span key={rIdx} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[var(--text-secondary)]">
                                                                {reporter.name || reporter.email}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex md:flex-col gap-2 justify-end">
                                                    <button 
                                                        onClick={() => handleModerationAction('ban', report.author?._id, `Malicious content in blog: ${report.blogId?.title}`)}
                                                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-red-500/20"
                                                    >
                                                        Ban Author
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDismissReport(report._id)}
                                                        className="flex-1 px-6 py-3 bg-[var(--bg-card)] text-slate-600 hover:text-green-600 border border-[var(--border-color)] text-[10px] font-black uppercase rounded-xl transition-all"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 flex flex-col items-center bg-slate-50/50 dark:bg-slate-900/10 rounded-3xl border-2 border-dashed border-[var(--border-color)]">
                                    <Shield size={32} className="text-slate-300 mb-2" />
                                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Community is safe. No active reports.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


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
