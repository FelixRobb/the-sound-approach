import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import { withGlobalAudioBar } from "../components/GlobalAudioBar";
import OfflineIndicator from "../components/OfflineIndicator";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import OfflineScreen from "../screens/offline/OfflineScreen";
import { OfflineStackParamList } from "../types";

// Stack navigator for offline mode
const OfflineStack = createNativeStackNavigator<OfflineStackParamList>();

// Offline mode navigator that only shows downloads and offline notice
const OfflineNavigator = () => {
  const { theme } = useEnhancedTheme();

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
      </OfflineStack.Navigator>
      <OfflineIndicator />
    </View>
  );
};

export default OfflineNavigator;
