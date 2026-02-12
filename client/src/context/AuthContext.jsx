import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const { data } = await api.get('/user/me'); 
            if(data.success && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            // Encrypt password before sending
            const { encryptPassword } = await import('../utils/encryption.js');
            const encryptedPassword = await encryptPassword(password);
            
            const { data } = await api.post('/signin', { email, password: encryptedPassword });
            if (data.success) {
                if (data.user) {
                    setUser(data.user);
                } else {
                    await checkUserLoggedIn(); // Fallback
                }
                return { success: true };
            }
            return { success: false, error: "Invalid credentials" };
        } catch (error) {
            let errorMsg = "Login failed. Please check your credentials.";
            if (error.response?.data?.error) {
                errorMsg = typeof error.response.data.error === 'string' 
                    ? error.response.data.error 
                    : (error.response.data.error.message || JSON.stringify(error.response.data.error));
            }
            return { success: false, error: errorMsg };
        }
    };

    const signup = async (name, email, password) => {
        try {
            // Encrypt password before sending
            const { encryptPassword } = await import('../utils/encryption.js');
            const encryptedPassword = await encryptPassword(password);
            
            const { data } = await api.post('/signup', { name, email, password: encryptedPassword });
            return { success: data.success };
        } catch (error) {
            let errorMsg = "Signup failed. Please try again.";
            if (error.response?.data?.error) {
                errorMsg = typeof error.response.data.error === 'string' 
                    ? error.response.data.error 
                    : (error.response.data.error.message || JSON.stringify(error.response.data.error));
            }
            return { success: false, error: errorMsg };
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout');
            setUser(null);
            setNotification({ type: 'success', message: 'Successfully logged out. See you soon!' });
            setTimeout(() => setNotification(null), 4000);
        } catch (error) {
            setUser(null); // Force logout locally anyway
            setNotification({ type: 'success', message: 'Logged out successfully.' });
            setTimeout(() => setNotification(null), 4000);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, refreshUser: checkUserLoggedIn, notification }}>
            {children}
            
            {/* Professional Notification Toast */}
            {notification && (
                <div className="fixed top-20 right-4 z-[100] animate-slide-in-right">
                    <div className={`px-6 py-4 rounded-xl shadow-2xl border-2 ${
                        notification.type === 'success' 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-500 dark:border-green-400' 
                            : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-500 dark:border-red-400'
                    } backdrop-blur-sm`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                                notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                            } animate-pulse`}></div>
                            <p className={`font-semibold text-sm ${
                                notification.type === 'success' 
                                    ? 'text-green-800 dark:text-green-200' 
                                    : 'text-red-800 dark:text-red-200'
                            }`}>
                                {notification.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};
