import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    setToast({ message, type, duration, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence mode="wait">
        {toast && (
          <Toast 
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={hideToast}
          />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
