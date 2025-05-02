import { MD3LightTheme, MD3DarkTheme, MD3Theme } from "react-native-paper"
import { DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme } from "@react-navigation/native"

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
  light: {
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#121212",
    textSecondary: "rgba(0, 0, 0, 0.6)",
    disabled: "#9E9E9E",
    placeholder: "#757575",
    divider: "#E0E0E0",
    overlay: "rgba(0, 0, 0, 0.5)",
    backdrop: "rgba(0, 0, 0, 0.05)",
    elevation: {
      level0: 'transparent',
      level1: "rgba(0, 0, 0, 0.05)",
      level2: "rgba(0, 0, 0, 0.08)",
      level3: "rgba(0, 0, 0, 0.1)",
      level4: "rgba(0, 0, 0, 0.12)",
      level5: "rgba(0, 0, 0, 0.14)",
    },
    alpha: {
      primary: {
        5: "rgba(211, 47, 47, 0.05)",
        8: "rgba(211, 47, 47, 0.08)",
        10: "rgba(211, 47, 47, 0.1)",
        15: "rgba(211, 47, 47, 0.15)",
        20: "rgba(211, 47, 47, 0.2)",
      },
      white: {
        8: "rgba(255, 255, 255, 0.08)",
        10: "rgba(255, 255, 255, 0.1)",
        20: "rgba(255, 255, 255, 0.2)",
      },
      black: {
        5: "rgba(0, 0, 0, 0.05)",
        8: "rgba(0, 0, 0, 0.08)",
        10: "rgba(0, 0, 0, 0.1)",
        20: "rgba(0, 0, 0, 0.2)",
      },
      success: {
        10: "rgba(76, 175, 80, 0.1)",
        20: "rgba(76, 175, 80, 0.2)",
      },
      warning: {
        10: "rgba(255, 152, 0, 0.1)",
        20: "rgba(255, 152, 0, 0.2)",
      },
      error: {
        10: "rgba(176, 0, 32, 0.1)",
        20: "rgba(176, 0, 32, 0.2)",
      },
    },
  },
  
  // Dark mode colors
  dark: {
    background: "#121212",
    surface: "#1E1E1E",
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.6)",
    disabled: "#757575",
    placeholder: "#9E9E9E",
    divider: "#333333",
    overlay: "rgba(0, 0, 0, 0.7)",
    backdrop: "rgba(255, 255, 255, 0.05)",
    elevation: {
      level0: 'transparent',
      level1: "rgba(255, 255, 255, 0.05)",
      level2: "rgba(255, 255, 255, 0.08)",
      level3: "rgba(255, 255, 255, 0.1)",
      level4: "rgba(255, 255, 255, 0.12)",
      level5: "rgba(255, 255, 255, 0.14)",
    },
    alpha: {
      primary: {
        5: "rgba(255, 102, 89, 0.05)",
        8: "rgba(255, 102, 89, 0.08)",
        10: "rgba(255, 102, 89, 0.1)",
        15: "rgba(255, 102, 89, 0.15)",
        20: "rgba(255, 102, 89, 0.2)",
      },
      white: {
        8: "rgba(255, 255, 255, 0.08)",
        10: "rgba(255, 255, 255, 0.1)",
        20: "rgba(255, 255, 255, 0.2)",
      },
      black: {
        5: "rgba(0, 0, 0, 0.05)",
        8: "rgba(0, 0, 0, 0.08)",
        10: "rgba(0, 0, 0, 0.1)",
        20: "rgba(0, 0, 0, 0.2)",
      },
      success: {
        10: "rgba(129, 199, 132, 0.1)",
        20: "rgba(129, 199, 132, 0.2)",
      },
      warning: {
        10: "rgba(255, 204, 128, 0.1)",
        20: "rgba(255, 204, 128, 0.2)",
      },
      error: {
        10: "rgba(255, 82, 82, 0.1)",
        20: "rgba(255, 82, 82, 0.2)",
      },
    },
  },
}

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
}

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
}

// Navigation themes
export const navigationLightTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,
    primary: Colors.primary,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.divider,
    notification: Colors.accent,
  },
}

export const navigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: Colors.primaryLight,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.divider,
    notification: Colors.accent,
  },
}

// Export colors for direct usage
export { Colors }

// Export the theme (for backward compatibility)
export const theme = lightTheme
