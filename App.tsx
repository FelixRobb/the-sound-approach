import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { DownloadProvider } from "./src/context/DownloadContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import { NewAudioProvider } from "./src/context/NewAudioContext";
import { ThemeProvider, ThemeContext } from "./src/context/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { lightTheme, darkTheme } from "./src/theme";

// Create a client for React Query
const queryClient = new QueryClient();

// App content with theme context
const AppContent = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const paperTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <PaperProvider theme={paperTheme}>
        <QueryClientProvider client={queryClient}>
          <NetworkProvider>
            <AuthProvider>
              <DownloadProvider>
                <NewAudioProvider>
                  <AppNavigator />
                </NewAudioProvider>
              </DownloadProvider>
            </AuthProvider>
          </NetworkProvider>
        </QueryClientProvider>
      </PaperProvider>
    </>
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
