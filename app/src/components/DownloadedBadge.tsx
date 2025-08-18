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
  iconSize = 14,
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
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      minHeight: 20,
    },
    compactBadge: {
      alignItems: "center",
      backgroundColor: theme.colors.tertiary,
      borderRadius: smallRound ? 10 : 6,
      height: smallRound ? 16 : 20,
      justifyContent: "center",
      width: smallRound ? 16 : 20,
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
          size={smallRound ? 10 : 14}
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
