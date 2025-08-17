import { BorderRadius } from "./types";

// Border radius constants
export const borderRadius: BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Default theme values
export const defaultThemeValues = {
  roundness: 12,
  scale: 1.0,
};

// Theme breakpoints (for responsive design)
export const breakpoints = {
  small: 320,
  medium: 768,
  large: 1024,
  xlarge: 1440,
};

// Z-index constants for layering
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};

// Common component sizes
export const componentSizes = {
  // Button sizes
  button: {
    xs: { height: 32, paddingHorizontal: 12 },
    sm: { height: 40, paddingHorizontal: 16 },
    md: { height: 48, paddingHorizontal: 20 },
    lg: { height: 56, paddingHorizontal: 24 },
    xl: { height: 64, paddingHorizontal: 28 },
  },
  // Input sizes
  input: {
    xs: { height: 32, paddingHorizontal: 12 },
    sm: { height: 40, paddingHorizontal: 16 },
    md: { height: 48, paddingHorizontal: 16 },
    lg: { height: 56, paddingHorizontal: 20 },
    xl: { height: 64, paddingHorizontal: 24 },
  },
  // Icon sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    xxl: 48,
  },
  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
    xxl: 64,
  },
};

// Common layout constants
export const layoutConstants = {
  // Header heights
  header: {
    small: 56,
    medium: 64,
    large: 72,
  },
  // Tab bar heights
  tabBar: {
    height: 56,
    iconSize: 24,
  },
  // Sidebar widths
  sidebar: {
    narrow: 240,
    wide: 320,
    full: "100%",
  },
  // Modal dimensions
  modal: {
    small: { width: 320, height: 400 },
    medium: { width: 480, height: 600 },
    large: { width: 640, height: 800 },
    full: { width: "100%", height: "100%" },
  },
};

// Animation constants
export const animationConstants = {
  // Transition durations
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 1000,
  },
  // Easing functions
  easing: {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    // Custom easing functions (for web)
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  // Scale values
  scale: {
    none: 0,
    small: 0.5,
    medium: 0.75,
    normal: 1,
    large: 1.25,
    xlarge: 1.5,
    xxlarge: 2,
  },
};

// Color constants
export const colorConstants = {
  // Opacity values
  opacity: {
    none: 0,
    low: 0.1,
    medium: 0.5,
    high: 0.8,
    full: 1,
  },
  // Alpha values for colors
  alpha: {
    none: 0,
    low: 0.1,
    medium: 0.5,
    high: 0.8,
    full: 1,
  },
};

// Accessibility constants
export const accessibilityConstants = {
  // Minimum touch target sizes
  touchTarget: {
    minimum: 44,
    recommended: 48,
    large: 56,
  },
  // Focus indicators
  focusIndicator: {
    width: 2,
    offset: 2,
  },
  // Color contrast ratios
  contrast: {
    minimum: 4.5,
    enhanced: 7.0,
  },
};

// Platform-specific constants
export const platformConstants = {
  ios: {
    // iOS specific values
    cornerRadius: {
      small: 8,
      medium: 12,
      large: 16,
    },
    shadow: {
      offset: { width: 0, height: 1 },
      radius: 3,
      opacity: 0.2,
    },
  },
  android: {
    // Android specific values
    elevation: {
      small: 2,
      medium: 4,
      large: 8,
    },
    ripple: {
      duration: 200,
      opacity: 0.12,
    },
  },
};

// Export all constants
export const themeConstants = {
  borderRadius,
  defaultThemeValues,
  breakpoints,
  zIndex,
  componentSizes,
  layoutConstants,
  animationConstants,
  colorConstants,
  accessibilityConstants,
  platformConstants,
};
