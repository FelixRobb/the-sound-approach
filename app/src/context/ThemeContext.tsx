import AsyncStorage from "@react-native-async-storage/async-storage";
import type React from "react";
import { createContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  isDarkMode: false,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme) {
          setThemeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      }
    };

    loadTheme();
  }, []);

  // Update dark mode based on theme and system preference
  useEffect(() => {
    if (theme === "system") {
      setIsDarkMode(colorScheme === "dark");
    } else {
      setIsDarkMode(theme === "dark");
    }
  }, [theme, colorScheme]);

  // Set theme and save preference
  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
