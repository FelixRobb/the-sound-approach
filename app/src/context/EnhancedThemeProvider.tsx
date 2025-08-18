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
  animation,
  borderRadius,
  ThemeContext,
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
  const [customTheme, setCustomTheme] = useState<Partial<Theme>>({});

  // Load saved theme preferences
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          setThemeMode(parsed.mode || "system");
          setCustomTheme(parsed.customTheme || {});
        }
      } catch (error) {
        console.warn("Failed to load theme preferences:", error);
      }
    };

    loadThemePreferences();
  }, []);

  // Save theme preferences
  const saveThemePreferences = async (mode: ThemeMode, custom: Partial<Theme>) => {
    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({
          mode,
          customTheme: custom,
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
    const baseColors = isDark ? darkColors : lightColors;

    // Merge custom colors if provided
    const mergedColors = {
      ...baseColors,
      ...customTheme.colors,
    };

    // Merge custom spacing if provided
    const mergedSpacing = {
      ...spacing,
      ...customTheme.spacing,
    };

    // Merge custom typography if provided
    const mergedTypography = {
      ...typography,
      ...customTheme.typography,
    };

    // Merge custom elevation if provided
    const mergedElevation = {
      ...elevation,
      ...customTheme.elevation,
    };

    // Merge custom animation if provided
    const mergedAnimation = {
      ...animation,
      ...customTheme.animation,
    };

    // Merge custom border radius if provided
    const mergedBorderRadius = {
      ...borderRadius,
      ...customTheme.borderRadius,
    };

    return {
      colors: mergedColors,
      spacing: mergedSpacing,
      typography: mergedTypography,
      elevation: mergedElevation,
      animation: mergedAnimation,
      borderRadius: mergedBorderRadius,
      isDark,
      roundness: customTheme.roundness || 12,
    };
  }, [isDark, customTheme]);

  // Theme control functions
  const toggleTheme = useCallback(() => {
    const newMode: ThemeMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
    saveThemePreferences(newMode, customTheme);
  }, [themeMode, customTheme]);

  const setTheme = useCallback(
    (dark: boolean) => {
      const newMode: ThemeMode = dark ? "dark" : "light";
      setThemeMode(newMode);
      saveThemePreferences(newMode, customTheme);
    },
    [customTheme]
  );

  const setCustomThemeCallback = useCallback(
    (custom: Partial<Theme>) => {
      const newCustomTheme = { ...customTheme, ...custom };
      setCustomTheme(newCustomTheme);
      saveThemePreferences(themeMode, newCustomTheme);
    },
    [customTheme, themeMode]
  );

  // Set theme mode
  const setThemeModeCallback = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
      saveThemePreferences(mode, customTheme);
    },
    [customTheme]
  );

  // Reset to default theme
  const resetTheme = useCallback(() => {
    setCustomTheme({});
    setThemeMode("system");
  }, [setCustomTheme]);

  // Context value
  const contextValue = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,
      setTheme,
      setCustomTheme: setCustomThemeCallback,
      // Additional enhanced features
      themeMode,
      setThemeMode: setThemeModeCallback,
      resetTheme,
      hasCustomTheme: Object.keys(customTheme).length > 0,
    }),
    [
      theme,
      isDark,
      toggleTheme,
      setTheme,
      setCustomThemeCallback,
      themeMode,
      setThemeModeCallback,
      resetTheme,
      customTheme,
    ]
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

// Hook to get just the theme object
export const useEnhancedThemeObject = (): Theme => {
  const { theme } = useEnhancedTheme();
  return theme;
};

// Hook to check if theme is custom
export const useHasCustomTheme = (): boolean => {
  const { hasCustomTheme } = useEnhancedTheme();
  return hasCustomTheme;
};

// Hook to get theme mode
export const useThemeMode = (): ThemeMode => {
  const { themeMode } = useEnhancedTheme();
  return themeMode;
};

// Hook to reset theme
export const useResetTheme = () => {
  const { resetTheme } = useEnhancedTheme();
  return resetTheme;
};
