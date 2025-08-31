import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme";

interface DownloadedBadgeProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  label?: string;
  compact?: boolean;
  smallRound?: boolean;
}

const DownloadedBadge: React.FC<DownloadedBadgeProps> = ({
  style,
  textStyle,
  iconSize = 12,
  label = "Downloaded",
  compact = false,
  smallRound = false,
}) => {
  const { theme } = useEnhancedTheme();
  const styles = StyleSheet.create({
    badge: {
      alignItems: "center",
      backgroundColor: theme.colors.tertiary,
      borderRadius: smallRound ? 10 : 6,
      flexDirection: "row",
      minHeight: 16,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xxs,
    },
    compactBadge: {
      alignItems: "center",
      backgroundColor: theme.colors.tertiary,
      borderColor: theme.colors.onTertiary,
      borderRadius: smallRound ? 10 : 6,
      borderWidth: 0.5,
      height: smallRound ? 18 : 20,
      justifyContent: "center",
      opacity: 0.9,
      width: smallRound ? 18 : 20,
    },
    text: {
      color: theme.colors.onTertiary,
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onTertiary",
      }),
      marginLeft: theme.spacing.xs,
    },
  });

  if (compact || smallRound) {
    return (
      <View style={[styles.compactBadge, style]}>
        <Ionicons
          name="cloud-done-outline"
          size={smallRound ? 11 : 12}
          color={theme.colors.onTertiary}
        />
      </View>
    );
  }

  return (
    <View style={[styles.badge, style]}>
      <Ionicons name="cloud-done-outline" size={iconSize} color={theme.colors.onTertiary} />
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
};

export default DownloadedBadge;
