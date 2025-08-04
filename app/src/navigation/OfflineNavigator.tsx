import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import GlobalAudioBar from "../components/GlobalAudioBar";
import OfflineIndicator from "../components/OfflineIndicator";
import { useThemedStyles } from "../hooks/useThemedStyles";
import OfflineNoticeScreen from "../screens/OfflineNoticeScreen";
import OfflineScreen from "../screens/OfflineScreen";
import { OfflineStackParamList } from "../types";

// Higher-order component that wraps screens with GlobalAudioBar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withGlobalAudioBar = (WrappedComponent: React.ComponentType<any>) => {
  return (props: React.ComponentProps<typeof WrappedComponent>) => (
    <View style={styles.container}>
      <WrappedComponent {...props} />
      <GlobalAudioBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Stack navigator for offline mode
const OfflineStack = createNativeStackNavigator<OfflineStackParamList>();

// Offline mode navigator that only shows downloads and offline notice
const OfflineNavigator = () => {
  const { theme } = useThemedStyles();

  const backgroundStyle = StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
  });

  return (
    <View style={backgroundStyle.screen}>
      <OfflineStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: "fade",
          gestureEnabled: true,
          gestureDirection: "horizontal",
          presentation: "card",
          animationTypeForReplace: "push",
          navigationBarColor: theme.colors.background,
        }}
      >
        <OfflineStack.Screen name="OfflineMain" component={withGlobalAudioBar(OfflineScreen)} />
        <OfflineStack.Screen
          name="OfflineNotice"
          component={withGlobalAudioBar(OfflineNoticeScreen)}
          options={{
            presentation: "modal",
            gestureEnabled: true,
            animation: "slide_from_bottom",
            contentStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        />
      </OfflineStack.Navigator>
      <OfflineIndicator />
    </View>
  );
};

export default OfflineNavigator;
