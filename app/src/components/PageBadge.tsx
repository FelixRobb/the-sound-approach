import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

import { useThemedStyles } from "../hooks/useThemedStyles";

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
  const { theme } = useThemedStyles();
  const styles = StyleSheet.create({
    badge: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 6,
      flexDirection: "row",
      paddingHorizontal: 6,
      paddingVertical: 2,
      minHeight: 20,
    },
    text: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      fontWeight: "600",
      marginLeft: 3,
      lineHeight: 13,
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
