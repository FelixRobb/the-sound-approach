import { Elevation, Theme } from "./types";

// MD3 Elevation levels
export const elevation: Elevation = {
  level0: 0,
  level1: 1,
  level2: 3,
  level3: 6,
  level4: 8,
  level5: 12,
};

// Shadow utility functions
export const createShadow = (level: keyof Elevation, theme: Theme) => {
  const elevationValue = elevation[level];
  const colors = theme.colors;

  return {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: elevationValue,
    },
    shadowOpacity: theme.isDark ? 0.3 : 0.15,
    shadowRadius: elevationValue,
    elevation: elevationValue,
  };
};

export const createElevation = (level: keyof Elevation, theme: Theme) => {
  return createShadow(level, theme);
};

// Predefined shadow styles
export const createShadowVariants = (theme: Theme) => {
  return {
    none: {},
    small: createShadow("level1", theme),
    medium: createShadow("level2", theme),
    large: createShadow("level3", theme),
    xlarge: createShadow("level4", theme),
    xxlarge: createShadow("level5", theme),
  };
};

// Component-specific shadows
export const createComponentShadows = (theme: Theme) => {
  return {
    // Button shadows
    button: {
      default: createShadow("level1", theme),
      pressed: createShadow("level0", theme),
      elevated: createShadow("level2", theme),
    },
    // Card shadows
    card: {
      default: createShadow("level1", theme),
      elevated: createShadow("level2", theme),
      floating: createShadow("level3", theme),
    },
    // Input shadows
    input: {
      default: {},
      focused: createShadow("level1", theme),
      error: createShadow("level1", theme),
    },
    // Navigation shadows
    navigation: {
      header: createShadow("level2", theme),
      tab: createShadow("level1", theme),
      modal: createShadow("level4", theme),
    },
    // Floating action button
    fab: createShadow("level3", theme),
    // Tooltip
    tooltip: createShadow("level2", theme),
    // Dropdown
    dropdown: createShadow("level2", theme),
  };
};

// Surface creation utilities
export const createSurface = (theme: Theme, elevation: keyof Elevation = "level1") => {
  return {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...createShadow(elevation, theme),
  };
};

export const createElevatedSurface = (theme: Theme, elevation: keyof Elevation = "level2") => {
  return {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...createShadow(elevation, theme),
  };
};

// Interactive shadow states
export const createInteractiveShadows = (theme: Theme) => {
  return {
    // Pressable states
    pressable: {
      default: createShadow("level1", theme),
      pressed: createShadow("level0", theme),
      hovered: createShadow("level2", theme),
      focused: createShadow("level2", theme),
    },
    // Draggable states
    draggable: {
      default: createShadow("level1", theme),
      dragging: createShadow("level3", theme),
      dropped: createShadow("level1", theme),
    },
    // Expandable states
    expandable: {
      collapsed: createShadow("level1", theme),
      expanded: createShadow("level2", theme),
      animating: createShadow("level1", theme),
    },
  };
};

// Shadow animation utilities
export const createShadowAnimation = (theme: Theme) => {
  return {
    // Smooth shadow transitions
    transition: {
      duration: theme.animation.duration.normal,
      easing: theme.animation.easing.easeInOut,
    },
    // Shadow entrance animations
    entrance: {
      from: createShadow("level0", theme),
      to: createShadow("level1", theme),
    },
    // Shadow exit animations
    exit: {
      from: createShadow("level1", theme),
      to: createShadow("level0", theme),
    },
  };
};

// Utility functions for common shadow patterns
export const shadows = {
  // Get elevation value
  getElevation: (level: keyof Elevation): number => elevation[level],

  // Create shadow with custom values
  createCustomShadow: (
    theme: Theme,
    offsetX: number = 0,
    offsetY: number = 0,
    radius: number = 4,
    opacity: number = 0.15
  ) => ({
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: radius,
  }),

  // Create inset shadow (for pressed states)
  createInsetShadow: (theme: Theme, radius: number = 2) => ({
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: radius,
    elevation: 0,
  }),
};
