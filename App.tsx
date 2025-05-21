import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { DownloadProvider } from "./src/context/DownloadContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import { ThemeProvider, ThemeContext } from "./src/context/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreenComponent from "./src/screens/SplashScreen";
import { lightTheme, darkTheme } from "./src/theme";

// Keep the splash screen visible while we initialize resources
SplashScreen.preventAutoHideAsync();

// Create a client for React Query
const queryClient = new QueryClient();

// App content with theme context
const AppContent = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const paperTheme = isDarkMode ? darkTheme : lightTheme;
  const [appIsReady, setAppIsReady] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Prepare any app resources or fetch data here
        // For example: Load fonts, fetch initial data, etc.

        // Artificial delay for a better splash screen experience
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen once the app is ready
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <SplashScreenComponent />;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar style="auto" />
      <PaperProvider theme={paperTheme}>
        <QueryClientProvider client={queryClient}>
          <NetworkProvider>
            <AuthProvider>
              <DownloadProvider>
                <AppNavigator />
              </DownloadProvider>
            </AuthProvider>
          </NetworkProvider>
        </QueryClientProvider>
      </PaperProvider>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
