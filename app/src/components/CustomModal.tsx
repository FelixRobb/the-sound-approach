import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";

import { useThemedStyles } from "../hooks/useThemedStyles";

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
  const { theme } = useThemedStyles();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim]);

  const styles = StyleSheet.create({
    button: {
      alignItems: "center",
      borderRadius: 12,
      flex: 1,
      justifyContent: "center",
      paddingVertical: 14,
    },
    buttonCancel: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderWidth: 1,
    },
    buttonDefault: {
      backgroundColor: theme.colors.primary,
    },
    buttonDestructive: {
      backgroundColor: theme.colors.error,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    buttonTextCancel: {
      color: theme.colors.onSurface,
    },
    buttonTextDefault: {
      color: theme.colors.onPrimary,
    },
    buttonTextDestructive: {
      color: theme.colors.onError,
    },
    buttonsContainer: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
    },
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    iconContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 30,
      height: 60,
      justifyContent: "center",
      marginBottom: 20,
      width: 60,
    },
    loadingIndicator: {
      marginRight: 8,
    },
    message: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 8,
      textAlign: "center",
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      elevation: 24,
      maxWidth: width * 0.9,
      padding: 24,
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
      color: theme.colors.onSurface,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 12,
      textAlign: "center",
    },
  });

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const getButtonStyle = (style: CustomModalButton["style"]) => {
    switch (style) {
      case "destructive":
        return styles.buttonDestructive;
      case "cancel":
        return styles.buttonCancel;
      default:
        return styles.buttonDefault;
    }
  };

  const getButtonTextStyle = (style: CustomModalButton["style"]) => {
    switch (style) {
      case "destructive":
        return styles.buttonTextDestructive;
      case "cancel":
        return styles.buttonTextCancel;
      default:
        return styles.buttonTextDefault;
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
                    transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
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
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        getButtonStyle(button.style),
                        button.loading && styles.buttonDisabled,
                      ]}
                      onPress={button.onPress}
                      disabled={button.loading}
                      activeOpacity={0.8}
                    >
                      {button.loading && (
                        <Animated.View
                          style={[
                            styles.loadingIndicator,
                            {
                              transform: [
                                {
                                  rotate: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ["0deg", "360deg"],
                                  }),
                                },
                              ],
                            },
                          ]}
                        >
                          <Ionicons
                            name="refresh"
                            size={16}
                            color={getButtonTextStyle(button.style).color}
                          />
                        </Animated.View>
                      )}
                      <Text style={[styles.buttonText, getButtonTextStyle(button.style)]}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
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
