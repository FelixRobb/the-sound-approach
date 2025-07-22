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

interface MediaTabSwitcherProps {
  activeTab: "video" | "audio";
  onTabChange: (tab: "video" | "audio") => void;
  theme: MD3Theme;
  style?: ViewStyle;
}

const MediaTabSwitcher: React.FC<MediaTabSwitcherProps> = ({
  activeTab,
  onTabChange,
  theme,
  style,
}) => {
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const tabPosition = useSharedValue(activeTab === "video" ? 0 : 1);

  // Animate pill position whenever the active tab changes
  useEffect(() => {
    tabPosition.value = withSpring(activeTab === "video" ? 0 : 1, {
      damping: 20,
      stiffness: 150,
      mass: 1,
    });
  }, [activeTab, tabPosition]);

  // Sliding background (pill) animation
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            tabPosition.value,
            [0, 1],
            [0, (tabBarWidth - 8) / 2] // shift by half width minus margins
          ),
        },
      ],
    };
  });

  // Opacity animation for Video tab content
  const videoTabStyle = useAnimatedStyle(() => {
    const progress = tabPosition.value; // 0 = video, 1 = audio
    return {
      opacity: interpolate(progress, [0, 0.3, 0.7, 1], [1, 0.9, 0.8, 0.7]),
    };
  });

  // Opacity animation for Audio tab content
  const audioTabStyle = useAnimatedStyle(() => {
    const progress = tabPosition.value; // 0 = video, 1 = audio
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
      flexDirection: "row",
      alignItems: "center",
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
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 8,
      zIndex: 1,
    },
    tabBar: {
      alignSelf: "center",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
      borderRadius: 24,
      flexDirection: "row",
      height: 46,
      marginTop: 12,
      marginBottom: 12,
      overflow: "hidden",
      position: "relative",
      width: "94%",
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
      {/* Sliding pill background */}
      <Animated.View style={[styles.slidingBackground, animatedBackgroundStyle]} />

      {/* Video Tab */}
      <TouchableOpacity style={styles.tab} onPress={() => onTabChange("video")} activeOpacity={0.7}>
        <Animated.View style={[styles.rowCenter, videoTabStyle]}>
          <Ionicons
            name="videocam-outline"
            size={18}
            color={activeTab === "video" ? theme.colors.onTertiary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "video" ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            Video
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Audio Tab */}
      <TouchableOpacity style={styles.tab} onPress={() => onTabChange("audio")} activeOpacity={0.7}>
        <Animated.View style={[styles.rowCenter, audioTabStyle]}>
          <Ionicons
            name="musical-notes-outline"
            size={18}
            color={activeTab === "audio" ? theme.colors.onTertiary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "audio" ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            Audio
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default MediaTabSwitcher;
