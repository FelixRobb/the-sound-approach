import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";

import { useEnhancedTheme } from "../../context/EnhancedThemeProvider";

// Card variant types
export type CardVariant = "default" | "outlined" | "filled" | "elevated";
export type CardSize = "sm" | "md" | "lg";

// Card header/footer configuration
export interface CardHeaderType {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;
  action?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export interface CardFooterType {
  content?: React.ReactNode;
  style?: ViewStyle;
}

// Main Card props interface
export interface CardProps extends TouchableOpacityProps {
  // Content
  children?: React.ReactNode;

  // Header and Footer
  header?: CardHeaderType;
  footer?: CardFooterType;

  // Styling
  variant?: CardVariant;
  size?: CardSize;

  // Layout
  padding?: number;
  margin?: number;

  // Interaction
  onPress?: () => void;
  disabled?: boolean;

  // Styling overrides
  style?: ViewStyle;
  contentStyle?: ViewStyle;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = "default",
  size = "md",
  padding,
  margin,
  onPress,
  disabled = false,
  style,
  contentStyle,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  const { theme, isDark } = useEnhancedTheme();

  // Determine if card is interactive
  const isInteractive = !!onPress && !disabled;

  // Create dynamic styles based on theme, variant, and state
  const styles = StyleSheet.create({
    card: {
      borderRadius:
        size === "sm"
          ? theme.borderRadius.sm
          : size === "lg"
            ? theme.borderRadius.lg
            : theme.borderRadius.md,
      margin:
        margin !== undefined
          ? margin
          : size === "sm"
            ? theme.spacing.xs
            : size === "lg"
              ? theme.spacing.md
              : theme.spacing.sm,
      overflow: "hidden",
    },

    content: {
      padding:
        padding !== undefined
          ? padding
          : size === "sm"
            ? theme.spacing.md
            : size === "lg"
              ? theme.spacing.xl
              : theme.spacing.lg,
    },

    default: {
      backgroundColor: theme.colors.surface,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
    },
    disabled: {
      opacity: 0.6,
    },
    elevated: {
      backgroundColor: theme.colors.surface,
      elevation: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
    },
    filled: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    footer: {
      borderTopColor: theme.colors.outline,
      borderTopWidth: 1,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    header: {
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    headerContent: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },

    headerIcon: {
      marginRight: theme.spacing.sm,
    },

    headerLeft: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
    },

    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: size === "sm" ? 12 : size === "lg" ? 16 : 14,
      lineHeight: size === "sm" ? 16 : size === "lg" ? 22 : 20,
    },

    headerTextContainer: {
      flex: 1,
    },

    headerTitle: {
      color: theme.colors.onSurface,
      fontSize: size === "sm" ? 16 : size === "lg" ? 20 : 18,
      fontWeight: "600",
      marginBottom: 2,
    },

    outlined: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderWidth: 1,
    },

    pressed: {
      opacity: 0.95,
      transform: [{ scale: 0.98 }],
    },
  });

  // Get variant-specific styles
  const getVariantStyles = () => {
    if (disabled) return [styles[variant], styles.disabled];
    return styles[variant];
  };

  // Render header if provided
  const renderHeader = () => {
    if (!header) return null;

    const {
      title,
      subtitle,
      icon,
      iconColor,
      iconSize,
      action,
      style: headerStyle,
      titleStyle,
      subtitleStyle,
    } = header;

    return (
      <View style={[styles.header, headerStyle]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {icon && (
              <View style={styles.headerIcon}>
                <Ionicons
                  name={icon}
                  size={iconSize || (size === "sm" ? 20 : size === "lg" ? 28 : 24)}
                  color={iconColor || theme.colors.primary}
                />
              </View>
            )}

            <View style={styles.headerTextContainer}>
              {title && <Text style={[styles.headerTitle, titleStyle]}>{title}</Text>}
              {subtitle && <Text style={[styles.headerSubtitle, subtitleStyle]}>{subtitle}</Text>}
            </View>
          </View>

          {action && <View>{action}</View>}
        </View>
      </View>
    );
  };

  // Render footer if provided
  const renderFooter = () => {
    if (!footer) return null;
    const styles = StyleSheet.create({
      footer: {
        borderTopColor: theme.colors.outline,
        borderTopWidth: 1,
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.sm,
      },
    });
    const { content, style: footerStyle } = footer;

    return <View style={[styles.footer, footerStyle]}>{content}</View>;
  };

  // Render card content
  const renderContent = () => (
    <View style={[styles.content, contentStyle]}>
      {renderHeader()}
      {children}
      {renderFooter()}
    </View>
  );

  // If card is interactive, wrap in TouchableOpacity
  if (isInteractive) {
    return (
      <TouchableOpacity
        style={[styles.card, getVariantStyles(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.95}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Static card
  return (
    <View
      style={[styles.card, getVariantStyles(), style]}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {renderContent()}
    </View>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => {
  const { theme } = useEnhancedTheme();

  const styles = StyleSheet.create({
    header: {
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
  });

  return <View style={[styles.header, style]}>{children}</View>;
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => {
  return <View style={style}>{children}</View>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => {
  const { theme } = useEnhancedTheme();

  const styles = StyleSheet.create({
    footer: {
      borderTopColor: theme.colors.outline,
      borderTopWidth: 1,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
  });

  return <View style={[styles.footer, style]}>{children}</View>;
};

export const CardTitle: React.FC<{
  children: React.ReactNode;
  style?: TextStyle;
  size?: CardSize;
}> = ({ children, style, size }) => {
  const { theme } = useEnhancedTheme();

  const styles = StyleSheet.create({
    headerTitle: {
      color: theme.colors.onSurface,
      fontSize: size === "sm" ? 16 : size === "lg" ? 20 : 18,
      fontWeight: "600",
      marginBottom: 2,
    },
  });

  return <Text style={[styles.headerTitle, style]}>{children}</Text>;
};

export const CardDescription: React.FC<{
  children: React.ReactNode;
  style?: TextStyle;
  size?: CardSize;
}> = ({ children, style, size }) => {
  const { theme } = useEnhancedTheme();

  const styles = StyleSheet.create({
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: size === "sm" ? 12 : size === "lg" ? 16 : 14,
      lineHeight: size === "sm" ? 16 : size === "lg" ? 22 : 20,
    },
  });

  return <Text style={[styles.headerSubtitle, style]}>{children}</Text>;
};
