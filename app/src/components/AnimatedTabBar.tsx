import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { MD3Theme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";

interface AnimatedTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: MD3Theme;
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
    activeTabText: {
      color: theme.colors.onTertiary,
      fontWeight: "600",
    },
    inactiveTabText: {
      color: theme.colors.onSurfaceVariant,
    },
    rowCenter: {
      alignItems: "center",
      flexDirection: "row",
    },
    slidingBackground: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: 18,
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
      paddingHorizontal: 16,
      paddingVertical: 8,
      zIndex: 1,
    },
    tabBar: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: "row",
      height: 46,
      marginHorizontal: 4,
      marginTop: 12,
      overflow: "hidden",
      paddingHorizontal: 6,
      position: "relative",
      width: "94%",
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 6,
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
              activeTab === "book" ? styles.activeTabText : styles.inactiveTabText,
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
              activeTab === "species" ? styles.activeTabText : styles.inactiveTabText,
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
