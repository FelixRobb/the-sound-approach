import {
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";

import { ThemeColors } from "./types";

// Light theme colors (MD3 inspired with enhancements)
export const lightColors: ThemeColors = {
  // Primary system
  primary: "rgb(236, 121, 54)",
  onPrimary: "rgb(255, 255, 255)",
  primaryContainer: "rgb(255, 224, 178)",
  onPrimaryContainer: "rgb(92, 38, 0)",

  // Secondary system
  secondary: "rgb(132, 132, 132)",
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
  outlineVariant: "rgb(229, 231, 235)",
  inverseSurface: "rgb(255, 255, 255)",
  inverseOnSurface: "rgb(17, 24, 39)",
  inversePrimary: "rgb(255, 123, 0)",
  scrim: "rgba(17, 24, 39, 0.5)",
  surfaceTint: "rgb(255, 123, 0)",
  textDisabled: "rgb(209, 213, 219)",
  globalAudioBar: "rgb(249, 241, 236)",
  transparent: "transparent",
};

// Dark theme colors (MD3 inspired with enhancements)
export const darkColors: ThemeColors = {
  // Primary system
  primary: "rgb(212, 126, 27)", // Lighter for dark theme
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

  error: "rgb(184, 40, 40)", // Brighter red for dark
  onError: "hsl(0, 100%, 89%)",
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
  backdrop: "rgba(0, 0, 0, 0.9)",
  outlineVariant: "rgb(229, 231, 235)",
  inverseSurface: "rgb(255, 255, 255)",
  inverseOnSurface: "rgb(17, 24, 39)",
  inversePrimary: "rgb(255, 123, 0)",
  scrim: "rgba(17, 24, 39, 0.5)",
  surfaceTint: "rgb(255, 123, 0)",
  textDisabled: "rgb(209, 213, 219)",
  globalAudioBar: "rgb(25, 20, 16)",
  transparent: "transparent",
};

export const navigationLightTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,
    primary: lightColors.primary,
    background: lightColors.background,
    card: lightColors.surface,
    text: lightColors.text,
    border: lightColors.outline,
    notification: lightColors.primary,
  },
};

export const navigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: darkColors.primary,
    background: darkColors.background,
    card: darkColors.surface,
    text: darkColors.text,
    border: darkColors.outline,
    notification: darkColors.primary,
  },
};

// Color utility functions
export const createColorVariants = (baseColor: string) => {
  return {
    light: baseColor,
    dark: baseColor,
    // You can add more variants here if needed
  };
};

export const createSemanticColorVariants = (colors: ThemeColors) => {
  return {
    success: {
      light: colors.success,
      dark: colors.success,
    },
    warning: {
      light: colors.warning,
      dark: colors.warning,
    },
    info: {
      light: colors.info,
      dark: colors.info,
    },
    error: {
      light: colors.error,
      dark: colors.error,
    },
  };
};
