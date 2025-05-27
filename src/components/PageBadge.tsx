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
}

const PageBadge: React.FC<PageBadgeProps> = ({
  page,
  style,
  textStyle,
  iconSize = 14,
  labelPrefix = "Page ",
}) => {
  const { theme } = useThemedStyles();
  const styles = StyleSheet.create({
    badge: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      flexDirection: "row",
      maxWidth: 140,
      minWidth: 0,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    text: {
      color: theme.colors.onSurfaceVariant,
      flexShrink: 1,
      fontSize: 12,
      fontWeight: "500",
      marginLeft: 4,
    },
  });
  return (
    <View style={[styles.badge, style]}>
      <Ionicons name="book-outline" size={iconSize} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.text, textStyle]}>
        {labelPrefix}
        {page}
      </Text>
    </View>
  );
};

export default PageBadge;
