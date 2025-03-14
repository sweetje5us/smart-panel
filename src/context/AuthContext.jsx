import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import ip from '../ip.json';
const address = `${ip.ip}:${ip.port}`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Проверяем наличие сохраненного пользователя при загрузке
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post(`http://${address}/api/auth/login`, {
                login: username,
                password
            });

            const userData = response.data;
            setUser(userData);
            return { 
                success: true,
                user: userData
            };
        } catch (error) {
            console.error('Ошибка при входе:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Ошибка при входе в систему'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post(`http://${address}/api/auth/register`, userData);
            const newUser = response.data;
            setUser(newUser);
            return { 
                success: true,
                user: newUser
            };
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Ошибка при регистрации'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = async (userId, userData) => {
        try {
            const response = await axios.put(`http://${address}/api/auth/users/${userId}`, userData);
            const updatedUser = response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return { success: true };
        } catch (error) {
            console.error('Ошибка при обновлении данных:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Ошибка при обновлении данных'
            };
        }
    };

    const getUser = async (userId) => {
        try {
            const response = await axios.get(`http://${address}/api/auth/users/${userId}`);
            return { success: true, user: response.data };
        } catch (error) {
            console.error('Ошибка при получении данных пользователя:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Ошибка при получении данных пользователя'
            };
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        getUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
}; 