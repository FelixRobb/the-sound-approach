import {
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from "react-native-paper";

// Define our color palette
const Colors = {
  // Primary color (bright red)
  primary: "#D32F2F",
  primaryLight: "#FF6659",
  primaryDark: "#9A0007",

  // Secondary color (complementary to red)
  secondary: "#455A64",
  secondaryLight: "#718792",
  secondaryDark: "#1C313A",

  // Accent colors
  accent: "#F44336",

  // Status colors
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#FF5252",
  info: "#2196F3",

  // Light mode colors
  lightBackground: "#FFFFFF",
  lightSurface: "#F5F5F5",
  lightText: "#121212",
  lightDisabled: "#9E9E9E",
  lightPlaceholder: "#757575",

  // Dark mode colors
  darkBackground: "#121212",
  darkSurface: "#1E1E1E",
  darkText: "#FFFFFF",
  darkDisabled: "#757575",
  darkPlaceholder: "#9E9E9E",
};

// Create custom light theme
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryLight,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryLight,
    background: Colors.light.background,
    surface: Colors.light.surface,
    error: Colors.error,
    onSurface: Colors.light.text,
    onBackground: Colors.light.text,
    onPrimary: Colors.light.text,
    onSecondary: Colors.light.text,
    elevation: Colors.light.elevation,
    backdrop: Colors.light.backdrop,
    outline: Colors.light.divider,
  },
};

// Create custom dark theme
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primaryLight,
    primaryContainer: Colors.primary,
    secondary: Colors.secondaryLight,
    secondaryContainer: Colors.secondary,
    background: Colors.dark.background,
    surface: Colors.dark.surface,
    error: Colors.error,
    onSurface: Colors.dark.text,
    onBackground: Colors.dark.text,
    onPrimary: Colors.dark.text,
    onSecondary: Colors.dark.text,
    elevation: Colors.dark.elevation,
    backdrop: Colors.dark.backdrop,
    outline: Colors.dark.divider,
  },
};

// Navigation themes
export const navigationLightTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,
    primary: Colors.primary,
    background: Colors.lightBackground,
    card: Colors.lightSurface,
    text: Colors.lightText,
    border: "#E0E0E0",
    notification: Colors.accent,
  },
};

export const navigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: Colors.primaryLight,
    background: Colors.darkBackground,
    card: Colors.darkSurface,
    text: Colors.darkText,
    border: "#333333",
    notification: Colors.accent,
  },
};

// Export colors for direct usage
export { Colors }

// Export the theme (for backward compatibility)
export const theme = lightTheme;
