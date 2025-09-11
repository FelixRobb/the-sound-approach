import { ViewStyle, TextStyle, ImageStyle } from "react-native";

// Enhanced TextStyle interface for better typography support
export interface EnhancedTextStyle extends TextStyle {
  fontSize?: number;
  fontWeight?: "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify" | "auto";
  textDecorationLine?: "none" | "underline" | "line-through";
  color?: string;
}

// Base color interface
export interface BaseColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceLow: string;
  surfaceHigh: string;
  surfaceHighest: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  shadow: string;
  scrim: string;
  surfaceTint: string;
  overlay: string;
  backdrop: string;
  divider: string;
  disabled: string;
  transparent: string;
  globalAudioBar: string;
}

//text colors
export interface TextColors {
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
}

// Semantic colors
export interface SemanticColors {
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  info: string;
  onInfo: string;
  infoContainer: string;
  onInfoContainer: string;
}

// Extended colors interface
export interface ThemeColors extends BaseColors, SemanticColors, TextColors {}

// Spacing system
export interface Spacing {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  "2xl": number;
}

// Typography scale
export interface TypographyScale {
  fontSize: number;
  lineHeight: number;
  fontWeight: "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  letterSpacing?: number;
}

export interface Typography {
  displayLarge: TypographyScale;
  displayMedium: TypographyScale;
  displaySmall: TypographyScale;
  headlineLarge: TypographyScale;
  headlineMedium: TypographyScale;
  headlineSmall: TypographyScale;
  titleLarge: TypographyScale;
  titleMedium: TypographyScale;
  titleSmall: TypographyScale;
  bodyLarge: TypographyScale;
  bodyMedium: TypographyScale;
  bodySmall: TypographyScale;
  labelLarge: TypographyScale;
  labelMedium: TypographyScale;
  labelSmall: TypographyScale;
}

// Elevation levels
export interface Elevation {
  level0: number;
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
}

// Border radius
export interface BorderRadius {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

// Z-index
export interface ZIndex {
  base: number;
  base2: number;
  base3: number;
  base4: number;
  base5: number;
  base6: number;
  base7: number;
  base8: number;
  base9: number;
  base10: number;
  dropdown: number;
  sticky: number;
  fixed: number;
  modalBackdrop: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
  globalAudioBar: number;
  appBar: number;
}

// Main theme interface
export interface Theme {
  colors: ThemeColors;
  spacing: Spacing;
  typography: Typography;
  elevation: Elevation;
  borderRadius: BorderRadius;
  zIndex: ZIndex;
  isDark: boolean;
}

// Theme context interface
export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (isDark: boolean) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

// Style utilities
export type Style = ViewStyle | TextStyle | ImageStyle;
export type StyleFunction<T = Record<string, unknown>> = (theme: Theme, props?: T) => Style;
export type StyleSheetFunction<T = Record<string, unknown>> = (
  theme: Theme,
  props?: T
) => Record<string, Style>;

// Component variants
export interface ComponentVariants {
  primary?: Style;
  secondary?: Style;
  tertiary?: Style;
  error?: Style;
  success?: Style;
  warning?: Style;
  info?: Style;
  disabled?: Style;
}

// Size variants
export interface SizeVariants {
  xs?: Style;
  sm?: Style;
  md?: Style;
  lg?: Style;
  xl?: Style;
}

// State variants
export interface StateVariants {
  default?: Style;
  pressed?: Style;
  focused?: Style;
  hovered?: Style;
  disabled?: Style;
  error?: Style;
}

// Complete component style interface
export interface ComponentStyles extends ComponentVariants, SizeVariants, StateVariants {}

// Theme mode
export type ThemeMode = "light" | "dark" | "system";

// Theme configuration
export interface ThemeConfig {
  mode: ThemeMode;
  customColors?: Partial<ThemeColors>;
  customSpacing?: Partial<Spacing>;
  customTypography?: Partial<Typography>;
  customBorderRadius?: Partial<BorderRadius>;
}
