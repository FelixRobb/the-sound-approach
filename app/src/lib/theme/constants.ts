import { BorderRadius, ZIndex } from "./types";

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

// Z-index constants for layering
export const zIndex: ZIndex = {
  base: 0,
  base2: 1,
  base3: 2,
  base4: 3,
  base5: 4,
  base6: 5,
  base7: 6,
  base8: 7,
  base9: 8,
  base10: 9,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  globalAudioBar: 1085,
  appBar: 1090,
};

// Export all constants
export const themeConstants = {
  borderRadius,
  zIndex,
};
