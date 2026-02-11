import { Link, useLocation } from 'react-router-dom';
import { HiLockClosed } from 'react-icons/hi2';

export default function MembershipGate({ title = "Sign in to read more", message = "This story is for members only. Join to access exclusive content and connect with writers." }) {
    const location = useLocation();
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 transition-colors duration-500 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-lg w-full bg-white dark:bg-slate-800 p-12 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300">
                         <HiLockClosed size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    {message}
                </p>
                
                <div className="space-y-4">
                    <Link 
                        to="/signup" 
                        state={{ from: location.pathname }}
                        className="block w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold text-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                    >
                        Create account
                    </Link>
                    <Link 
                        to="/login" 
                        state={{ from: location.pathname }}
                        className="block w-full py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
