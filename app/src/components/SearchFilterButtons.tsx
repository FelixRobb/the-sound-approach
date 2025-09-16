import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme/typography";
import { SearchFilter } from "../types";

interface SearchFilterButtonsProps {
  activeFilter: SearchFilter;
  onTabChange: (tab: SearchFilter) => void;
  style?: ViewStyle;
}

const SearchFilterButtons: React.FC<SearchFilterButtonsProps> = ({
  activeFilter,
  onTabChange,
  style,
}) => {
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const tabPosition = useSharedValue(0);
  const { theme } = useEnhancedTheme();

  // Animate tab position when activeTab changes
  useEffect(() => {
    const position = activeFilter === "all" ? 0 : activeFilter === "recordings" ? 1 : 2;
    tabPosition.value = withSpring(position, {
      damping: 20,
      stiffness: 150,
      mass: 1,
    });
  }, [activeFilter, tabPosition]);

  // Animated style for the sliding background
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            tabPosition.value,
            [0, 1, 2],
            [0, (tabBarWidth - 8) / 3, ((tabBarWidth - 8) * 2) / 3] // Move by third of container width for each tab
          ),
        },
      ],
    };
  });

  // Animated styles for tab content
  const allTabStyle = useAnimatedStyle(() => {
    const progress = tabPosition.value; // 0 = all active, 1 = recordings active, 2 = species active
    return {
      opacity: interpolate(progress, [0, 1, 2], [1, 0.7, 0.5]),
    };
  });

  const recordingsTabStyle = useAnimatedStyle(() => {
    const progress = tabPosition.value; // 0 = all active, 1 = recordings active, 2 = species active
    return {
      opacity: interpolate(progress, [0, 1, 2], [0.7, 1, 0.7]),
    };
  });

  const speciesTabStyle = useAnimatedStyle(() => {
    const progress = tabPosition.value; // 0 = all active, 1 = recordings active, 2 = species active
    return {
      opacity: interpolate(progress, [0, 1, 2], [0.5, 0.7, 1]),
    };
  });

  const styles = StyleSheet.create({
    rowCenter: {
      alignItems: "center",
      flexDirection: "row",
    },
    slidingBackground: {
      backgroundColor: theme.colors.primary,
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
      width: "33.33%",
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
      overflow: "hidden",
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      position: "relative",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
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

      {/* All Tab */}
      <TouchableOpacity style={styles.tab} onPress={() => onTabChange("all")} activeOpacity={0.7}>
        <Animated.View style={[styles.rowCenter, allTabStyle]}>
          <Ionicons
            name="grid-outline"
            size={18}
            color={activeFilter === "all" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              activeFilter === "all"
                ? createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  })
                : createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onSurfaceVariant",
                  }),
            ]}
          >
            All
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Recordings Tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange("recordings")}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.rowCenter, recordingsTabStyle]}>
          <Ionicons
            name="book-outline"
            size={18}
            color={
              activeFilter === "recordings" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              activeFilter === "recordings"
                ? createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  })
                : createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onSurfaceVariant",
                  }),
            ]}
          >
            Recordings
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
          <MaterialCommunityIcons
            name="bird"
            size={18}
            color={
              activeFilter === "species" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              activeFilter === "species"
                ? createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onPrimary",
                  })
                : createThemedTextStyle(theme, {
                    size: "base",
                    weight: "normal",
                    color: "onSurfaceVariant",
                  }),
            ]}
          >
            Species
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default SearchFilterButtons;
