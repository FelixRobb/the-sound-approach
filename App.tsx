import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { DownloadProvider } from './src/context/DownloadContext';
import { AudioProvider } from './src/context/AudioContext';
import AppNavigator from './src/navigation/AppNavigator';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for React Query
const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <NetworkProvider>
              <AuthProvider>
                <DownloadProvider>
                  <AudioProvider>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </AudioProvider>
                </DownloadProvider>
              </AuthProvider>
            </NetworkProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}