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

  // Password saver support
  textContentType?:
    | "none"
    | "URL"
    | "addressCity"
    | "addressCityAndState"
    | "addressState"
    | "countryName"
    | "creditCardNumber"
    | "emailAddress"
    | "familyName"
    | "fullStreetAddress"
    | "givenName"
    | "jobTitle"
    | "location"
    | "middleName"
    | "name"
    | "namePrefix"
    | "nameSuffix"
    | "nickname"
    | "organizationName"
    | "postalCode"
    | "streetAddressLine1"
    | "streetAddressLine2"
    | "sublocality"
    | "telephoneNumber"
    | "username"
    | "password"
    | "newPassword"
    | "oneTimeCode";
  passwordRules?: string;
  autoComplete?:
    | "additional-name"
    | "address-line1"
    | "address-line2"
    | "birthdate-day"
    | "birthdate-full"
    | "birthdate-month"
    | "birthdate-year"
    | "cc-csc"
    | "cc-exp"
    | "cc-exp-day"
    | "cc-exp-month"
    | "cc-exp-year"
    | "cc-number"
    | "country"
    | "current-password"
    | "email"
    | "family-name"
    | "given-name"
    | "honorific-prefix"
    | "honorific-suffix"
    | "name"
    | "new-password"
    | "off"
    | "one-time-code"
    | "postal-code"
    | "street-address"
    | "tel"
    | "username"
    | "cc-family-name"
    | "cc-given-name"
    | "cc-middle-name"
    | "cc-name"
    | "cc-type"
    | "nickname"
    | "organization"
    | "organization-title"
    | "url"
    | "gender"
    | "name-family"
    | "name-given"
    | "name-middle"
    | "name-middle-initial"
    | "name-prefix"
    | "name-suffix"
    | "password"
    | "password-new"
    | "postal-address"
    | "postal-address-country"
    | "postal-address-extended"
    | "postal-address-extended-postal-code"
    | "postal-address-locality"
    | "postal-address-region"
    | "sms-otp"
    | "tel-country-code"
    | "tel-device"
    | "tel-national"
    | "username-new";

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
      textContentType,
      passwordRules,
      autoComplete,
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

    // Password saver optimizations
    const getTextContentType = () => {
      if (textContentType) return textContentType;
      if (type === "email") return "emailAddress";
      if (isPassword) return "password";
      return "none";
    };

    const getAutoComplete = () => {
      if (autoComplete) return autoComplete;
      if (type === "email") return "email";
      if (isPassword) return "password";
      return "off";
    };

    const getPasswordRules = () => {
      if (passwordRules) return passwordRules;
      if (isPassword) return "minlength: 8; required: lower; required: upper; required: digit;";
      return undefined;
    };

    // Create dynamic styles based on theme and state
    const styles = StyleSheet.create({
      clearButton: {
        alignItems: "center",
        justifyContent: "center",
      },

      clearButtonContainer: {
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        right: theme.spacing.md,
        zIndex: theme.zIndex.base,
      },
      container: {
        marginBottom: theme.spacing.sm,
      },
      default: {
        backgroundColor: theme.colors.surface,
        borderColor: error
          ? theme.colors.error
          : isFocused
            ? theme.colors.primary
            : theme.colors.outline,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
      },
      disabled: {
        backgroundColor: theme.colors.surfaceVariant,
        opacity: 0.6,
      },
      errorIcon: {
        marginRight: theme.spacing.xs,
      },
      errorText: {
        alignItems: "center",
        color: theme.colors.error,
        flexDirection: "row",
        fontSize: theme.typography.bodySmall.fontSize,
        marginTop: theme.spacing.xs,
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
      helperText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: theme.typography.bodySmall.fontSize,
        marginTop: theme.spacing.xs,
      },
      input: {
        color: theme.colors.onSurface,
        flex: 1,
        fontSize:
          size === "sm"
            ? theme.typography.bodyLarge.fontSize
            : size === "lg"
              ? theme.typography.bodyLarge.fontSize
              : theme.typography.bodyLarge.fontSize,
        paddingHorizontal: theme.spacing.xs,
        paddingLeft: leftIcon ? 50 : theme.spacing.md,
        paddingRight: rightIcon || isPassword ? 40 : theme.spacing.md,
        paddingVertical:
          size === "sm"
            ? theme.spacing.sm
            : size === "lg"
              ? theme.spacing.lg
              : theme.spacing.md - 4,
      },
      inputContainer: {
        alignItems: "center",
        flexDirection: "row",
        position: "relative",
      },
      label: {
        color: theme.colors.onSurface,
        fontSize:
          size === "sm"
            ? theme.typography.bodyLarge.fontSize
            : size === "lg"
              ? theme.typography.bodyLarge.fontSize
              : theme.typography.bodyLarge.fontSize,
        fontWeight: "600",
        marginBottom: 4,
      },

      labelContainer: {
        flexDirection: "row",
        marginBottom: theme.spacing.xs,
      },
      leftIconContainer: {
        alignItems: "center",
        justifyContent: "center",
        left: theme.spacing.md,
        position: "absolute",
        zIndex: theme.zIndex.base,
      },
      outlined: {
        backgroundColor: theme.colors.transparent,
        borderColor: error
          ? theme.colors.error
          : isFocused
            ? theme.colors.primary
            : theme.colors.outline,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
      },
      required: {
        color: theme.colors.error,
        marginLeft: 2,
      },
      rightIconContainer: {
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        right: theme.spacing.md,
        zIndex: theme.zIndex.base,
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
            // Password saver support
            textContentType={getTextContentType()}
            passwordRules={getPasswordRules()}
            autoComplete={getAutoComplete()}
            // Keyboard optimization
            enablesReturnKeyAutomatically={true}
            blurOnSubmit={type !== "password"}
            // Accessibility
            accessibilityLabel={label || placeholder}
            accessibilityHint={error || helperText}
            accessibilityRole="text"
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
