import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme";

interface PageBadgeProps {
  page: number | string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  labelPrefix?: string;
  compact?: boolean;
}

const PageBadge: React.FC<PageBadgeProps> = ({
  page,
  style,
  textStyle,
  iconSize = 14,
  labelPrefix = "Page ",
  compact = false,
}) => {
  const { theme } = useEnhancedTheme();
  const styles = StyleSheet.create({
    badge: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.sm,
      flexDirection: "row",
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      minHeight: 20,
    },
    text: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginLeft: theme.spacing.xs,
    },
  });
  return (
    <View style={[styles.badge, style]}>
      <Ionicons name="book-outline" size={iconSize} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.text, textStyle]}>
        {!compact && labelPrefix}
        {page}
      </Text>
    </View>
  );
};

export default PageBadge;
