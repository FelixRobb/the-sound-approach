import {
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from "react-native-paper";

// Enhanced color palette with better harmony and contrast
const Colors = {
  // Primary color (sophisticated golden amber - warmer and more elegant)
  primary: "rgb(236, 121, 54)", // Rich golden amber
  primaryLight: "rgb(238, 139, 41)", // Lighter golden amber
  primaryDark: "rgb(180, 83, 9)", // Deeper amber
  primaryContainer: "rgb(235, 208, 101)", // Soft golden cream
  onPrimary: "rgb(255, 255, 255)", // White on primary
  onPrimaryLight: "rgb(92, 38, 0)", // Dark on light primary
  onPrimaryDark: "rgb(255, 255, 255)", // White on dark primary
  onPrimaryContainer: "rgb(92, 38, 0)", // Dark on primary container

  // Secondary color (refined slate with better contrast)
  secondary: "rgb(100, 116, 139)", // Balanced slate
  secondaryLight: "rgb(148, 163, 184)", // Lighter slate
  secondaryDark: "rgb(71, 85, 105)", // Darker slate
  secondaryContainer: "rgb(241, 245, 249)", // Very light slate
  onSecondary: "rgb(255, 255, 255)", // White on secondary
  onSecondaryLight: "rgb(30, 41, 59)", // Dark on light secondary
  onSecondaryDark: "rgb(255, 255, 255)", // White on dark secondary
  onSecondaryContainer: "rgb(30, 41, 59)", // Dark on secondary container

  // Tertiary (refined forest green)
  tertiary: "rgb(5, 150, 105)", // Emerald green
  tertiaryLight: "rgb(52, 211, 153)", // Lighter emerald
  tertiaryDark: "rgb(4, 120, 87)", // Deeper emerald
  tertiaryContainer: "rgb(209, 250, 229)", // Very light emerald
  onTertiary: "rgb(255, 255, 255)", // White on tertiary
  onTertiaryLight: "rgb(6, 78, 59)", // Dark on light tertiary
  onTertiaryDark: "rgb(255, 255, 255)", // White on dark tertiary
  onTertiaryContainer: "rgb(6, 78, 59)", // Dark on tertiary container

  // Status colors with proper contrast
  success: "rgb(34, 197, 94)", // Emerald success
  onSuccess: "rgb(255, 255, 255)",
  successContainer: "rgb(220, 252, 231)",
  onSuccessContainer: "rgb(5, 46, 22)",

  warning: "rgb(245, 158, 11)", // Amber warning
  onWarning: "rgb(255, 255, 255)",
  warningContainer: "rgb(254, 243, 199)",
  onWarningContainer: "rgb(92, 38, 0)",

  error: "rgb(239, 68, 68)", // Red error
  onError: "rgb(255, 255, 255)",
  errorContainer: "rgb(254, 226, 226)",
  onErrorContainer: "rgb(153, 27, 27)",

  info: "rgb(59, 130, 246)", // Blue info
  onInfo: "rgb(255, 255, 255)",
  infoContainer: "rgb(219, 234, 254)",
  onInfoContainer: "rgb(30, 58, 138)",

  // Light mode colors (refined and eye-friendly)
  lightBackground: "rgb(249, 250, 251)", // Soft cool white
  lightSurface: "rgb(255, 255, 255)", // Pure white
  lightSurfaceVariant: "rgb(243, 244, 246)", // Light grey
  lightSurfaceLow: "rgb(248, 249, 250)", // Between background and surface
  lightSurfaceHigh: "rgb(255, 255, 255)", // Elevated surface
  lightSurfaceHighest: "rgb(255, 255, 255)", // Highest elevation

  lightText: "rgb(17, 24, 39)", // Rich dark grey (not harsh black)
  lightTextSecondary: "rgb(75, 85, 99)", // Medium grey
  lightTextTertiary: "rgb(156, 163, 175)", // Light grey
  lightDisabled: "rgb(209, 213, 219)", // Muted grey
  lightOutline: "rgb(229, 231, 235)", // Subtle border
  lightDivider: "rgb(243, 244, 246)", // Very light division

  onLightBackground: "rgb(17, 24, 39)",
  onLightSurface: "rgb(17, 24, 39)",
  onLightSurfaceVariant: "rgb(75, 85, 99)",

  // Dark mode colors (deep, rich with proper contrast)
  darkBackground: "rgb(6, 6, 7)", // True deep black
  darkSurface: "rgb(15, 15, 16)", // Dark surface
  darkSurfaceVariant: "rgb(39, 39, 42)", // Elevated dark
  darkSurfaceLow: "rgb(18, 18, 20)", // Between background and surface
  darkSurfaceHigh: "rgb(39, 39, 42)", // Higher elevation
  darkSurfaceHighest: "rgb(63, 63, 70)", // Highest elevation

  darkText: "rgb(250, 250, 250)", // Bright white
  darkTextSecondary: "rgb(212, 212, 216)", // Light grey
  darkTextTertiary: "rgb(161, 161, 170)", // Medium grey
  darkDisabled: "rgb(113, 113, 122)", // Dark grey
  darkOutline: "rgb(63, 63, 70)", // Subtle dark border
  darkDivider: "rgb(39, 39, 42)", // Dark division

  onDarkBackground: "rgb(250, 250, 250)",
  onDarkSurface: "rgb(250, 250, 250)",
  onDarkSurfaceVariant: "rgb(212, 212, 216)",

  // Accent colors for special elements
  accent: "rgb(139, 92, 246)", // Violet accent
  accentLight: "rgb(196, 181, 253)", // Light violet
  accentDark: "rgb(109, 40, 217)", // Dark violet
  accentContainer: "rgb(237, 233, 254)", // Violet container
  onAccent: "rgb(255, 255, 255)",
  onAccentLight: "rgb(76, 29, 149)",
  onAccentDark: "rgb(255, 255, 255)",
  onAccentContainer: "rgb(76, 29, 149)",

  // Semantic colors
  shadow: "rgba(0, 0, 0, 0.1)", // Soft shadow
  darkShadow: "rgba(0, 0, 0, 0.3)", // Darker shadow
  overlay: "rgba(0, 0, 0, 0.5)", // Modal overlay
  backdrop: "rgba(17, 24, 39, 0.7)", // Backdrop
};

// Enhanced light theme with proper contrast ratios
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: Colors.primary,
    onPrimary: Colors.onPrimary,
    primaryContainer: Colors.primaryContainer,
    onPrimaryContainer: Colors.onPrimaryContainer,

    // Secondary colors
    secondary: Colors.secondary,
    onSecondary: Colors.onSecondary,
    secondaryContainer: Colors.secondaryContainer,
    onSecondaryContainer: Colors.onSecondaryContainer,

    // Tertiary colors
    tertiary: Colors.tertiary,
    onTertiary: Colors.onTertiary,
    tertiaryContainer: Colors.tertiaryContainer,
    onTertiaryContainer: Colors.onTertiaryContainer,

    // Surface colors
    background: Colors.lightBackground,
    onBackground: Colors.onLightBackground,
    surface: Colors.lightSurface,
    onSurface: Colors.onLightSurface,
    surfaceVariant: Colors.lightSurfaceVariant,
    onSurfaceVariant: Colors.onLightSurfaceVariant,

    // Status colors
    error: Colors.error,
    onError: Colors.onError,
    errorContainer: Colors.errorContainer,
    onErrorContainer: Colors.onErrorContainer,

    // Utility colors
    outline: Colors.lightOutline,
    outlineVariant: Colors.lightDivider,
    shadow: Colors.shadow,
    scrim: Colors.overlay,
    inverseSurface: Colors.darkSurface,
    inverseOnSurface: Colors.onDarkSurface,
    inversePrimary: Colors.primaryLight,
    surfaceDisabled: "rgba(17, 24, 39, 0.12)",
    onSurfaceDisabled: "rgba(17, 24, 39, 0.38)",
  },
};

// Enhanced dark theme with proper contrast
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors
    primary: Colors.primaryLight,
    onPrimary: Colors.onPrimaryLight,
    primaryContainer: Colors.primaryDark,
    onPrimaryContainer: Colors.primaryContainer,

    // Secondary colors
    secondary: Colors.secondaryLight,
    onSecondary: Colors.onSecondaryLight,
    secondaryContainer: Colors.secondaryDark,
    onSecondaryContainer: Colors.secondaryContainer,

    // Tertiary colors
    tertiary: Colors.tertiaryLight,
    onTertiary: Colors.onTertiaryLight,
    tertiaryContainer: Colors.tertiaryDark,
    onTertiaryContainer: Colors.tertiaryContainer,

    // Surface colors
    background: Colors.darkBackground,
    onBackground: Colors.onDarkBackground,
    surface: Colors.darkSurface,
    onSurface: Colors.onDarkSurface,
    surfaceVariant: Colors.darkSurfaceVariant,
    onSurfaceVariant: Colors.onDarkSurfaceVariant,

    // Status colors
    error: "rgb(216, 99, 99)",
    onError: Colors.onErrorContainer,
    errorContainer: "rgb(153, 27, 27)",
    onErrorContainer: Colors.errorContainer,

    // Utility colors
    outline: Colors.darkOutline,
    outlineVariant: Colors.darkDivider,
    shadow: Colors.darkShadow,
    scrim: Colors.overlay,
    inverseSurface: Colors.lightSurface,
    inverseOnSurface: Colors.onLightSurface,
    inversePrimary: Colors.primary,
    surfaceDisabled: "rgba(250, 250, 250, 0.12)",
    onSurfaceDisabled: "rgba(250, 250, 250, 0.38)",
  },
};

// Enhanced navigation themes
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

// Enhanced utility exports
export const themeColors = Colors;

// Helper functions for dynamic theming
export const getTextColor = (
  isDark: boolean,
  variant: "primary" | "secondary" | "tertiary" = "primary"
) => {
  if (isDark) {
    switch (variant) {
      case "tertiary":
        return Colors.darkTextTertiary;
      case "secondary":
        return Colors.darkTextSecondary;
      default:
        return Colors.darkText;
    }
  } else {
    switch (variant) {
      case "tertiary":
        return Colors.lightTextTertiary;
      case "secondary":
        return Colors.lightTextSecondary;
      default:
        return Colors.lightText;
    }
  }
};

// Enhanced surface color helper with proper elevation
export const getSurfaceColor = (
  isDark: boolean,
  elevation: "base" | "low" | "medium" | "high" | "highest" = "base"
) => {
  if (isDark) {
    switch (elevation) {
      case "highest":
        return Colors.darkSurfaceHighest;
      case "high":
        return Colors.darkSurfaceHigh;
      case "medium":
        return Colors.darkSurfaceVariant;
      case "low":
        return Colors.darkSurfaceLow;
      default:
        return Colors.darkBackground;
    }
  } else {
    switch (elevation) {
      case "highest":
        return Colors.lightSurfaceHighest;
      case "high":
        return Colors.lightSurfaceHigh;
      case "medium":
        return Colors.lightSurfaceVariant;
      case "low":
        return Colors.lightSurfaceLow;
      default:
        return Colors.lightBackground;
    }
  }
};

// Helper for accent colors with proper contrast
export const getAccentColor = (isDark: boolean, variant: "main" | "light" | "dark" = "main") => {
  if (isDark) {
    switch (variant) {
      case "light":
        return Colors.accentLight;
      case "dark":
        return Colors.accentDark;
      default:
        return Colors.accentLight;
    }
  } else {
    switch (variant) {
      case "light":
        return Colors.accentLight;
      case "dark":
        return Colors.accentDark;
      default:
        return Colors.accent;
    }
  }
};

// Helper for semantic colors with containers
export const getSemanticColor = (
  type: "success" | "warning" | "error" | "info",
  variant: "main" | "container" = "main"
) => {
  switch (type) {
    case "success":
      return variant === "container" ? Colors.successContainer : Colors.success;
    case "warning":
      return variant === "container" ? Colors.warningContainer : Colors.warning;
    case "error":
      return variant === "container" ? Colors.errorContainer : Colors.error;
    case "info":
      return variant === "container" ? Colors.infoContainer : Colors.info;
  }
};

// Get proper text color for semantic colors
export const getSemanticTextColor = (
  type: "success" | "warning" | "error" | "info",
  variant: "main" | "container" = "main"
) => {
  switch (type) {
    case "success":
      return variant === "container" ? Colors.onSuccessContainer : Colors.onSuccess;
    case "warning":
      return variant === "container" ? Colors.onWarningContainer : Colors.onWarning;
    case "error":
      return variant === "container" ? Colors.onErrorContainer : Colors.onError;
    case "info":
      return variant === "container" ? Colors.onInfoContainer : Colors.onInfo;
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
