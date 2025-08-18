import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { DownloadProvider } from "./src/context/DownloadContext";
import { EnhancedThemeProvider, useEnhancedTheme } from "./src/context/EnhancedThemeProvider";
import { NetworkProvider } from "./src/context/NetworkContext";
import AppNavigator from "./src/navigation/AppNavigator";
import "expo-dev-client";

// Create a client for React Query
const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync(); // Prevent native splash screen from hiding immediately

// App content with theme context
const AppContent = () => {
  const { isDark } = useEnhancedTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <AuthProvider>
            <DownloadProvider>
              <GestureHandlerRootView style={styles.container}>
                <AppNavigator />
              </GestureHandlerRootView>
            </DownloadProvider>
          </AuthProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <EnhancedThemeProvider>
        <AppContent />
      </EnhancedThemeProvider>
    </SafeAreaProvider>
  );
}
