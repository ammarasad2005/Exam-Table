'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  /** Whether the user has manually set the theme (persisted) vs auto/system. */
  isUserSet: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isUserSet: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isUserSet, setIsUserSet] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const saved = localStorage.getItem('fsc-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      setIsUserSet(true);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // Default based on time of day (Night: 6 PM – 6 AM)
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour < 6;
      const initial = isNight ? 'dark' : 'light';

      setTheme(initial);
      setIsUserSet(false);
      document.documentElement.setAttribute('data-theme', initial);
    }
  }, []);


  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setIsUserSet(true);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fsc-theme', next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isUserSet }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
