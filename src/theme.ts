import { MD3LightTheme as DefaultTheme } from "react-native-paper"

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2E7D32", // Forest green - nature theme
    secondary: "#1565C0",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    error: "#B00020",
    text: "#121212",
    disabled: "#9E9E9E",
    placeholder: "#757575",
    backdrop: "rgba(0, 0, 0, 0.5)",
    notification: "#FF9800",
  },
  roundness: 8,
}

export const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: "#4CAF50", // Lighter green for dark mode
    secondary: "#42A5F5",
    background: "#121212",
    surface: "#1E1E1E",
    error: "#CF6679",
    text: "#FFFFFF",
    disabled: "#757575",
    placeholder: "#9E9E9E",
    backdrop: "rgba(0, 0, 0, 0.5)",
    notification: "#FFB74D",
  },
  roundness: 8,
}
