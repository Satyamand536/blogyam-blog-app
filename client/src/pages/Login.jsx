import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { HiEnvelope, HiLockClosed, HiEye, HiEyeSlash } from 'react-icons/hi2';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const result = await login(email, password);
        if (result.success) {
            navigate(from);
        } else {
            setError(result.error || 'Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            <div className="max-w-md w-full glass-card p-10 rounded-2xl relative z-10 transition-colors duration-500">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight transition-colors duration-500">
                        Welcome Back
                    </h2>
                    <p className="text-[var(--text-secondary)] font-medium tracking-wide transition-colors duration-500">
                        Or <Link to="/signup" className="text-primary-600 dark:text-purple-400 hover:text-primary-500 dark:hover:text-purple-300 font-bold underline decoration-primary-500/50 dark:decoration-purple-500/50 transition-colors">create an account</Link>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="text-base font-bold text-red-600 dark:text-red-400 text-center bg-red-100 dark:bg-red-900/40 backdrop-blur-sm p-4 rounded-xl border border-red-500/30 shadow-sm animate-shake">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="relative group">
                        <HiEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-purple-300 transition-colors group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400" size={20} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl !text-black dark:!text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 shadow-sm force-text-visibility"
                            style={{ color: 'inherit' }}
                            placeholder="Email"
                        />
                    </div>

                    <div className="relative group">
                        <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-purple-300 transition-colors group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl !text-black dark:!text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 shadow-sm force-text-visibility"
                            style={{ color: 'inherit' }}
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-100 transition-colors"
                        >
                            {showPassword ? <HiEyeSlash size={20} /> : <HiEye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-2xl shadow-purple-900/40 hover:shadow-purple-500/50 active:scale-95 flex items-center justify-center tracking-widest uppercase text-sm"
                    >
                        Sign in
                    </button>
                </form>
            </div>
        </div>
    );
}
