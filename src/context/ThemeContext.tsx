import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type ThemePreference = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (pref: ThemePreference) => void;
  cycleTheme: () => void;
  isDaytime: boolean;
  currentHour: number;
}

const STORAGE_KEY = 'nba_quant_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Day mode is between 7:00 AM (07:00) and 7:00 PM (19:00)
function checkIsDaytime(hour: number): boolean {
  return hour >= 7 && hour < 19;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        return saved;
      }
    } catch {
      // fallback
    }
    // Default to 'auto' so it behaves automatically based on time of day out of the box!
    return 'auto';
  });

  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());

  // Periodically update current hour (every 30 seconds) to handle sunrise / sunset transitions smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const isDaytime = useMemo(() => checkIsDaytime(currentHour), [currentHour]);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (themePreference === 'light') return 'light';
    if (themePreference === 'dark') return 'dark';
    // 'auto' mode: Light during daytime (7 AM - 7 PM), Dark at night (7 PM - 7 AM)
    return isDaytime ? 'light' : 'dark';
  }, [themePreference, isDaytime]);

  // Sync DOM classes whenever resolvedTheme changes
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // Ignore
    }
  };

  const cycleTheme = () => {
    if (themePreference === 'auto') setThemePreference('light');
    else if (themePreference === 'light') setThemePreference('dark');
    else setThemePreference('auto');
  };

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        resolvedTheme,
        setThemePreference,
        cycleTheme,
        isDaytime,
        currentHour,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
