import {
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

// Define our color palette
const Colors = {
  // Primary color (bright red)
  primary: '#D32F2F',
  primaryLight: '#FF6659',
  primaryDark: '#9A0007',

  // Secondary color (complementary to red)
  secondary: '#455A64',
  secondaryLight: '#718792',
  secondaryDark: '#1C313A',

  // Accent colors
  accent: '#F44336',

  // Status colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252',
  info: '#2196F3',

  // Light mode colors
  lightBackground: '#FFFFFF',
  lightSurface: '#F5F5F5',
  lightText: '#121212',
  lightDisabled: '#9E9E9E',
  lightPlaceholder: '#757575',

  // Dark mode colors
  darkBackground: '#121212',
  darkSurface: '#1E1E1E',
  darkText: '#FFFFFF',
  darkDisabled: '#757575',
  darkPlaceholder: '#9E9E9E',
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
    background: Colors.lightBackground,
    surface: Colors.lightSurface,
    error: Colors.error,
    onSurface: Colors.lightText,
    onBackground: Colors.lightText,
    onPrimary: Colors.lightText,
    onSecondary: Colors.lightText,
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
    background: Colors.darkBackground,
    surface: Colors.darkSurface,
    error: Colors.error,
    onSurface: Colors.darkText,
    onBackground: Colors.darkText,
    onPrimary: Colors.darkText,
    onSecondary: Colors.darkText,
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
    border: '#E0E0E0',
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
    border: '#333333',
    notification: Colors.accent,
  },
};

// Export the theme (for backward compatibility)
export const theme = lightTheme;
