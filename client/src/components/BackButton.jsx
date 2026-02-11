import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function BackButton() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Check menu state on mount and when body overflow changes
    useEffect(() => {
        const checkMenuState = () => {
            setIsMenuOpen(document.body.style.overflow === 'hidden');
        };
        
        // Check immediately
        checkMenuState();
        
        // Set up observer for body style changes
        const observer = new MutationObserver(checkMenuState);
        observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
        
        return () => observer.disconnect();
    }, []);

    // Hide on Home page OR when mobile menu is open
    if (location.pathname === '/' || isMenuOpen) return null;

    return (
        <button
            onClick={() => navigate(-1)}
            className="fixed top-18 left-4 md:left-8 p-2 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg shadow-lg border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-all duration-300 z-50 group flex items-center gap-2"
            title="Go Back"
        >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-500 whitespace-nowrap font-semibold text-xs uppercase tracking-wider">
                Go Back
            </span>
        </button>
    );
}
