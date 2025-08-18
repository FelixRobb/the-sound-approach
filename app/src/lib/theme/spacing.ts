import { Spacing } from "./types";

// MD3 inspired spacing system
export const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Spacing utility functions
export const getSpacing = (size: keyof Spacing): number => {
  return spacing[size];
};

export const createSpacingVariants = () => {
  return {
    padding: {
      xs: { padding: spacing.xs },
      sm: { padding: spacing.sm },
      md: { padding: spacing.md },
      lg: { padding: spacing.lg },
      xl: { padding: spacing.xl },
      xxl: { padding: spacing.xxl },
      xxxl: { padding: spacing.xxxl },
    },
    paddingHorizontal: {
      xs: { paddingHorizontal: spacing.xs },
      sm: { paddingHorizontal: spacing.sm },
      md: { paddingHorizontal: spacing.md },
      lg: { paddingHorizontal: spacing.lg },
      xl: { paddingHorizontal: spacing.xl },
      xxl: { paddingHorizontal: spacing.xxl },
      xxxl: { paddingHorizontal: spacing.xxxl },
    },
    paddingVertical: {
      xs: { paddingVertical: spacing.xs },
      sm: { paddingVertical: spacing.sm },
      md: { paddingVertical: spacing.md },
      lg: { paddingVertical: spacing.lg },
      xl: { paddingVertical: spacing.xl },
      xxl: { paddingVertical: spacing.xxl },
      xxxl: { paddingVertical: spacing.xxxl },
    },
    margin: {
      xs: { margin: spacing.xs },
      sm: { margin: spacing.sm },
      md: { margin: spacing.md },
      lg: { margin: spacing.lg },
      xl: { margin: spacing.xl },
      xxl: { margin: spacing.xxl },
      xxxl: { margin: spacing.xxxl },
    },
    marginHorizontal: {
      xs: { marginHorizontal: spacing.xs },
      sm: { marginHorizontal: spacing.sm },
      md: { marginHorizontal: spacing.md },
      lg: { marginHorizontal: spacing.lg },
      xl: { marginHorizontal: spacing.xl },
      xxl: { marginHorizontal: spacing.xxl },
      xxxl: { marginHorizontal: spacing.xxxl },
    },
    marginVertical: {
      xs: { marginVertical: spacing.xs },
      sm: { marginVertical: spacing.sm },
      md: { marginVertical: spacing.md },
      lg: { marginVertical: spacing.lg },
      xl: { marginVertical: spacing.xl },
      xxl: { marginVertical: spacing.xxl },
      xxxl: { marginVertical: spacing.xxxl },
    },
    gap: {
      xs: { gap: spacing.xs },
      sm: { gap: spacing.sm },
      md: { gap: spacing.md },
      lg: { gap: spacing.lg },
      xl: { gap: spacing.xl },
      xxl: { gap: spacing.xxl },
      xxxl: { gap: spacing.xxxl },
    },
  };
};

// Common spacing combinations
export const commonSpacing = {
  // Component spacing
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  card: {
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  // Layout spacing
  screen: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  // Navigation spacing
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
};

// Responsive spacing (for different screen sizes)
export const responsiveSpacing = {
  small: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.sm,
    lg: spacing.md,
    xl: spacing.lg,
    xxl: spacing.xl,
    xxxl: spacing.xxl,
  },
  medium: spacing, // Default spacing
  large: {
    xs: spacing.sm,
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.xl,
    xl: spacing.xxl,
    xxl: spacing.xxxl,
    xxxl: spacing.xxxl * 1.5,
  },
};
