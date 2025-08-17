import { StyleSheet } from "react-native";

import { createShadow } from "./shadows";
import { spacing } from "./spacing";
import { Theme, Style, StyleSheetFunction, ComponentStyles } from "./types";
import { typography } from "./typography";

// Style utility functions
export const createStyles = <T>(styleFunction: StyleSheetFunction<T>): StyleSheetFunction<T> => {
  return styleFunction;
};

// Component style creators
export const createButtonStyles = (theme: Theme) => {
  const { colors, borderRadius: themeBorderRadius } = theme;

  return StyleSheet.create({
    // Base button styles
    base: {
      borderRadius: themeBorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      ...createShadow("level1", theme),
    },
    // Size variants
    xs: {
      height: 32,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
    },
    sm: {
      height: 40,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    md: {
      height: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    lg: {
      height: 56,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    xl: {
      height: 64,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    // Variant styles
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondaryContainer,
    },
    tertiary: {
      backgroundColor: colors.tertiaryContainer,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    text: {
      backgroundColor: colors.surface,
    },
    // State styles
    disabled: {
      backgroundColor: colors.disabled,
      opacity: 0.6,
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    focused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
  });
};

export const createTextStyles = (theme: Theme) => {
  const { colors } = theme;

  return StyleSheet.create({
    // Typography variants
    displayLarge: {
      ...typography.displayLarge,
      color: colors.onBackground,
    },
    displayMedium: {
      ...typography.displayMedium,
      color: colors.onBackground,
    },
    displaySmall: {
      ...typography.displaySmall,
      color: colors.onBackground,
    },
    headlineLarge: {
      ...typography.headlineLarge,
      color: colors.onBackground,
    },
    headlineMedium: {
      ...typography.headlineMedium,
      color: colors.onBackground,
    },
    headlineSmall: {
      ...typography.headlineSmall,
      color: colors.onBackground,
    },
    titleLarge: {
      ...typography.titleLarge,
      color: colors.onBackground,
    },
    titleMedium: {
      ...typography.titleMedium,
      color: colors.onBackground,
    },
    titleSmall: {
      ...typography.titleSmall,
      color: colors.onBackground,
    },
    bodyLarge: {
      ...typography.bodyLarge,
      color: colors.onSurface,
    },
    bodyMedium: {
      ...typography.bodyMedium,
      color: colors.onSurface,
    },
    bodySmall: {
      ...typography.bodySmall,
      color: colors.onSurface,
    },
    labelLarge: {
      ...typography.labelLarge,
      color: colors.onSurface,
    },
    labelMedium: {
      ...typography.labelMedium,
      color: colors.onSurface,
    },
    labelSmall: {
      ...typography.labelSmall,
      color: colors.onSurface,
    },
    // Button text styles
    buttonText: {
      ...typography.labelLarge,
      color: colors.onPrimary,
    },
    buttonTextSecondary: {
      ...typography.labelLarge,
      color: colors.onSecondaryContainer,
    },
    buttonTextOutlined: {
      ...typography.labelLarge,
      color: colors.primary,
    },
    buttonTextText: {
      ...typography.labelLarge,
      color: colors.primary,
    },
    // Status text styles
    success: {
      color: colors.success,
    },
    warning: {
      color: colors.warning,
    },
    error: {
      color: colors.error,
    },
    info: {
      color: colors.info,
    },
    // Utility text styles
    muted: {
      color: colors.onSurfaceVariant,
    },
    inverse: {
      color: colors.inverseOnSurface,
    },
  });
};

export const createInputStyles = (theme: Theme) => {
  const { colors, borderRadius: themeBorderRadius } = theme;

  return StyleSheet.create({
    // Base input styles
    base: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: themeBorderRadius.md,
      borderWidth: 1,
      borderColor: colors.outline,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    // Size variants
    xs: {
      height: 32,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    sm: {
      height: 40,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    md: {
      height: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    lg: {
      height: 56,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    xl: {
      height: 64,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    // State styles
    focused: {
      borderColor: colors.primary,
      borderWidth: 2,
      ...createShadow("level1", theme),
    },
    error: {
      borderColor: colors.error,
      borderWidth: 2,
    },
    disabled: {
      backgroundColor: colors.disabled,
      borderColor: colors.outline,
      opacity: 0.6,
    },
    // Text styles
    text: {
      ...typography.bodyLarge,
      color: colors.onSurface,
    },
    placeholder: {
      color: colors.onSurfaceVariant,
    },
    label: {
      ...typography.labelMedium,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    helper: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      marginTop: spacing.xs,
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
};

export const createCardStyles = (theme: Theme) => {
  const { colors, borderRadius: themeBorderRadius } = theme;

  return StyleSheet.create({
    // Base card styles
    base: {
      backgroundColor: colors.surface,
      borderRadius: themeBorderRadius.md,
      padding: spacing.md,
      marginVertical: spacing.xs,
    },
    // Elevation variants
    flat: {
      borderWidth: 1,
      borderColor: colors.outline,
    },
    elevated: {
      ...createShadow("level1", theme),
    },
    floating: {
      ...createShadow("level2", theme),
    },
    // Size variants
    compact: {
      padding: spacing.sm,
    },
    spacious: {
      padding: spacing.lg,
    },
    // State styles
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    focused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    // Content styles
    header: {
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
      paddingBottom: spacing.md,
      marginBottom: spacing.md,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.outline,
      paddingTop: spacing.md,
      marginTop: spacing.md,
    },
  });
};

export const createLayoutStyles = (theme: Theme) => {
  const { colors } = theme;

  return StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Layout utilities
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    column: {
      flexDirection: "column",
    },
    center: {
      justifyContent: "center",
      alignItems: "center",
    },
    spaceBetween: {
      justifyContent: "space-between",
    },
    spaceAround: {
      justifyContent: "space-around",
    },
    spaceEvenly: {
      justifyContent: "space-evenly",
    },
    // Flex utilities
    flex1: { flex: 1 },
    flex2: { flex: 2 },
    flex3: { flex: 3 },
    // Alignment utilities
    alignStart: { alignItems: "flex-start" },
    alignCenter: { alignItems: "center" },
    alignEnd: { alignItems: "flex-end" },
    alignStretch: { alignItems: "stretch" },
    // Justify utilities
    justifyStart: { justifyContent: "flex-start" },
    justifyCenter: { justifyContent: "center" },
    justifyEnd: { justifyContent: "flex-end" },
    justifySpaceBetween: { justifyContent: "space-between" },
    justifySpaceAround: { justifyContent: "space-around" },
    justifySpaceEvenly: { justifyContent: "space-evenly" },
  });
};

// Utility functions for common patterns
export const createSpacingStyles = () => {
  return StyleSheet.create({
    // Padding
    p0: { padding: 0 },
    p1: { padding: spacing.xs },
    p2: { padding: spacing.sm },
    p3: { padding: spacing.md },
    p4: { padding: spacing.lg },
    p5: { padding: spacing.xl },
    // Padding horizontal
    px0: { paddingHorizontal: 0 },
    px1: { paddingHorizontal: spacing.xs },
    px2: { paddingHorizontal: spacing.sm },
    px3: { paddingHorizontal: spacing.md },
    px4: { paddingHorizontal: spacing.lg },
    px5: { paddingHorizontal: spacing.xl },
    // Padding vertical
    py0: { paddingVertical: 0 },
    py1: { paddingVertical: spacing.xs },
    py2: { paddingVertical: spacing.sm },
    py3: { paddingVertical: spacing.md },
    py4: { paddingVertical: spacing.lg },
    py5: { paddingVertical: spacing.xl },
    // Margin
    m0: { margin: 0 },
    m1: { margin: spacing.xs },
    m2: { margin: spacing.sm },
    m3: { margin: spacing.md },
    m4: { margin: spacing.lg },
    m5: { margin: spacing.xl },
    // Margin horizontal
    mx0: { marginHorizontal: 0 },
    mx1: { marginHorizontal: spacing.xs },
    mx2: { marginHorizontal: spacing.sm },
    mx3: { marginHorizontal: spacing.md },
    mx4: { marginHorizontal: spacing.lg },
    mx5: { marginHorizontal: spacing.xl },
    // Margin vertical
    my0: { marginVertical: 0 },
    my1: { marginVertical: spacing.xs },
    my2: { marginVertical: spacing.sm },
    my3: { marginVertical: spacing.md },
    my4: { marginVertical: spacing.lg },
    my5: { marginVertical: spacing.xl },
  });
};

export const createBorderStyles = (theme: Theme) => {
  const { colors, borderRadius: themeBorderRadius } = theme;

  return StyleSheet.create({
    // Border radius
    roundedNone: { borderRadius: themeBorderRadius.none },
    roundedXs: { borderRadius: themeBorderRadius.xs },
    roundedSm: { borderRadius: themeBorderRadius.sm },
    roundedMd: { borderRadius: themeBorderRadius.md },
    roundedLg: { borderRadius: themeBorderRadius.lg },
    roundedXl: { borderRadius: themeBorderRadius.xl },
    roundedFull: { borderRadius: themeBorderRadius.full },
    // Border width
    border0: { borderWidth: 0 },
    border1: { borderWidth: 1 },
    border2: { borderWidth: 2 },
    border4: { borderWidth: 4 },
    // Border color
    borderPrimary: { borderColor: colors.primary },
    borderSecondary: { borderColor: colors.secondary },
    borderOutline: { borderColor: colors.outline },
    borderError: { borderColor: colors.error },
    borderSuccess: { borderColor: colors.success },
    borderWarning: { borderColor: colors.warning },
    borderInfo: { borderColor: colors.info },
  });
};

// Style composition utilities
export const composeStyles = (...styles: (Style | undefined)[]): Style => {
  return styles.reduce<Style>((composed, style) => {
    if (style) {
      return { ...composed, ...style };
    }
    return composed;
  }, {});
};

export const createVariantStyles = <T extends ComponentStyles>(
  baseStyles: T,
  variants: Partial<T>
): T => {
  return { ...baseStyles, ...variants };
};

// Responsive style utilities
export const createResponsiveStyles = <T>(styles: {
  small?: T;
  medium?: T;
  large?: T;
  xlarge?: T;
}) => {
  return styles;
};

// Animation style utilities
export const createAnimatedStyles = (theme: Theme) => {
  const { animation } = theme;

  return {
    // Fade animations
    fadeIn: {
      opacity: 1,
      transition: `opacity ${animation.duration.normal}ms ${animation.easing.easeInOut}`,
    },
    fadeOut: {
      opacity: 0,
      transition: `opacity ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    },
    // Scale animations
    scaleIn: {
      transform: [{ scale: 1 }],
      transition: `transform ${animation.duration.normal}ms ${animation.easing.easeOut}`,
    },
    scaleOut: {
      transform: [{ scale: 0.95 }],
      transition: `transform ${animation.duration.fast}ms ${animation.easing.easeIn}`,
    },
    // Slide animations
    slideIn: {
      transform: [{ translateX: 0 }],
      transition: `transform ${animation.duration.normal}ms ${animation.easing.easeOut}`,
    },
    slideOut: {
      transform: [{ translateX: -100 }],
      transition: `transform ${animation.duration.normal}ms ${animation.easing.easeIn}`,
    },
  };
};
