import {
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from "react-native-paper";

// Define our modern color palette
const Colors = {
  // Primary color (vibrant orange)
  primary: "rgb(246, 157, 7)", // #F69D07
  primaryLight: "rgb(255, 183, 77)", // Lighter orange
  primaryDark: "rgb(230, 126, 34)", // Darker orange
  primaryContainer: "rgb(255, 236, 179)", // Very light orange for containers

  // Secondary color (modern blue-grey)
  secondary: "rgb(96, 125, 139)", // Modern blue-grey
  secondaryLight: "rgb(144, 164, 174)",
  secondaryDark: "rgb(55, 71, 79)",
  secondaryContainer: "rgb(207, 216, 220)",

  // Tertiary (complement to orange)
  tertiary: "rgb(103, 58, 183)", // Deep purple
  tertiaryLight: "rgb(149, 117, 205)",
  tertiaryDark: "rgb(81, 45, 168)",

  // Status colors (modern and accessible)
  success: "rgb(76, 175, 80)",
  warning: "rgb(255, 152, 0)",
  error: "rgb(244, 67, 54)",
  info: "rgb(33, 150, 243)",

  // Light mode colors (softer, more modern)
  lightBackground: "rgb(250, 250, 250)", // Softer white
  lightSurface: "rgb(255, 255, 255)",
  lightSurfaceVariant: "rgb(245, 245, 245)",
  lightText: "rgb(33, 33, 33)", // Softer black
  lightTextSecondary: "rgb(117, 117, 117)",
  lightDisabled: "rgb(158, 158, 158)",
  lightOutline: "rgb(224, 224, 224)",

  // Dark mode colors (deeper, more modern)
  darkBackground: "rgb(16, 16, 16)", // Very dark background
  darkSurface: "rgb(24, 24, 24)", // Dark surface
  darkSurfaceVariant: "rgb(32, 32, 32)", // Elevated surface
  darkText: "rgb(255, 255, 255)",
  darkTextSecondary: "rgb(189, 189, 189)",
  darkDisabled: "rgb(117, 117, 117)",
  darkOutline: "rgb(66, 66, 66)",

  // Additional modern colors
  divider: "rgb(224, 224, 224)",
  darkDivider: "rgb(48, 48, 48)",
  shadow: "rgba(0, 0, 0, 0.12)",
  darkShadow: "rgba(0, 0, 0, 0.24)",
};

// Create custom light theme with modern MD3 approach
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: Colors.primary,
    onPrimary: "rgb(255, 255, 255)",
    primaryContainer: Colors.primaryContainer,
    onPrimaryContainer: "rgb(41, 27, 0)",

    // Secondary colors
    secondary: Colors.secondary,
    onSecondary: "rgb(255, 255, 255)",
    secondaryContainer: Colors.secondaryContainer,
    onSecondaryContainer: "rgb(28, 49, 58)",

    // Tertiary colors
    tertiary: Colors.tertiary,
    onTertiary: "rgb(255, 255, 255)",
    tertiaryContainer: "rgb(234, 221, 255)",
    onTertiaryContainer: "rgb(33, 0, 93)",

    // Surface colors
    background: Colors.lightBackground,
    onBackground: Colors.lightText,
    surface: Colors.lightSurface,
    onSurface: Colors.lightText,
    surfaceVariant: Colors.lightSurfaceVariant,
    onSurfaceVariant: Colors.lightTextSecondary,

    // Status colors
    error: Colors.error,
    onError: "rgb(255, 255, 255)",
    errorContainer: "rgb(255, 218, 214)",
    onErrorContainer: "rgb(65, 14, 11)",

    // Utility colors
    outline: Colors.lightOutline,
    outlineVariant: "rgb(196, 196, 196)",
    shadow: Colors.shadow,
    inverseSurface: "rgb(48, 47, 51)",
    inverseOnSurface: "rgb(244, 239, 244)",
    inversePrimary: Colors.primaryLight,
  },
};

// Create custom dark theme with deeper, more modern colors
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors
    primary: Colors.primaryLight,
    onPrimary: "rgb(66, 32, 0)",
    primaryContainer: Colors.primaryDark,
    onPrimaryContainer: "rgb(255, 220, 153)",

    // Secondary colors
    secondary: Colors.secondaryLight,
    onSecondary: "rgb(48, 63, 69)",
    secondaryContainer: Colors.secondaryDark,
    onSecondaryContainer: Colors.secondaryContainer,

    // Tertiary colors
    tertiary: Colors.tertiaryLight,
    onTertiary: "rgb(54, 21, 121)",
    tertiaryContainer: Colors.tertiaryDark,
    onTertiaryContainer: "rgb(234, 221, 255)",

    // Surface colors (much darker)
    background: Colors.darkBackground,
    onBackground: Colors.darkText,
    surface: Colors.darkSurface,
    onSurface: Colors.darkText,
    surfaceVariant: Colors.darkSurfaceVariant,
    onSurfaceVariant: Colors.darkTextSecondary,

    // Status colors
    error: "rgb(255, 180, 171)",
    onError: "rgb(105, 0, 5)",
    errorContainer: "rgb(147, 0, 10)",
    onErrorContainer: "rgb(255, 218, 214)",

    // Utility colors
    outline: Colors.darkOutline,
    outlineVariant: "rgb(68, 71, 78)",
    shadow: Colors.darkShadow,
    inverseSurface: "rgb(231, 225, 229)",
    inverseOnSurface: "rgb(50, 47, 51)",
    inversePrimary: Colors.primary,
  },
};

// Modern navigation themes
export const navigationLightTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,
    primary: Colors.primary,
    background: Colors.lightBackground,
    card: Colors.lightSurface,
    text: Colors.lightText,
    border: Colors.lightOutline,
    notification: Colors.primary,
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
    border: Colors.darkOutline,
    notification: Colors.primaryLight,
  },
};

// Export the theme (for backward compatibility)
export const theme = lightTheme;

// Additional utility exports for custom components
export const themeColors = Colors;

// Helper function to get appropriate text color based on background
export const getTextColor = (isDark: boolean) => (isDark ? Colors.darkText : Colors.lightText);

// Helper function to get surface color based on elevation
export const getSurfaceColor = (isDark: boolean, elevation: "low" | "medium" | "high" = "low") => {
  if (isDark) {
    switch (elevation) {
      case "high":
        return Colors.darkSurfaceVariant;
      case "medium":
        return Colors.darkSurface;
      default:
        return Colors.darkBackground;
    }
  } else {
    switch (elevation) {
      case "high":
        return Colors.lightSurface;
      case "medium":
        return Colors.lightSurfaceVariant;
      default:
        return Colors.lightBackground;
    }
  }
};
