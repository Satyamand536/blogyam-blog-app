import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../api/axios';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PenTool, User, LogOut, Menu, X, Smile, Sun, Moon, Shield } from 'lucide-react';
import PremiumModal from './PremiumModal';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Body Scroll Lock for Professional Feel
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.height = 'auto';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.height = 'auto';
        };
    }, [isOpen]);

    return (
        <nav className="bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-sm sticky top-0 z-50 transition-colors duration-500 ease-in-out">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ... existing content ... */}
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <span className="text-2xl font-serif font-bold text-primary-600">Blogam</span>
                        </Link>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden sm:flex sm:items-center sm:gap-6">
                        <Link to="/" className="text-[var(--text-primary)] hover:text-primary-600 font-medium transition-colors">Home</Link>
                        <Link to="/authors" className="text-[var(--text-primary)] hover:text-primary-600 font-medium transition-colors">Authors</Link>
                        <Link to="/quotes" className="text-[var(--text-primary)] hover:text-wisdom-500 font-medium transition-colors">Quotes</Link>
                        <Link to="/meme-generator" className="flex items-center gap-1 text-[var(--text-primary)] hover:text-primary-600 font-medium transition-colors">
                            <Smile size={18} />
                            Memes
                        </Link>

                        <button 
                            onClick={toggleTheme} 
                            className="p-2 text-[var(--text-secondary)] hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-500 rounded-full hover:bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-color)]"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <div className="relative w-5 h-5">
                                <Sun size={20} className={`absolute inset-0 transition-all duration-500 transform ${theme === 'dark' ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
                                <Moon size={20} className={`absolute inset-0 transition-all duration-500 transform ${theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
                            </div>
                        </button>
                        
                        {user ? (
                            <>
                                <Link to="/create" className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full hover:bg-primary-100 transition-colors">
                                    <PenTool size={18} />
                                    <span>Write</span>
                                </Link>
                                <div className="relative group">
                                    <button className="flex items-center gap-2 text-[var(--text-primary)] hover:text-primary-600 transition-colors" title={user.name || user.email?.split('@')[0] || 'Profile'}>
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-primary-500/20 group-hover:ring-primary-500/40 transition-all">
                                           {user.profileImageURL ? (
                                                <img 
                                                    src={getImageUrl(user.profileImageURL)} 
                                                    alt={user.name || 'User'} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'block';
                                                    }}
                                                />
                                           ) : null}
                                           <div className={`w-full h-full flex items-center justify-center bg-primary-100 text-primary-700 font-bold text-xs ${user.profileImageURL ? 'hidden' : ''}`}>
                                               {(user.name || user.email || '?')[0].toUpperCase()}
                                           </div>
                                        </div>
                                    </button>
                                    {/* Dropdown */}
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-primary)] rounded-xl shadow-xl border border-[var(--border-color)] py-2 hidden group-hover:block animate-fade-in before:content-[''] before:absolute before:-top-4 before:left-0 before:w-full before:h-4 z-50">
                                        {user.role === 'owner' && (
                                            <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors">
                                                <Shield size={16} /> Admin Panel
                                            </Link>
                                        )}
                                        <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors">
                                            <User size={16} /> Dashboard
                                        </Link>
                                        <Link to="/my-blogs" className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors">
                                            <PenTool size={16} /> My Stories
                                        </Link>
                                        <button 
                                            onClick={() => setIsLogoutModalOpen(true)} 
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-[var(--bg-card)] transition-colors cursor-pointer text-left"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex gap-3">
                                <Link to="/login" className="px-4 py-2 text-[var(--text-primary)] font-medium hover:text-primary-600">Login</Link>
                                <Link to="/signup" className="btn-primary">Get Started</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-[var(--text-primary)] hover:text-primary-600">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Full-Screen Mobile Menu */}
            <div className={`fixed inset-0 z-[60] bg-[var(--bg-card)] transition-all duration-500 ease-in-out sm:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                {/* Close Button Inside Menu */}
                <div className="absolute top-4 right-4 z-[70]">
                    <button onClick={() => setIsOpen(false)} className="p-2 text-[var(--text-primary)] hover:text-primary-600 transition-colors">
                        <X size={32} />
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center h-full space-y-8 px-6 animate-fade-in">
                    <div className="flex flex-col items-center space-y-2 mb-4">
                        <span className="text-4xl font-serif font-bold text-primary-600">BlogYam</span>
                        <div className="w-12 h-1 bg-primary-600 rounded-full"></div>
                    </div>

                    <div className="flex flex-col items-center space-y-6 w-full max-w-xs">
                        <Link to="/" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)] hover:text-primary-600 transition-colors">Home</Link>
                        <Link to="/authors" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)] hover:text-primary-600 transition-colors">Authors</Link>
                        <Link to="/quotes" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)] hover:text-wisdom-500 transition-colors">Quotes</Link>
                        <Link to="/meme-generator" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)] hover:text-primary-600 transition-colors">Memes</Link>
                        
                        {user ? (
                            <>
                                <div className="w-full h-px bg-[var(--border-color)] my-4"></div>
                                {user.role === 'owner' && (
                                    <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-2xl font-medium text-amber-600">
                                        <Shield size={24} /> Admin Panel
                                    </Link>
                                )}
                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-2xl font-medium text-[var(--text-primary)]">
                                    <User size={24} /> Dashboard
                                </Link>
                                <button onClick={() => { setIsLogoutModalOpen(true); setIsOpen(false); }} className="flex items-center gap-3 text-2xl font-medium text-red-600 dark:text-red-400">
                                    <LogOut size={24} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-full h-px bg-[var(--border-color)] my-4"></div>
                                <Link to="/login" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)]">Login</Link>
                                <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full text-center py-4 bg-primary-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all">Get Started</Link>
                            </>
                        )}
                    </div>

                    <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8">
                        <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-widest">Theme Mode</span>
                        <button 
                            onClick={toggleTheme} 
                            className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:text-primary-600 transition-all rounded-2xl shadow-sm active:scale-90"
                        >
                            {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            <PremiumModal 
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={() => {
                    logout();
                    setIsLogoutModalOpen(false);
                }}
                title="Safar Khatam?"
                message="Are you sure you want to logout from BlogYam? We'll miss your stories!"
                confirmText="Logout"
                cancelText="Mera Man Badal Gaya"
                type="danger"
            />
        </nav>
    );
}
