import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '', submit: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    const validateField = (name, value) => {
        let error = '';
        if (name === 'email') {
            if (!value || !emailRegex.test(value)) {
                error = "Please enter a valid email address.";
            }
        } else if (name === 'password') {
            if (!value || !passwordRegex.test(value)) {
                error = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
            }
        }
        setErrors(prev => ({ ...prev, [name]: error, submit: '' }));
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        validateField('email', val);
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        validateField('password', val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final check
        if (errors.email || errors.password) return;

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate(from);
            } else {
                setErrors(prev => ({ ...prev, submit: result.error || 'Invalid email or password' }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, submit: 'An unexpected error occurred. Please try again.' }));
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--bg-primary)] transition-colors duration-500">
            <div className="max-w-md w-full space-y-8 card">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-serif font-extrabold text-[var(--text-primary)]">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
                        Or <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">start your journey</Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {errors.submit && <div className="text-red-500 text-sm text-center">{errors.submit}</div>}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={handleEmailChange}
                                className={`input-field pl-10 ${errors.email ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.5)]' : ''}`}
                                placeholder="Email address"
                            />
                            {errors.email && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.email}</p>}
                        </div>
                        <div className="relative mt-4">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={handlePasswordChange}
                                className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.5)]' : ''}`}
                                placeholder="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-slate-400 hover:text-primary-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            {errors.password && <p className="text-[10px] text-red-500 mt-1 ml-1 leading-tight">{errors.password}</p>}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Sign in
                            <ArrowRight className="ml-2" size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
