import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  isDark: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const systemColorScheme = useRNColorScheme();
  const [themePreference, setThemePreference] = useState<ThemeType>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemePreference(savedTheme);
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (themePreference === 'system') {
      setColorScheme(systemColorScheme || 'dark');
    } else {
      setColorScheme(themePreference);
    }
  }, [themePreference, systemColorScheme, isLoaded]);

  const setTheme = async (newTheme: ThemeType) => {
    setThemePreference(newTheme);
    try {
      await AsyncStorage.setItem('theme_preference', newTheme);
    } catch (e) {
      // ignore
    }
  };

  const isDark = themePreference === 'system' 
    ? systemColorScheme === 'dark' 
    : themePreference === 'dark';

  return (
    <ThemeContext.Provider value={{ theme: themePreference, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
