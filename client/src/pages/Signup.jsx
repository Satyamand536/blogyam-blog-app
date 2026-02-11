import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { HiUser, HiEnvelope, HiLockClosed } from 'react-icons/hi2';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signup, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await signup(name, email, password);
        if (result.success) {
            const loginResult = await login(email, password);
            if (loginResult.success) {
                navigate(from);
            } else {
                navigate('/login');
            }
        } else {
            setError(result.error || 'Failed to create account');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            <div className="max-w-md w-full glass-card p-10 rounded-2xl relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight transition-colors duration-500">
                        Join Blogam
                    </h2>
                    <p className="text-[var(--text-secondary)] font-medium tracking-wide transition-colors duration-500">
                        Share your wisdom with the world
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="text-sm text-red-300 text-center bg-red-900/40 backdrop-blur-sm p-3 rounded-lg border border-red-500/30">
                            {error}
                        </div>
                    )}

                    <div className="relative">
                        <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={20} />
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="relative">
                        <HiEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={20} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                            placeholder="Email address"
                        />
                    </div>

                    <div className="relative">
                        <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={20} />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                            placeholder="Password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-2xl shadow-purple-900/40 hover:shadow-purple-500/50 active:scale-95 flex items-center justify-center gap-3 tracking-widest uppercase text-sm"
                    >
                        Create Account
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>

                    <p className="text-center text-sm text-[var(--text-secondary)] mt-8 font-medium transition-colors duration-500">
                        Already have an account? <Link to="/login" className="text-primary-600 dark:text-purple-400 hover:text-primary-500 dark:hover:text-purple-300 font-bold underline decoration-primary-500/50 dark:decoration-purple-500/50 transition-colors">Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
