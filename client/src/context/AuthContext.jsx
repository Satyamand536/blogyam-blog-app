import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
            const { data } = await api.post('/signin', { email, password });
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
            // We removed console.error here to keep your console clean.
            // 401 is an expected status for wrong passwords.
            return { 
                success: false, 
                error: error.response?.data?.error || "Login failed. Please check your credentials." 
            };
        }
    };

    const signup = async (name, email, password) => {
        try {
            const { data } = await api.post('/signup', { name, email, password });
            return { success: data.success };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || "Signup failed. Please try again." 
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout');
            setUser(null);
        } catch (error) {
            setUser(null); // Force logout locally anyway
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, refreshUser: checkUserLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};
