import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

import { useThemedStyles } from "../hooks/useThemedStyles";

interface DownloadedBadgeProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  label?: string;
  compact?: boolean;
}

const DownloadedBadge: React.FC<DownloadedBadgeProps> = ({
  style,
  textStyle,
  iconSize = 14,
  label = "Downloaded",
  compact = false,
}) => {
  const { theme } = useThemedStyles();
  const styles = StyleSheet.create({
    badge: {
      alignItems: "center",
      backgroundColor: theme.colors.tertiary,
      borderRadius: 8,
      flexDirection: "row",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    compactBadge: {
      alignItems: "center",
      backgroundColor: theme.colors.tertiary,
      borderRadius: 6,
      height: 20,
      justifyContent: "center",
      width: 20,
    },
    text: {
      color: theme.colors.onTertiary,
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    },
  });

  if (compact) {
    return (
      <View style={[styles.compactBadge, style]}>
        <Ionicons name="cloud-done-outline" size={12} color={theme.colors.onTertiary} />
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
