import { X, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function PremiumModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden animate-slide-up transition-colors duration-500">
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'}`}>
                            <AlertCircle size={24} />
                        </div>
                        <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-full transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <h3 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-2">
                        {title}
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={onConfirm}
                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                                type === 'danger' 
                                ? 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-700' 
                                : type === 'success'
                                ? 'bg-green-600 text-white shadow-green-600/20 hover:bg-green-700'
                                : 'bg-primary-600 text-white shadow-primary-600/20 hover:bg-primary-700'
                            }`}
                        >
                            {confirmText}
                        </button>
                        {cancelText && (
                            <button 
                                onClick={onClose}
                                className="flex-1 py-3.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl font-bold hover:bg-[var(--bg-card)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {cancelText}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
