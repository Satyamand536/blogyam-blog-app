import { Link } from 'react-router-dom';
import { Heart, Github, Mail } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[var(--bg-card)] border-t border-[var(--border-color)] mt-auto transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Brand Section */}
                    <div className="text-center md:text-left">
                        <Link to="/" className="inline-block">
                            <h3 className="text-2xl font-serif font-bold text-primary-600 mb-2">
                                BlogYam
                            </h3>
                        </Link>
                        <p className="text-[var(--text-secondary)] font-serif italic text-sm max-w-xs mx-auto md:mx-0">
                            "Share your wisdom, ignite the world."
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
                            Knowledge increases by sharing.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="text-center">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                            Quick Links
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-slate-600 hover:text-primary-600 transition-colors text-sm">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/create" className="text-slate-600 hover:text-primary-600 transition-colors text-sm">
                                    Write
                                </Link>
                            </li>
                            <li>
                                <Link to="/quotes" className="text-slate-600 hover:text-primary-600 transition-colors text-sm">
                                    Quotes
                                </Link>
                            </li>
                            <li>
                                <Link to="/meme-generator" className="text-slate-600 hover:text-primary-600 transition-colors text-sm">
                                    Memes
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard" className="text-slate-600 hover:text-primary-600 transition-colors text-sm">
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Social & Contact */}
                    <div className="text-center md:text-right">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                            Connect With Us
                        </h4>
                        <div className="flex justify-center md:justify-end gap-4 mb-4">
                            <a
                                href="https://github.com/Satyamand536"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label="GitHub"
                            >
                                <Github size={20} />
                            </a>
                            <a
                                href="https://x.com/SatyamT7_456"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-900 transition-colors font-bold text-xl flex items-center justify-center w-5 h-5"
                                aria-label="X (Twitter)"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                𝕏
                            </a>
                            <a
                                href="mailto:satyamand536@gmail.com"
                                className="text-slate-400 hover:text-wisdom-500 transition-colors"
                                aria-label="Email"
                            >
                                <Mail size={20} />
                            </a>
                        </div>
                        <p className="text-slate-500 text-xs">
                            Questions? Reach out to us!
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-100 mt-8 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-sm text-center md:text-left">
                            © {currentYear} BlogYam. All rights reserved.
                        </p>
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                            Made with <Heart size={14} className="text-red-500 fill-current" /> for knowledge sharing
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
