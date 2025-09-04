import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";

import type { Theme } from "../lib/theme/types";
import { createThemedTextStyle } from "../lib/theme/typography";

interface AnimatedTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: Theme;
  style?: ViewStyle;
}

const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  activeTab,
  onTabChange,
  theme,
  style,
}) => {
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const tabPosition = useSharedValue(0);

  // Animate tab position when activeTab changes
  useEffect(() => {
    tabPosition.value = withSpring(activeTab === "book" ? 0 : 1, {
      damping: 20,
      stiffness: 150,
      mass: 1,
    });
  }, [activeTab, tabPosition]);

  // Animated style for the sliding background
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            tabPosition.value,
            [0, 1],
            [0, (tabBarWidth - 8) / 2] // Move by half the container width minus the left/right margins
          ),
        },
      ],
    };
  });

  // Animated styles for tab content
  const bookTabStyle = useAnimatedStyle(() => {
    const progress = tabPosition.value; // 0 = book active, 1 = species active
    return {
      opacity: interpolate(progress, [0, 0.3, 0.7, 1], [1, 0.9, 0.8, 0.7]),
    };
  });

  const speciesTabStyle = useAnimatedStyle(() => {
    const progress = tabPosition.value; // 0 = book active, 1 = species active
    return {
      opacity: interpolate(progress, [0, 0.3, 0.7, 1], [0.7, 0.8, 0.9, 1]),
    };
  });

  const styles = StyleSheet.create({
    rowCenter: {
      alignItems: "center",
      flexDirection: "row",
    },
    slidingBackground: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.borderRadius.full,
      bottom: 4,
      elevation: 3,
      left: 4,
      position: "absolute",
      right: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      top: 4,
      width: "50%",
    },
    tab: {
      alignItems: "center",
      flexDirection: "row",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      zIndex: theme.zIndex.base,
    },
    tabBar: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      elevation: 3,
      flexDirection: "row",
      height: 46,
      marginTop: theme.spacing.sm,
      overflow: "hidden",
      paddingHorizontal: theme.spacing.xs,
      position: "relative",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
      width: "94%",
    },
    tabText: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginLeft: theme.spacing.sm,
    },
  });

  return (
    <View
      style={[styles.tabBar, style]}
      onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
    >
      {/* Animated sliding background */}
      <Animated.View style={[styles.slidingBackground, animatedBackgroundStyle]} />

      {/* Book Tab */}
      <TouchableOpacity style={styles.tab} onPress={() => onTabChange("book")} activeOpacity={0.7}>
        <Animated.View style={[styles.rowCenter, bookTabStyle]}>
          <Ionicons
            name="book-outline"
            size={18}
            color={activeTab === "book" ? theme.colors.onTertiary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "book"
                ? createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onTertiary",
                  })
                : createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onSurfaceVariant",
                  }),
            ]}
          >
            By Book Order
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Species Tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange("species")}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.rowCenter, speciesTabStyle]}>
          <Ionicons
            name="leaf-outline"
            size={18}
            color={
              activeTab === "species" ? theme.colors.onTertiary : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "species"
                ? createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onTertiary",
                  })
                : createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onSurfaceVariant",
                  }),
            ]}
          >
            By Species
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default AnimatedTabBar;
