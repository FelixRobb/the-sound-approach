import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef } from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";

import { useEnhancedTheme } from "../../context/EnhancedThemeProvider";

// Button variant types
export type ButtonVariant =
  | "default"
  | "primary"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "icon";

// Icon configuration
export interface ButtonIcon {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  position?: "left" | "right";
}

// Main Button props interface
export interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  // Content
  children?: React.ReactNode;
  title?: string;

  // Styling
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  backgroundColor?: string;
  textColor?: string;

  // State
  loading?: boolean;
  disabled?: boolean;

  // Icons
  icon?: ButtonIcon;
  leftIcon?: ButtonIcon;
  rightIcon?: ButtonIcon;

  // Styling overrides
  style?: ViewStyle;
  textStyle?: TextStyle;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const Button = forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  (
    {
      children,
      title,
      variant = "default",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled = false,
      icon,
      leftIcon,
      rightIcon,
      backgroundColor,
      textColor,
      style,
      textStyle,
      accessibilityLabel,
      accessibilityHint,
      onPress,
      ...props
    },
    ref
  ) => {
    const { theme } = useEnhancedTheme();

    // Determine if button is disabled
    const isDisabled = disabled || loading;

    // Create dynamic styles based on theme, variant, and state
    const styles = StyleSheet.create({
      // Base button styles
      button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.borderRadius.md,
        borderWidth: 0,
        // Size-based padding
        paddingHorizontal:
          size === "sm"
            ? theme.spacing.sm
            : size === "lg"
              ? theme.spacing.xl
              : size === "xs"
                ? theme.spacing.xs
                : size === "xl"
                  ? theme.spacing.xl
                  : size === "icon"
                    ? 0
                    : theme.spacing.lg,
        paddingVertical:
          size === "sm"
            ? theme.spacing.xs
            : size === "lg"
              ? theme.spacing.md
              : size === "xs"
                ? theme.spacing.xs
                : size === "xl"
                  ? theme.spacing.xl
                  : size === "icon"
                    ? theme.spacing.sm
                    : theme.spacing.sm,
        // Icon-only button dimensions
        ...(size === "icon" && {
          width: 40,
          height: 40,
          borderRadius: theme.borderRadius.full,
        }),
        // Full width
        ...(fullWidth && { width: "100%" }),
      },

      // Text styles
      text: {
        fontSize:
          size === "xs" ? 12 : size === "sm" ? 14 : size === "lg" ? 18 : size === "xl" ? 20 : 16,
        fontWeight: "600",
        textAlign: "center",
      },

      // Icon container
      leftIconContainer: {
        marginHorizontal: size === "icon" ? 0 : 4,
      },

      rightIconContainer: {
        marginHorizontal: size === "icon" ? 0 : 4,
      },

      // Loading indicator
      loadingContainer: {
        marginRight: children || title ? theme.spacing.xs : 0,
      },

      // Variant styles
      default: {
        backgroundColor: theme.colors.surface,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
      defaultText: {
        color: theme.colors.onSurface,
      },

      primary: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
      primaryText: {
        color: theme.colors.onPrimary,
      },

      destructive: {
        backgroundColor: theme.colors.error,
        shadowColor: theme.colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
      destructiveText: {
        color: theme.colors.onError,
      },

      outline: {
        backgroundColor: theme.colors.transparent,
        borderWidth: 1,
        borderColor: theme.colors.outline,
      },
      outlineText: {
        color: theme.colors.onSurface,
      },

      secondary: {
        backgroundColor: theme.colors.secondary,
        shadowColor: theme.colors.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
      secondaryText: {
        color: theme.colors.onSecondary,
      },

      ghost: {
        backgroundColor: theme.colors.transparent,
      },
      ghostText: {
        color: theme.colors.primary,
      },

      link: {
        backgroundColor: theme.colors.transparent,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
      linkText: {
        color: theme.colors.primary,
        textDecorationLine: "underline",
      },

      // Disabled state
      disabled: {
        backgroundColor: theme.colors.surfaceVariant,
        shadowOpacity: 0,
        elevation: 0,
        opacity: 0.6,
      },
      disabledText: {
        color: theme.colors.onSurfaceVariant,
      },
    });

    // Get variant-specific styles
    const getVariantStyles = (): ViewStyle => {
      if (isDisabled) return styles.disabled;

      switch (variant) {
        case "default":
          return styles.default;
        case "primary":
          return styles.primary;
        case "destructive":
          return styles.destructive;
        case "outline":
          return styles.outline;
        case "secondary":
          return styles.secondary;
        case "ghost":
          return styles.ghost;
        case "link":
          return styles.link;
        default:
          return styles.default;
      }
    };

    const getTextVariantStyles = (): TextStyle => {
      if (textColor) return { color: textColor };
      if (isDisabled) return styles.disabledText;

      switch (variant) {
        case "default":
          return styles.defaultText;
        case "primary":
          return styles.primaryText;
        case "destructive":
          return styles.destructiveText;
        case "outline":
          return styles.outlineText;
        case "secondary":
          return styles.secondaryText;
        case "ghost":
          return styles.ghostText;
        case "link":
          return styles.linkText;
        default:
          return styles.defaultText;
      }
    };

    // Determine icons to display
    const effectiveLeftIcon = icon?.position === "left" ? icon : leftIcon;
    const effectiveRightIcon = icon?.position === "right" ? icon : rightIcon;
    const effectiveIcon = size === "icon" ? icon || leftIcon || rightIcon : null;

    // Get icon size based on button size
    const getIconSize = (iconConfig?: ButtonIcon) => {
      if (iconConfig?.size) return iconConfig.size;
      return size === "sm" ? 16 : size === "lg" ? 24 : size === "icon" ? 20 : 20;
    };

    // Get icon color
    const getIconColor = (iconConfig?: ButtonIcon) => {
      if (iconConfig?.color) return iconConfig.color;
      if (isDisabled) return theme.colors.onSurfaceVariant;

      switch (variant) {
        case "default":
          return theme.colors.onPrimary;
        case "primary":
          return theme.colors.onPrimary;
        case "destructive":
          return theme.colors.onError;
        case "secondary":
          return theme.colors.onSecondary;
        case "outline":
          return theme.colors.onSurface;
        case "ghost":
        case "link":
          return theme.colors.primary;
        default:
          return theme.colors.onPrimary;
      }
    };

    const renderIcon = (iconConfig?: ButtonIcon, position?: "left" | "right") => {
      if (!iconConfig) return null;

      return (
        <View style={[position === "left" ? styles.leftIconContainer : styles.rightIconContainer]}>
          <Ionicons
            name={iconConfig.name}
            size={getIconSize(iconConfig)}
            color={getIconColor(iconConfig)}
          />
        </View>
      );
    };

    const renderContent = () => {
      // Icon-only button
      if (size === "icon") {
        return renderIcon(effectiveIcon as ButtonIcon);
      }

      return (
        <>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={getIconColor()} />
            </View>
          )}

          {!loading && renderIcon(effectiveLeftIcon, "left")}

          {(children || title) && (
            <Text style={[styles.text, getTextVariantStyles(), textStyle]}>
              {children || title}
            </Text>
          )}

          {!loading && renderIcon(effectiveRightIcon, "right")}
        </>
      );
    };

    return (
      <TouchableOpacity
        ref={ref}
        style={[styles.button, getVariantStyles(), backgroundColor && { backgroundColor }, style]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
        }}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";

export { Button };
