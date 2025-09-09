import { Spacing } from "./types";

// MD3 inspired spacing system
export const spacing: Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  "2xl": 96,
};

// Spacing utility functions
export const getSpacing = (size: keyof Spacing): number => {
  return spacing[size];
};

export const createSpacingVariants = () => {
  return {
    padding: {
      xxs: { padding: spacing.xxs },
      xs: { padding: spacing.xs },
      sm: { padding: spacing.sm },
      md: { padding: spacing.md },
      lg: { padding: spacing.lg },
      xl: { padding: spacing.xl },
      xxl: { padding: spacing.xxl },
      xxxl: { padding: spacing.xxxl },
      "2xl": { padding: spacing["2xl"] },
    },
    paddingHorizontal: {
      xxs: { paddingHorizontal: spacing.xxs },
      xs: { paddingHorizontal: spacing.xs },
      sm: { paddingHorizontal: spacing.sm },
      md: { paddingHorizontal: spacing.md },
      lg: { paddingHorizontal: spacing.lg },
      xl: { paddingHorizontal: spacing.xl },
      xxl: { paddingHorizontal: spacing.xxl },
      xxxl: { paddingHorizontal: spacing.xxxl },
      "2xl": { paddingHorizontal: spacing["2xl"] },
    },
    paddingVertical: {
      xxs: { paddingVertical: spacing.xxs },
      xs: { paddingVertical: spacing.xs },
      sm: { paddingVertical: spacing.sm },
      md: { paddingVertical: spacing.md },
      lg: { paddingVertical: spacing.lg },
      xl: { paddingVertical: spacing.xl },
      xxl: { paddingVertical: spacing.xxl },
      xxxl: { paddingVertical: spacing.xxxl },
      "2xl": { paddingVertical: spacing["2xl"] },
    },
    margin: {
      xxs: { margin: spacing.xxs },
      xs: { margin: spacing.xs },
      sm: { margin: spacing.sm },
      md: { margin: spacing.md },
      lg: { margin: spacing.lg },
      xl: { margin: spacing.xl },
      xxl: { margin: spacing.xxl },
      xxxl: { margin: spacing.xxxl },
      "2xl": { margin: spacing["2xl"] },
    },
    marginHorizontal: {
      xxs: { marginHorizontal: spacing.xxs },
      xs: { marginHorizontal: spacing.xs },
      sm: { marginHorizontal: spacing.sm },
      md: { marginHorizontal: spacing.md },
      lg: { marginHorizontal: spacing.lg },
      xl: { marginHorizontal: spacing.xl },
      xxl: { marginHorizontal: spacing.xxl },
      xxxl: { marginHorizontal: spacing.xxxl },
      "2xl": { marginHorizontal: spacing["2xl"] },
    },
    marginVertical: {
      xxs: { marginVertical: spacing.xxs },
      xs: { marginVertical: spacing.xs },
      sm: { marginVertical: spacing.sm },
      md: { marginVertical: spacing.md },
      lg: { marginVertical: spacing.lg },
      xl: { marginVertical: spacing.xl },
      xxl: { marginVertical: spacing.xxl },
      xxxl: { marginVertical: spacing.xxxl },
      "2xl": { marginVertical: spacing["2xl"] },
    },
    gap: {
      xxs: { gap: spacing.xxs },
      xs: { gap: spacing.xs },
      sm: { gap: spacing.sm },
      md: { gap: spacing.md },
      lg: { gap: spacing.lg },
      xl: { gap: spacing.xl },
      xxl: { gap: spacing.xxl },
      xxxl: { gap: spacing.xxxl },
      "2xl": { gap: spacing["2xl"] },
    },
  };
};
