import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import type { ThemeColors } from "../lib/theme/types";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { RootStackParamList } from "../types";

interface DetailHeaderProps {
  title?: string;
  subtitle?: string;
  rightElement?: ReactNode;
  bgColor?: keyof ThemeColors;
  textColor?: keyof ThemeColors;
}

const DetailHeader = ({ title, subtitle, rightElement, bgColor, textColor }: DetailHeaderProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    backButton: {
      alignItems: "center",
      height: 40,
      justifyContent: "center",
      marginRight: theme.spacing.xs,
      width: 40,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      paddingBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      paddingTop: theme.spacing.sm + insets.top,
      zIndex: theme.zIndex.base,
    },
    subtitle: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: textColor || "onSurfaceVariant",
      }),
    },
    titleContainer: {
      flex: 1,
    },
  });

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: bgColor ? theme.colors[bgColor] : theme.colors.background },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={textColor ? theme.colors[textColor] : theme.colors.primary}
        />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text
          style={createThemedTextStyle(theme, {
            size: "4xl",
            weight: "bold",
            color: textColor || "secondary",
          })}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
    </View>
  );
};

export default DetailHeader;
