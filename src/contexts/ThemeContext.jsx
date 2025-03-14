import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/themes.css';

const ThemeContext = createContext();

const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme должен использоваться внутри ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    const { user } = useAuth();

    const applyTheme = (themeName) => {
        // Удаляем все предыдущие темы
        document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-loft-dark');
        // Устанавливаем атрибут data-theme
        document.documentElement.setAttribute('data-theme', themeName);
        // Добавляем класс для body
        document.body.className = `theme-${themeName}`;
        // Сохраняем тему в localStorage
        localStorage.setItem('app-theme', themeName);
        setTheme(themeName);
    };

    // Применяем тему
    useEffect(() => {
        if (theme) {
            applyTheme(theme);
        }
    }, [theme]);

    // Загружаем тему при инициализации
    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme) {
            applyTheme(savedTheme);
        }
    }, []);

    // Обновляем тему при изменении настроек пользователя
    useEffect(() => {
        if (user?.settings?.theme) {
            applyTheme(user.settings.theme);
        }
    }, [user?.settings?.theme]);

    const updateTheme = (newTheme) => {
        applyTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, applyTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export { useTheme };
export default ThemeContext; 