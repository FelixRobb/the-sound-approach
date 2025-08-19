import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useColorScheme } from "react-native";

import {
  Theme,
  ThemeContextType,
  ThemeMode,
  ThemeConfig,
  lightColors,
  darkColors,
  spacing,
  typography,
  elevation,
  borderRadius,
  ThemeContext,
  zIndex,
} from "../lib/theme";

// Storage key for theme preferences
const THEME_STORAGE_KEY = "@theme_preferences";

// Use the imported theme context
const EnhancedThemeContext = ThemeContext;

// Enhanced theme provider component
export const EnhancedThemeProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: ThemeConfig;
}> = ({ children, initialConfig }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialConfig?.mode || "system");

  // Load saved theme preferences
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          setThemeMode(parsed.mode || "system");
        }
      } catch (error) {
        console.warn("Failed to load theme preferences:", error);
      }
    };

    loadThemePreferences();
  }, []);

  // Save theme preferences
  const saveThemePreferences = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({
          mode,
        })
      );
    } catch (error) {
      console.warn("Failed to save theme preferences:", error);
    }
  };

  // Determine if dark mode should be used
  const isDark = useMemo(() => {
    if (themeMode === "system") {
      return systemColorScheme === "dark";
    }
    return themeMode === "dark";
  }, [themeMode, systemColorScheme]);

  // Create theme object
  const theme: Theme = useMemo(() => {
    return {
      colors: isDark ? darkColors : lightColors,
      spacing: spacing,
      typography: typography,
      elevation: elevation,
      borderRadius: borderRadius,
      zIndex: zIndex,
      isDark,
    };
  }, [isDark]);

  const setTheme = useCallback((dark: boolean) => {
    const newMode: ThemeMode = dark ? "dark" : "light";
    setThemeMode(newMode);
    saveThemePreferences(newMode);
  }, []);

  // Set theme mode
  const setThemeModeCallback = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemePreferences(mode);
  }, []);

  // Context value
  const contextValue = useMemo(
    () => ({
      theme,
      isDark,
      setTheme,
      // Additional enhanced features
      themeMode,
      setThemeMode: setThemeModeCallback,
    }),
    [theme, isDark, setTheme, themeMode, setThemeModeCallback]
  );

  return (
    <EnhancedThemeContext.Provider value={contextValue}>{children}</EnhancedThemeContext.Provider>
  );
};

// Enhanced theme hook
export const useEnhancedTheme = (): ThemeContextType => {
  const context = useContext(EnhancedThemeContext);
  if (context === undefined) {
    throw new Error("useEnhancedTheme must be used within an EnhancedThemeProvider");
  }
  return context;
};
