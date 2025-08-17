import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useState } from "react";
import {
  TextInput as RNTextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from "react-native";

import { useEnhancedTheme } from "../../context/EnhancedThemeProvider";

// Input variant types
export type InputVariant = "default" | "filled" | "outlined";
export type InputSize = "sm" | "md" | "lg";

// Icon configuration
export interface InputIcon {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
}

// Main Input props interface
export interface InputProps extends Omit<TextInputProps, "style"> {
  // Layout and styling
  variant?: InputVariant;
  size?: InputSize;
  style?: ViewStyle;
  innerContainerStyle?: ViewStyle;
  className?: string;

  // Content and behavior
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;

  // Icons
  leftIcon?: InputIcon;
  rightIcon?: InputIcon;

  // Clear button
  clearButton?: boolean;
  // Password specific
  type?: "text" | "email" | "password" | "number";
  showPasswordToggle?: boolean;

  // Styling overrides
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperStyle?: TextStyle;

  // Callbacks
  onFocus?: () => void;
  onBlur?: () => void;
  onChangeText?: (text: string) => void;
}

const Input = forwardRef<RNTextInput, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      label,
      placeholder,
      helperText,
      error,
      disabled = false,
      required = false,
      leftIcon,
      rightIcon,
      type = "text",
      showPasswordToggle = false,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      helperStyle,
      onFocus,
      onBlur,
      onChangeText,
      value,
      style,
      clearButton = false,
      innerContainerStyle,
      ...props
    },
    ref
  ) => {
    const { theme } = useEnhancedTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Determine input type properties
    const isPassword = type === "password" || showPasswordToggle;
    const secureTextEntry = isPassword && !showPassword;
    const keyboardType =
      type === "email" ? "email-address" : type === "number" ? "numeric" : "default";
    const autoCapitalize = type === "email" ? "none" : "sentences";

    // Create dynamic styles based on theme and state
    const styles = StyleSheet.create({
      container: {
        marginBottom: theme.spacing.sm,
      },
      labelContainer: {
        flexDirection: "row",
        marginBottom: theme.spacing.xs,
      },
      label: {
        fontSize:
          size === "sm"
            ? theme.typography.bodyLarge.fontSize
            : size === "lg"
              ? theme.typography.bodyLarge.fontSize
              : theme.typography.bodyLarge.fontSize,
        fontWeight: "600",
        color: theme.colors.onSurface,
        marginBottom: 4,
      },
      required: {
        color: theme.colors.error,
        marginLeft: 2,
      },
      inputContainer: {
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
      },
      input: {
        flex: 1,
        fontSize:
          size === "sm"
            ? theme.typography.bodyLarge.fontSize
            : size === "lg"
              ? theme.typography.bodyLarge.fontSize
              : theme.typography.bodyLarge.fontSize,
        color: theme.colors.onSurface,
        paddingVertical:
          size === "sm" ? theme.spacing.sm : size === "lg" ? theme.spacing.lg : theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        // Add left padding if there's a left icon
        paddingLeft: leftIcon ? 40 : theme.spacing.md,
        // Add right padding if there's a right icon or password toggle
        paddingRight: rightIcon || isPassword ? 40 : theme.spacing.md,
      },
      leftIconContainer: {
        position: "absolute",
        left: theme.spacing.md,
        zIndex: 1,
        alignItems: "center",
        justifyContent: "center",
      },
      rightIconContainer: {
        position: "absolute",
        right: theme.spacing.md,
        zIndex: 1,
        alignItems: "center",
        justifyContent: "center",
      },
      clearButtonContainer: {
        position: "absolute",
        right: theme.spacing.md,
        zIndex: 1,
        alignItems: "center",
        justifyContent: "center",
      },
      helperText: {
        fontSize: theme.typography.bodySmall.fontSize,
        color: theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.xs,
      },
      errorText: {
        fontSize: theme.typography.bodySmall.fontSize,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
        flexDirection: "row",
        alignItems: "center",
      },
      errorIcon: {
        marginRight: theme.spacing.xs,
      },
      // Variants
      default: {
        borderWidth: 1,
        borderColor: error
          ? theme.colors.error
          : isFocused
            ? theme.colors.primary
            : theme.colors.outline,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
      },
      filled: {
        backgroundColor: error
          ? theme.colors.errorContainer
          : isFocused
            ? theme.colors.primaryContainer
            : theme.colors.surfaceVariant,
        borderRadius: theme.borderRadius.md,
        borderWidth: 0,
      },
      outlined: {
        borderWidth: 2,
        borderColor: error
          ? theme.colors.error
          : isFocused
            ? theme.colors.primary
            : theme.colors.outline,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.transparent,
      },
      disabled: {
        backgroundColor: theme.colors.surfaceVariant,
        opacity: 0.6,
      },
      clearButton: {
        alignItems: "center",
        justifyContent: "center",
      },
    });

    // Get variant-specific styles
    const getVariantStyles = () => {
      if (disabled) return styles.disabled;
      return styles[variant];
    };

    // Handle focus events
    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    // Handle password toggle
    const handlePasswordToggle = () => {
      setShowPassword(!showPassword);
    };

    // Determine right icon (password toggle takes precedence)
    const effectiveRightIcon = isPassword
      ? {
          name: (showPassword ? "eye-off" : "eye") as keyof typeof Ionicons.glyphMap,
          onPress: handlePasswordToggle,
          color: theme.colors.onSurfaceVariant,
        }
      : rightIcon;

    return (
      <View style={[styles.container, containerStyle, style]}>
        {/* Label */}
        {label && (
          <View style={styles.labelContainer}>
            <Text style={[styles.label, labelStyle]}>{label}</Text>
            {required && <Text style={styles.required}>*</Text>}
          </View>
        )}

        {/* Input Container */}
        <View style={[styles.inputContainer, getVariantStyles(), innerContainerStyle]}>
          {/* Left Icon */}
          {leftIcon && (
            <TouchableOpacity
              style={styles.leftIconContainer}
              onPress={leftIcon.onPress}
              disabled={!leftIcon.onPress}
            >
              <Ionicons
                name={leftIcon.name}
                size={leftIcon.size || 20}
                color={leftIcon.color || theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}

          {/* Text Input */}
          <RNTextInput
            ref={ref}
            style={[styles.input, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={type !== "email"}
            {...props}
          />

          {/* Right Icon */}
          {effectiveRightIcon && (
            <TouchableOpacity
              style={styles.rightIconContainer}
              onPress={effectiveRightIcon.onPress}
              disabled={!effectiveRightIcon.onPress}
            >
              <Ionicons
                name={effectiveRightIcon.name}
                size={effectiveRightIcon.size || 20}
                color={effectiveRightIcon.color || theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
          {/* Clear Button */}
          {clearButton && (
            <TouchableOpacity
              onPress={() => onChangeText?.("")}
              style={styles.clearButtonContainer}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorText}>
            <Ionicons
              name="alert-circle-outline"
              size={12}
              color={theme.colors.error}
              style={styles.errorIcon}
            />
            <Text style={[styles.errorText, errorStyle]}>{error}</Text>
          </View>
        )}

        {/* Helper Text */}
        {helperText && !error && <Text style={[styles.helperText, helperStyle]}>{helperText}</Text>}
      </View>
    );
  }
);

Input.displayName = "Input";

export { Input };
