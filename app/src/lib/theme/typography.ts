import { TextStyle } from "react-native";

import { Theme, ThemeColors, Typography } from "./types";

// Font size scale - easy to use and remember
export const fontSizes = {
  xs: 11,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  "2xl": 20,
  "3xl": 22,
  "4xl": 24,
  "5xl": 28,
  "6xl": 32,
  "7xl": 36,
  "8xl": 45,
  "9xl": 57,
} as const;

// Font weights - easy to remember names
export const fontWeights = {
  thin: "100" as const,
  light: "200" as const,
  regular: "300" as const,
  normal: "400" as const,
  medium: "500" as const,
  semiBold: "600" as const,
  bold: "700" as const,
  extraBold: "800" as const,
  black: "900" as const,
};

// Line heights - relative to font size for better scaling
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// Letter spacing
export const letterSpacings = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1,
} as const;

// MD3 Typography scale with enhanced features (keeping for compatibility)
export const typography: Typography = {
  displayLarge: {
    fontSize: fontSizes["9xl"],
    lineHeight: Math.round(fontSizes["9xl"] * lineHeights.tight),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.tight,
  },
  displayMedium: {
    fontSize: fontSizes["8xl"],
    lineHeight: Math.round(fontSizes["8xl"] * lineHeights.tight),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  displaySmall: {
    fontSize: fontSizes["7xl"],
    lineHeight: Math.round(fontSizes["7xl"] * lineHeights.snug),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  headlineLarge: {
    fontSize: fontSizes["6xl"],
    lineHeight: Math.round(fontSizes["6xl"] * lineHeights.snug),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  headlineMedium: {
    fontSize: fontSizes["5xl"],
    lineHeight: Math.round(fontSizes["5xl"] * lineHeights.snug),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  headlineSmall: {
    fontSize: fontSizes["4xl"],
    lineHeight: Math.round(fontSizes["4xl"] * lineHeights.normal),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  titleLarge: {
    fontSize: fontSizes["3xl"],
    lineHeight: Math.round(fontSizes["3xl"] * lineHeights.snug),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  titleMedium: {
    fontSize: fontSizes.lg,
    lineHeight: Math.round(fontSizes.lg * lineHeights.normal),
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wide,
  },
  titleSmall: {
    fontSize: fontSizes.base,
    lineHeight: Math.round(fontSizes.base * lineHeights.normal),
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.normal,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    lineHeight: Math.round(fontSizes.lg * lineHeights.normal),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.wider,
  },
  bodyMedium: {
    fontSize: fontSizes.base,
    lineHeight: Math.round(fontSizes.base * lineHeights.normal),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.wide,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    lineHeight: Math.round(fontSizes.sm * lineHeights.normal),
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.wider,
  },
  labelLarge: {
    fontSize: fontSizes.base,
    lineHeight: Math.round(fontSizes.base * lineHeights.normal),
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.normal,
  },
  labelMedium: {
    fontSize: fontSizes.sm,
    lineHeight: Math.round(fontSizes.sm * lineHeights.normal),
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wider,
  },
  labelSmall: {
    fontSize: fontSizes.xs,
    lineHeight: Math.round(fontSizes.xs * lineHeights.normal),
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wider,
  },
};

// Easy-to-use text style creator
export const createTextStyle = (options: {
  size?: keyof typeof fontSizes;
  weight?: keyof typeof fontWeights;
  lineHeight?: keyof typeof lineHeights | number;
  letterSpacing?: keyof typeof letterSpacings | number;
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: "none" | "underline" | "line-through";
}): TextStyle => {
  const {
    size = "base",
    weight = "normal",
    lineHeight = "normal",
    letterSpacing = "normal",
    color,
    textAlign,
    textDecoration,
  } = options;

  const fontSize = fontSizes[size];
  const computedLineHeight =
    typeof lineHeight === "number" ? lineHeight : Math.round(fontSize * lineHeights[lineHeight]);

  const computedLetterSpacing =
    typeof letterSpacing === "number" ? letterSpacing : letterSpacings[letterSpacing];

  return {
    fontSize,
    fontWeight: fontWeights[weight],
    lineHeight: computedLineHeight,
    letterSpacing: computedLetterSpacing,
    ...(color && { color }),
    ...(textAlign && { textAlign }),
    ...(textDecoration && { textDecorationLine: textDecoration }),
  };
};

// Theme-aware text style creator - uses theme colors automatically
export const createThemedTextStyle = (
  theme: Theme,
  options: {
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
  }
) => {
  const { color, ...restOptions } = options;

  let resolvedColor: string | undefined;
  if (color) {
    // Check if it's a theme color key
    if (theme.colors && theme.colors[color]) {
      resolvedColor = theme.colors[color];
    } else {
      // Assume it's a direct color value
      resolvedColor = color;
    }
  }

  return createTextStyle({
    ...restOptions,
    color: resolvedColor,
  });
};

// Text alignment utilities
export const textAlign = {
  left: "left" as const,
  center: "center" as const,
  right: "right" as const,
  justify: "justify" as const,
  auto: "auto" as const,
};

// Text decoration utilities
export const textDecoration = {
  none: "none" as const,
  underline: "underline" as const,
  lineThrough: "line-through" as const,
};
