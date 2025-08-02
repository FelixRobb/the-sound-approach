import {
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from "react-native-paper";

// Enhanced color palette with proper separation for light and dark themes
const Colors = {
  // Primary colors (shared between themes with variations)
  primary: "rgb(236, 121, 54)", // Rich golden amber
  primaryLight: "rgb(255, 152, 92)", // Lighter golden amber for dark theme
  primaryDark: "rgb(200, 95, 15)", // Deeper amber for containers

  // Light theme colors
  light: {
    // Primary system
    primary: "rgb(236, 121, 54)",
    onPrimary: "rgb(255, 255, 255)",
    primaryContainer: "rgb(255, 224, 178)",
    onPrimaryContainer: "rgb(92, 38, 0)",

    // Secondary system
    secondary: "rgb(100, 116, 139)",
    onSecondary: "rgb(255, 255, 255)",
    secondaryContainer: "rgb(241, 245, 249)",
    onSecondaryContainer: "rgb(30, 41, 59)",

    // Tertiary system
    tertiary: "rgb(5, 150, 105)",
    onTertiary: "rgb(255, 255, 255)",
    tertiaryContainer: "rgb(209, 250, 229)",
    onTertiaryContainer: "rgb(6, 78, 59)",

    // Surface system
    background: "rgb(248, 245, 243)",
    onBackground: "rgb(17, 24, 39)",
    surface: "rgb(255, 255, 255)",
    onSurface: "rgb(17, 24, 39)",
    surfaceVariant: "rgb(238, 238, 238)",
    onSurfaceVariant: "rgb(75, 85, 99)",
    surfaceLow: "rgb(248, 249, 250)",
    surfaceHigh: "rgb(255, 255, 255)",
    surfaceHighest: "rgb(255, 255, 255)",

    // Status colors for light theme
    success: "rgb(34, 197, 94)",
    onSuccess: "rgb(255, 255, 255)",
    successContainer: "rgb(220, 252, 231)",
    onSuccessContainer: "rgb(5, 46, 22)",

    warning: "rgb(245, 158, 11)",
    onWarning: "rgb(255, 255, 255)",
    warningContainer: "rgb(254, 243, 199)",
    onWarningContainer: "rgb(92, 38, 0)",

    error: "rgb(239, 68, 68)",
    onError: "rgb(255, 255, 255)",
    errorContainer: "rgb(195, 57, 57)",
    onErrorContainer: "rgb(255, 238, 238)",

    info: "rgb(59, 130, 246)",
    onInfo: "rgb(255, 255, 255)",
    infoContainer: "rgb(219, 234, 254)",
    onInfoContainer: "rgb(30, 58, 138)",

    // Utility colors
    text: "rgb(17, 24, 39)",
    textSecondary: "rgb(75, 85, 99)",
    textTertiary: "rgb(156, 163, 175)",
    disabled: "rgb(209, 213, 219)",
    outline: "rgb(229, 231, 235)",
    divider: "rgb(243, 244, 246)",
    shadow: "rgba(0, 0, 0, 0.14)",
    overlay: "rgba(0, 0, 0, 0.5)",
    backdrop: "rgba(17, 24, 39, 0.7)",
  },

  // Dark theme colors (completely separate) - Modern, polished dark theme
  dark: {
    // Primary system
    primary: "rgb(238, 124, 17)", // Lighter for dark theme
    onPrimary: "rgb(73, 31, 1)",
    primaryContainer: "rgb(150, 66, 3)",
    onPrimaryContainer: "rgb(255, 224, 178)",

    // Secondary system
    secondary: "rgb(148, 163, 184)", // Lighter slate for dark
    onSecondary: "rgb(30, 41, 59)",
    secondaryContainer: "rgb(71, 85, 105)",
    onSecondaryContainer: "rgb(241, 245, 249)",

    // Tertiary system
    tertiary: "rgb(10, 223, 145)", // Lighter emerald for dark
    onTertiary: "rgb(6, 78, 59)",
    tertiaryContainer: "rgb(4, 120, 87)",
    onTertiaryContainer: "rgb(209, 250, 229)",

    // Surface system - Modern dark with true blacks and subtle grays
    background: "rgb(0, 0, 0)", // Pure black for modern OLED-friendly design
    onBackground: "rgb(255, 255, 255)",
    surface: "rgb(11, 11, 11)", // Very dark gray for cards and surfaces
    onSurface: "rgb(255, 255, 255)",
    surfaceVariant: "rgb(28, 28, 28)", // Slightly lighter for variants
    onSurfaceVariant: "rgb(230, 230, 230)",
    surfaceLow: "rgb(4, 4, 4)", // Darker than surface for depth
    surfaceHigh: "rgb(24, 24, 24)", // Elevated surfaces
    surfaceHighest: "rgb(32, 32, 32)", // Highest elevation surfaces

    // Status colors for dark theme (adjusted for dark backgrounds)
    success: "rgb(74, 222, 128)", // Brighter green for dark
    onSuccess: "rgb(2, 44, 34)",
    successContainer: "rgb(5, 46, 22)",
    onSuccessContainer: "rgb(187, 247, 208)",

    warning: "rgb(251, 191, 36)", // Brighter amber for dark
    onWarning: "rgb(92, 38, 0)",
    warningContainer: "rgb(146, 64, 14)",
    onWarningContainer: "rgb(254, 243, 199)",

    error: "rgb(248, 113, 113)", // Brighter red for dark
    onError: "rgb(153, 27, 27)",
    errorContainer: "rgb(153, 27, 27)",
    onErrorContainer: "rgb(254, 226, 226)",

    info: "rgb(96, 165, 250)", // Brighter blue for dark
    onInfo: "rgb(30, 58, 138)",
    infoContainer: "rgb(30, 58, 138)",
    onInfoContainer: "rgb(219, 234, 254)",

    // Utility colors - Enhanced for modern dark theme
    text: "rgb(255, 255, 255)", // Pure white for primary text
    textSecondary: "rgb(200, 200, 200)", // Softer white for secondary text
    textTertiary: "rgb(150, 150, 150)", // Muted for tertiary text
    disabled: "rgb(100, 100, 100)", // Darker disabled state
    outline: "rgb(40, 40, 40)", // Subtle outlines
    divider: "rgb(24, 24, 24)", // Subtle dividers
    shadow: "rgba(0, 0, 0, 0.6)", // Stronger shadows for depth
    overlay: "rgba(0, 0, 0, 0.8)", // Darker overlay
    backdrop: "rgba(0, 0, 0, 0.9)", // Almost opaque backdrop
  },

  // Accent colors (shared but with variations)
  accent: "rgb(139, 92, 246)", // Violet accent
  accentLight: "rgb(196, 181, 253)", // Light violet
  accentDark: "rgb(109, 40, 217)", // Dark violet
  accentContainer: "rgb(237, 233, 254)", // Violet container
  accentContainerDark: "rgb(109, 40, 217)", // Dark theme violet container
};

// Enhanced light theme with proper contrast ratios
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: Colors.light.primary,
    onPrimary: Colors.light.onPrimary,
    primaryContainer: Colors.light.primaryContainer,
    onPrimaryContainer: Colors.light.onPrimaryContainer,

    // Secondary colors
    secondary: Colors.light.secondary,
    onSecondary: Colors.light.onSecondary,
    secondaryContainer: Colors.light.secondaryContainer,
    onSecondaryContainer: Colors.light.onSecondaryContainer,

    // Tertiary colors
    tertiary: Colors.light.tertiary,
    onTertiary: Colors.light.onTertiary,
    tertiaryContainer: Colors.light.tertiaryContainer,
    onTertiaryContainer: Colors.light.onTertiaryContainer,

    // Surface colors
    background: Colors.light.background,
    onBackground: Colors.light.onBackground,
    surface: Colors.light.surface,
    onSurface: Colors.light.onSurface,
    surfaceVariant: Colors.light.surfaceVariant,
    onSurfaceVariant: Colors.light.onSurfaceVariant,

    // Status colors
    error: Colors.light.error,
    onError: Colors.light.onError,
    errorContainer: Colors.light.errorContainer,
    onErrorContainer: Colors.light.onErrorContainer,

    // Utility colors
    outline: Colors.light.outline,
    outlineVariant: Colors.light.divider,
    shadow: Colors.light.shadow,
    scrim: Colors.light.overlay,
    inverseSurface: Colors.dark.surface,
    inverseOnSurface: Colors.dark.onSurface,
    inversePrimary: Colors.dark.primary,
    surfaceDisabled: "rgba(17, 24, 39, 0.12)",
    onSurfaceDisabled: "rgba(17, 24, 39, 0.38)",
  },
};

// Enhanced dark theme with completely separate colors
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors
    primary: Colors.dark.primary,
    onPrimary: Colors.dark.onPrimary,
    primaryContainer: Colors.dark.primaryContainer,
    onPrimaryContainer: Colors.dark.onPrimaryContainer,

    // Secondary colors
    secondary: Colors.dark.secondary,
    onSecondary: Colors.dark.onSecondary,
    secondaryContainer: Colors.dark.secondaryContainer,
    onSecondaryContainer: Colors.dark.onSecondaryContainer,

    // Tertiary colors
    tertiary: Colors.dark.tertiary,
    onTertiary: Colors.dark.onTertiary,
    tertiaryContainer: Colors.dark.tertiaryContainer,
    onTertiaryContainer: Colors.dark.onTertiaryContainer,

    // Surface colors
    background: Colors.dark.background,
    onBackground: Colors.dark.onBackground,
    surface: Colors.dark.surface,
    onSurface: Colors.dark.onSurface,
    surfaceVariant: Colors.dark.surfaceVariant,
    onSurfaceVariant: Colors.dark.onSurfaceVariant,

    // Status colors (properly separated for dark theme)
    error: Colors.dark.error,
    onError: Colors.dark.onError,
    errorContainer: Colors.dark.errorContainer,
    onErrorContainer: Colors.dark.onErrorContainer,

    // Utility colors
    outline: Colors.dark.outline,
    outlineVariant: Colors.dark.divider,
    shadow: Colors.dark.shadow,
    scrim: Colors.dark.overlay,
    inverseSurface: Colors.light.surface,
    inverseOnSurface: Colors.light.onSurface,
    inversePrimary: Colors.light.primary,
    surfaceDisabled: "rgba(250, 250, 250, 0.12)",
    onSurfaceDisabled: "rgba(250, 250, 250, 0.38)",
  },
};

// Enhanced navigation themes
export const navigationLightTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.outline,
    notification: Colors.light.primary,
  },
};

export const navigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.outline,
    notification: Colors.dark.primary,
  },
};

// Export the theme (for backward compatibility)
export const theme = lightTheme;

// Enhanced utility exports
export const themeColors = Colors;

// Helper functions for dynamic theming
export const getTextColor = (
  isDark: boolean,
  variant: "primary" | "secondary" | "tertiary" = "primary"
) => {
  const colors = isDark ? Colors.dark : Colors.light;
  switch (variant) {
    case "tertiary":
      return colors.textTertiary;
    case "secondary":
      return colors.textSecondary;
    default:
      return colors.text;
  }
};

// Enhanced surface color helper with proper elevation
export const getSurfaceColor = (
  isDark: boolean,
  elevation: "base" | "low" | "medium" | "high" | "highest" = "base"
) => {
  const colors = isDark ? Colors.dark : Colors.light;
  switch (elevation) {
    case "highest":
      return colors.surfaceHighest;
    case "high":
      return colors.surfaceHigh;
    case "medium":
      return colors.surfaceVariant;
    case "low":
      return colors.surfaceLow;
    default:
      return colors.background;
  }
};

// Helper for accent colors with proper contrast
export const getAccentColor = (isDark: boolean, variant: "main" | "light" | "dark" = "main") => {
  switch (variant) {
    case "light":
      return Colors.accentLight;
    case "dark":
      return Colors.accentDark;
    default:
      return isDark ? Colors.accentLight : Colors.accent;
  }
};

// Helper for semantic colors with proper theme separation
export const getSemanticColor = (
  type: "success" | "warning" | "error" | "info",
  variant: "main" | "container" = "main",
  isDark: boolean = false
) => {
  const colors = isDark ? Colors.dark : Colors.light;
  switch (type) {
    case "success":
      return variant === "container" ? colors.successContainer : colors.success;
    case "warning":
      return variant === "container" ? colors.warningContainer : colors.warning;
    case "error":
      return variant === "container" ? colors.errorContainer : colors.error;
    case "info":
      return variant === "container" ? colors.infoContainer : colors.info;
  }
};

// Get proper text color for semantic colors
export const getSemanticTextColor = (
  type: "success" | "warning" | "error" | "info",
  variant: "main" | "container" = "main",
  isDark: boolean = false
) => {
  const colors = isDark ? Colors.dark : Colors.light;
  switch (type) {
    case "success":
      return variant === "container" ? colors.onSuccessContainer : colors.onSuccess;
    case "warning":
      return variant === "container" ? colors.onWarningContainer : colors.onWarning;
    case "error":
      return variant === "container" ? colors.onErrorContainer : colors.onError;
    case "info":
      return variant === "container" ? colors.onInfoContainer : colors.onInfo;
  }
};

// Additional theme utilities
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 30,
  full: 9999,
};

export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};
