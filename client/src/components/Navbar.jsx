import { useState, useEffect, useRef } from 'react';
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const timeoutRef = useRef(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
        }, 300); // 300ms delay for professional feel
    };

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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Explicit background logic to prevent theme bleeding
    const navClasses = isScrolled 
        ? (theme === 'dark' ? 'bg-[#0f172a] shadow-md shadow-slate-900/50' : 'bg-white shadow-md')
        : 'bg-[var(--bg-card)]';

    return (
        <nav className={`border-b border-[var(--border-color)] sticky top-0 z-50 transition-all duration-500 ease-in-out ${navClasses}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <span className="text-2xl font-serif font-black text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-purple-400 transition-colors">Blogam</span>
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

                        {user && (
                            <Link to="/create" className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold transition-all hover:scale-105 active:scale-95 ml-2">
                                <PenTool size={18} />
                                <span>Write</span>
                            </Link>
                        )}

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
                            <div 
                                className="relative user-dropdown-container"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button 
                                    className="flex items-center gap-2 text-[var(--text-primary)] hover:text-purple-400 transition-colors py-2"
                                >
                                    <div className={`w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ${isDropdownOpen ? 'ring-purple-500' : 'ring-purple-500/50'} hover:ring-purple-500 transition-all`}>
                                        {user.profileImageURL ? (
                                            <img 
                                                src={getImageUrl(user.profileImageURL)} 
                                                alt={user.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-700 font-bold text-xs">
                                                {(user.name || user.email || '?')[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </button>
                                
                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-xl py-2 animate-fade-in z-50 border shadow-2xl">
                                        <div className="px-4 py-2 border-b border-black/5 dark:border-white/10 mb-2">
                                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)] opacity-80 truncate">{user.email}</p>
                                        </div>

                                        {user.role === 'owner' && (
                                            <Link to="/admin" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                                <Shield size={16} /> Admin Panel
                                            </Link>
                                        )}
                                        
                                        <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                            <User size={16} /> Dashboard
                                        </Link>
                                        
                                        <Link to="/my-blogs" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                            <PenTool size={16} /> My Stories
                                        </Link>
                                        
                                        <div className="border-t border-black/5 dark:border-white/10 my-1"></div>
                                        
                                        <button 
                                            onClick={() => {
                                                setIsLogoutModalOpen(true);
                                                setIsDropdownOpen(false);
                                            }} 
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors text-left"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Link to="/signup" className="btn-primary">Sign Up</Link>
                                <Link to="/login" className="px-4 py-2 text-[var(--text-primary)] font-bold hover:text-primary-600 dark:hover:text-purple-400 transition-colors">Login</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-purple-400 transition-colors">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Full-Screen Mobile Menu */}
            <div className={`fixed inset-0 z-[60] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 transition-all duration-500 ease-in-out sm:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                {/* Close Button Inside Menu */}
                <div className="absolute top-4 right-4 z-[70]">
                    <button onClick={() => setIsOpen(false)} className="p-2 text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-purple-500 transition-colors">
                        <X size={32} />
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center h-full space-y-8 px-6 animate-fade-in relative z-50">
                    <div className="flex flex-col items-center space-y-2 mb-4">
                        <span className="text-4xl font-serif font-black text-[var(--text-primary)]">Blogam</span>
                        <div className="w-12 h-1 bg-primary-600 dark:bg-purple-500 rounded-full"></div>
                    </div>

                    <div className="flex flex-col items-center space-y-6 w-full max-w-xs">
                        {user && (
                            <Link to="/create" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-2xl font-medium text-orange-500 animate-pulse">
                                <PenTool size={24} /> Write a Story
                            </Link>
                        )}
                        <Link to="/" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-purple-400 transition-colors">Home</Link>
                        <Link to="/authors" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-purple-400 transition-colors">Authors</Link>
                        <Link to="/quotes" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-purple-400 transition-colors">Quotes</Link>
                        <Link to="/meme-generator" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-purple-400 transition-colors">Memes</Link>
                        
                        {user ? (
                            <>
                                <div className="w-full h-px bg-white/10 my-4"></div>
                                {user.role === 'owner' && (
                                    <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-2xl font-medium text-amber-500">
                                        <Shield size={24} /> Admin Panel
                                    </Link>
                                )}
                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors">
                                    <User size={24} /> Dashboard
                                </Link>
                                <button onClick={() => { setIsLogoutModalOpen(true); setIsOpen(false); }} className="flex items-center gap-3 text-2xl font-medium text-red-500 hover:text-red-400">
                                    <LogOut size={24} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-full h-px bg-white/10 my-4"></div>
                                <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full text-center py-4 bg-orange-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-orange-600/30 active:scale-95 transition-all">Sign Up</Link>
                                <Link to="/login" onClick={() => setIsOpen(false)} className="text-2xl font-medium text-white hover:text-orange-500">Login</Link>
                            </>
                        )}
                    </div>

                    <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8">
                        <span className="text-base font-bold text-orange-500 uppercase tracking-widest">Theme Mode</span>
                        <button 
                            onClick={toggleTheme} 
                            className="p-4 bg-white/10 border border-white/20 text-orange-500 hover:text-orange-400 transition-all rounded-2xl shadow-sm active:scale-90"
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
                title="Sign out?"
                message="Are you sure you want to logout? Your drafts and progress will be saved."
                confirmText="Sign out"
                cancelText="Cancel"
                type="danger"
            />
        </nav>
    );
}
