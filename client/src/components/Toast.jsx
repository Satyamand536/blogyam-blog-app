import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const icons = {
  success: <CheckCircle className="text-green-500" size={20} />,
  error: <AlertCircle className="text-red-500" size={20} />,
  warning: <AlertTriangle className="text-amber-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />
};

const styles = {
  success: "border-green-500/20 bg-green-50/90 dark:bg-green-950/30",
  error: "border-red-500/20 bg-red-50/90 dark:bg-red-950/30",
  warning: "border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/30",
  info: "border-blue-500/20 bg-blue-50/90 dark:bg-blue-950/30"
};

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 }, x: "-50%" }}
      className={`fixed bottom-10 left-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md shadow-2xl min-w-[320px] max-w-[90vw] ${styles[type]}`}
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      
      <p className="flex-1 text-sm font-medium text-[var(--text-primary)] leading-tight">
        {message}
      </p>

      <button 
        onClick={onClose}
        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)]"
      >
        <X size={16} />
      </button>

      {/* Progress Bar */}
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-current opacity-20`}
        style={{ color: type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6' }}
      />
    </motion.div>
  );
}
