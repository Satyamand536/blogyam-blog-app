import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide on Home page
    if (location.pathname === '/') return null;

    return (
        <button
            onClick={() => navigate(-1)}
            className="fixed top-24 left-2 sm:left-6 p-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-xl shadow-md border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-all duration-300 z-50 group flex items-center gap-2"
            title="Go Back"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-500 whitespace-nowrap font-medium text-sm">
                Go Back
            </span>
        </button>
    );
}
