import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function MembershipGate({ title = "Masterpiece Found.", message = "This content is part of our exclusive collection. Join the BlogYam community to unlock deep-dives, AI insights, and professional writing tools." }) {
    const location = useLocation();
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 animate-fade-in transition-colors duration-500">
            <div className="max-w-md w-full text-center animate-slide-up bg-[var(--bg-card)] p-10 rounded-[40px] border border-[var(--border-color)] shadow-2xl relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-700"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                <div className="relative z-10">
                    <div className="mb-8 flex justify-center">
                        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-xl shadow-primary-500/10 active:scale-95 transition-all">
                             <Sparkles size={40} className="animate-pulse" />
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-4">{title}</h2>
                    <p className="text-[var(--text-secondary)] mb-10 leading-relaxed font-serif italic text-lg opacity-80">
                        "{message}"
                    </p>
                    
                    <div className="flex flex-col gap-4">
                        <Link 
                            to="/signup" 
                            state={{ from: location.pathname }}
                            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all hover:bg-primary-700 flex items-center justify-center gap-2 group/btn"
                        >
                            Join Now to Unlock <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            to="/login" 
                            state={{ from: location.pathname }}
                            className="text-primary-600 dark:text-primary-400 font-bold hover:underline py-2"
                        >
                            Already a member? Login
                        </Link>
                        
                        <div className="mt-8 pt-8 border-t border-[var(--border-color)]">
                            <p className="text-[10px] text-[var(--text-secondary)] opacity-50 uppercase tracking-[0.2em] font-black">
                                Free Access: Daily Quotes & Memes
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
