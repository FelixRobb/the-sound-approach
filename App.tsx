import React, { useContext } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { DownloadProvider } from './src/context/DownloadContext';
import { AudioProvider } from './src/context/AudioContext';
import AppNavigator from './src/navigation/AppNavigator';
import { PaperProvider } from 'react-native-paper';
import { lightTheme, darkTheme } from './src/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
                  <AudioProvider>
                    <AppNavigator />
                  </AudioProvider>
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