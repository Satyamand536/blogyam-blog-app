import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ name: '', email: '', password: '', submit: '' });
    const { signup, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    // Industry Standard Validations
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    const nameRegex = /^[a-zA-Z]{1,}\s+[a-zA-Z]{1,}.*$/;

    const validateField = (fieldName, value) => {
        let error = '';
        if (fieldName === 'name') {
            if (!value || value.length < 3 || !nameRegex.test(value.trim())) {
                error = "Please enter your full name (first name and surname)";
            }
        } else if (fieldName === 'email') {
            if (!value || !emailRegex.test(value)) {
                error = "Please enter a valid email address.";
            }
        } else if (fieldName === 'password') {
            if (!value || !passwordRegex.test(value)) {
                error = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
            }
        }
        setErrors(prev => ({ ...prev, [fieldName]: error, submit: '' }));
    };

    const handleChange = (e) => {
        const { name: fieldName, value } = e.target;
        if (fieldName === 'name') setName(value);
        else if (fieldName === 'email') setEmail(value);
        else if (fieldName === 'password') setPassword(value);
        validateField(fieldName, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final check
        if (errors.name || errors.email || errors.password) return;

        const success = await signup(name, email, password);
        if (success) {
            const loginSuccess = await login(email, password);
            if (loginSuccess) navigate(from);
            else navigate('/login', { state: { from } });
        } else {
            setErrors(prev => ({ ...prev, submit: 'Failed to create account. Email might already exist.' }));
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--bg-primary)] transition-colors duration-500">
            <div className="max-w-md w-full space-y-8 card">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-serif font-extrabold text-[var(--text-primary)]">
                        Join BlogYam
                    </h2>
                    <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
                        Share your wisdom with the world
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {errors.submit && (
                        <div className="text-red-500 text-sm text-center">
                            {typeof errors.submit === 'string' ? errors.submit : "An unexpected error occurred"}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                required
                                name="name"
                                value={name}
                                onChange={handleChange}
                                className={`input-field pl-10 ${errors.name ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.5)]' : ''}`}
                                placeholder="Full Name"
                            />
                            {errors.name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.name}</p>}
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="email"
                                required
                                name="email"
                                value={email}
                                onChange={handleChange}
                                className={`input-field pl-10 ${errors.email ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.5)]' : ''}`}
                                placeholder="Email address"
                            />
                            {errors.email && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.email}</p>}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="password"
                                required
                                name="password"
                                value={password}
                                onChange={handleChange}
                                className={`input-field pl-10 ${errors.password ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.5)]' : ''}`}
                                placeholder="Password"
                            />
                            {errors.password && <p className="text-[10px] text-red-500 mt-1 ml-1 leading-tight">{errors.password}</p>}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Create Account
                            <ArrowRight className="ml-2" size={16} />
                        </button>
                    </div>
                    <div className="text-center">
                         <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Already have an account? Sign in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
