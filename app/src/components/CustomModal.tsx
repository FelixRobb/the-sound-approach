import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme/typography";

import { Button } from "./ui";

const { width } = Dimensions.get("window");

export type CustomModalButton = {
  text: string;
  onPress: () => void;
  style?: "default" | "destructive" | "cancel";
  loading?: boolean;
};

export type CustomModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons: CustomModalButton[];
  closeOnBackdrop?: boolean;
};

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor,
  buttons,
  closeOnBackdrop = true,
}) => {
  const { theme } = useEnhancedTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const styles = StyleSheet.create({
    button: {
      alignItems: "center",
      flex: 1,
    },
    buttonsContainer: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
    },
    iconContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.full,
      height: 40,
      justifyContent: "center",
      marginBottom: theme.spacing.xl,
      width: 40,
    },
    message: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 24,
      maxWidth: width * 0.9,
      padding: theme.spacing.xl,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      width: "100%",
    },
    overlay: {
      backgroundColor: theme.colors.backdrop,
      flex: 1,
    },
    title: {
      ...createThemedTextStyle(theme, {
        size: "2xl",
        weight: "normal",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
  });

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor={theme.colors.backdrop} />
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <View style={styles.container}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modal,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {icon && (
                  <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={28} color={iconColor || theme.colors.primary} />
                  </View>
                )}

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                <View style={styles.buttonsContainer}>
                  {buttons.map((button, index) => (
                    <Button
                      key={index}
                      variant={
                        button.style === "destructive"
                          ? "destructive"
                          : button.style === "cancel"
                            ? "outline"
                            : "default"
                      }
                      onPress={button.onPress}
                      disabled={button.loading}
                      activeOpacity={0.8}
                      size="md"
                      style={styles.button}
                    >
                      {button.text}
                    </Button>
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CustomModal;
