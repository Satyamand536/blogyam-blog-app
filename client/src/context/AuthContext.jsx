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
            const { data } = await api.post('/signup', { name, email, password });
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
