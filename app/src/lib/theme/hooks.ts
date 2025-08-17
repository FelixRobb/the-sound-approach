import { useMemo } from "react";

import { useEnhancedTheme } from "../../context/EnhancedThemeProvider";

import {
  createTextStyle,
  createThemedTextStyle,
  textStyles,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  scaleTextStyle,
  responsiveScale,
} from "./typography";
import { ThemeColors } from "./types";

// Hook to easily create text styles with theme colors
export const useTextStyle = (options: {
  size?: keyof typeof fontSizes;
  weight?: keyof typeof fontWeights;
  lineHeight?: keyof typeof lineHeights | number;
  letterSpacing?: keyof typeof letterSpacings | number;
  color?:
    | "primary"
    | "secondary"
    | "onSurface"
    | "onSurfaceVariant"
    | "error"
    | "success"
    | keyof ThemeColors;
  textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: "none" | "underline" | "line-through";
}) => {
  const { theme } = useEnhancedTheme();

  return useMemo(() => createThemedTextStyle(theme, options), [theme, options]);
};

// Hook to get predefined text styles
export const useTextStyles = () => {
  return useMemo(() => textStyles, []);
};

// Hook to create responsive text styles
export const useResponsiveTextStyle = (
  baseSize: keyof typeof fontSizes,
  screenSize: "small" | "base" | "large" = "base",
  options?: {
    weight?: keyof typeof fontWeights;
    lineHeight?: keyof typeof lineHeights;
    letterSpacing?: keyof typeof letterSpacings;
  }
) => {
  return useMemo(() => {
    const baseStyle = createTextStyle({
      size: baseSize,
      ...options,
    });

    const scale = responsiveScale[screenSize];
    return scaleTextStyle(baseStyle, scale);
  }, [baseSize, screenSize, options]);
};

// Hook to easily access typography constants
export const useTypographyConstants = () => {
  return useMemo(
    () => ({
      fontSizes,
      fontWeights,
      lineHeights,
      letterSpacings,
      responsiveScale,
    }),
    []
  );
};

// Hook to create themed text styles with common patterns
export const useThemedTextStyles = () => {
  const { theme } = useEnhancedTheme();

  return useMemo(
    () => ({
      // Headers with theme colors
      h1: createThemedTextStyle(theme, {
        size: "6xl",
        weight: "bold",
        lineHeight: "tight",
        color: "onSurface",
      }),
      h2: createThemedTextStyle(theme, {
        size: "5xl",
        weight: "bold",
        lineHeight: "tight",
        color: "onSurface",
      }),
      h3: createThemedTextStyle(theme, {
        size: "4xl",
        weight: "semiBold",
        lineHeight: "snug",
        color: "onSurface",
      }),
      h4: createThemedTextStyle(theme, {
        size: "3xl",
        weight: "semiBold",
        lineHeight: "snug",
        color: "onSurface",
      }),
      h5: createThemedTextStyle(theme, {
        size: "2xl",
        weight: "medium",
        lineHeight: "snug",
        color: "onSurface",
      }),
      h6: createThemedTextStyle(theme, {
        size: "xl",
        weight: "medium",
        lineHeight: "normal",
        color: "onSurface",
      }),

      // Body text
      body: createThemedTextStyle(theme, { size: "base", weight: "normal", color: "onSurface" }),
      bodyLarge: createThemedTextStyle(theme, { size: "lg", weight: "normal", color: "onSurface" }),
      bodySmall: createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),

      // Labels and UI text
      label: createThemedTextStyle(theme, {
        size: "sm",
        weight: "medium",
        color: "onSurfaceVariant",
      }),
      labelLarge: createThemedTextStyle(theme, {
        size: "base",
        weight: "medium",
        color: "onSurfaceVariant",
      }),
      labelSmall: createThemedTextStyle(theme, {
        size: "xs",
        weight: "medium",
        color: "onSurfaceVariant",
      }),

      // Button text
      buttonPrimary: createThemedTextStyle(theme, {
        size: "base",
        weight: "medium",
        letterSpacing: "wide",
        color: "onPrimary",
      }),
      buttonSecondary: createThemedTextStyle(theme, {
        size: "base",
        weight: "medium",
        letterSpacing: "wide",
        color: "onSecondary",
      }),
      buttonText: createThemedTextStyle(theme, {
        size: "base",
        weight: "medium",
        letterSpacing: "wide",
        color: "primary",
      }),

      // Status colors
      success: createThemedTextStyle(theme, { size: "sm", weight: "medium", color: "success" }),
      error: createThemedTextStyle(theme, { size: "sm", weight: "medium", color: "error" }),
      warning: createThemedTextStyle(theme, { size: "sm", weight: "medium", color: "warning" }),

      // Links
      link: createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        textDecoration: "underline",
        color: "primary",
      }),
      linkSmall: createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        textDecoration: "underline",
        color: "primary",
      }),

      // Caption and helper text
      caption: createThemedTextStyle(theme, {
        size: "xs",
        weight: "normal",
        lineHeight: "snug",
        color: "onSurfaceVariant",
      }),
      overline: createThemedTextStyle(theme, {
        size: "xs",
        weight: "medium",
        letterSpacing: "widest",
        color: "onSurfaceVariant",
      }),
    }),
    [theme]
  );
};

// Hook for quick text styling - most commonly used
export const useQuickText = () => {
  const { theme } = useEnhancedTheme();

  // Return a function that creates styles on demand
  return useMemo(
    () =>
      (
        size: keyof typeof fontSizes = "base",
        weight: keyof typeof fontWeights = "normal",
        color: string = theme.colors.onSurface
      ) =>
        createTextStyle({ size, weight, color }),
    [theme]
  );
};
