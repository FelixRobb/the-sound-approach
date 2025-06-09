import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { DownloadProvider } from "./src/context/DownloadContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import { ThemeProvider, ThemeContext } from "./src/context/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { lightTheme, darkTheme } from "./src/theme";

// Create a client for React Query
const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync(); // Prevent native splash screen from hiding immediately

// App content with theme context
const AppContent = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const paperTheme = isDarkMode ? darkTheme : lightTheme;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <PaperProvider theme={paperTheme}>
        <QueryClientProvider client={queryClient}>
          <NetworkProvider>
            <AuthProvider>
              <DownloadProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <AppNavigator />
                </GestureHandlerRootView>
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
