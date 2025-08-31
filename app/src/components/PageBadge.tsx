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
  iconSize = 12,
  labelPrefix = "Page ",
  compact = false,
}) => {
  const { theme } = useEnhancedTheme();
  const styles = StyleSheet.create({
    badge: {
      alignItems: "center",
      backgroundColor: compact ? theme.colors.surfaceVariant : theme.colors.surfaceVariant,
      borderColor: theme.colors.outline,
      borderRadius: compact ? 4 : 6,
      borderWidth: 0.5,
      flexDirection: "row",
      paddingHorizontal: compact ? theme.spacing.xs : theme.spacing.sm,
      paddingVertical: compact ? 2 : theme.spacing.xxs,
    },
    text: {
      ...createThemedTextStyle(theme, {
        size: compact ? "xs" : "sm",
        weight: "medium",
        color: "onSurfaceVariant",
      }),
      marginLeft: theme.spacing.xs,
    },
  });
  return (
    <View style={[styles.badge, style]}>
      <Ionicons
        name="book-outline"
        size={compact ? 10 : iconSize}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={[styles.text, textStyle]}>
        {!compact && labelPrefix}
        {page}
      </Text>
    </View>
  );
};

export default PageBadge;
