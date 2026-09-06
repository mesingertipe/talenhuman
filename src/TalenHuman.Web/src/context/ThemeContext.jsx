import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    // Default to Light Mode (Sol) if nothing is saved, ignoring system preference.
    return saved === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Unified Premium Colors
  const activeColors = {
      bg: isDarkMode ? '#0f172a' : '#f8fafc',
      card: isDarkMode ? '#1e293b' : '#ffffff',
      border: isDarkMode ? '#334155' : '#f1f5f9',
      textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
      textMuted: isDarkMode ? '#94a3b8' : '#64748b',
      accent: '#4f46e5'
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, activeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
