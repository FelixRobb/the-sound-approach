import NetInfo from "@react-native-community/netinfo";
import type React from "react";
import { createContext, useState, useEffect, useCallback, useRef } from "react";

type NetworkContextType = {
  isConnected: boolean;
  onNetworkRestore: (callback: () => void) => () => void;
};

export const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  onNetworkRestore: () => () => {},
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected] = useState(false);
  const [previousConnectionState, setPreviousConnectionState] = useState(true);
  const [networkRestoreCallbacks, setNetworkRestoreCallbacks] = useState<(() => void)[]>([]);

  // Track if this is the first load of the app
  const isFirstLoad = useRef(true);

  // Use a timeout ref to debounce connectivity changes
  const connectivityTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add network restore callback
  const onNetworkRestore = useCallback((callback: () => void) => {
    setNetworkRestoreCallbacks((prev) => [...prev, callback]);

    // Return a function to unsubscribe
    return () => {
      setNetworkRestoreCallbacks((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  // Debounced setter for connection state to avoid rapid toggling
  const setConnectionState = useCallback((state: boolean) => {
    // Clear any pending timeout
    if (connectivityTimeout.current) {
      clearTimeout(connectivityTimeout.current);
    }

    // Set a debounce timeout (500ms) to avoid rapid toggling
    connectivityTimeout.current = setTimeout(() => {
      connectivityTimeout.current = null;
    }, 500);
  }, []);

  useEffect(() => {
    // If connection was just restored (was offline before but now online)
    if (isConnected && !previousConnectionState) {
      // Execute all registered callbacks
      networkRestoreCallbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error("Error executing network restore callback:", error);
        }
      });
    }

    // Update previous state for next comparison
    setPreviousConnectionState(isConnected);
  }, [isConnected, previousConnectionState, networkRestoreCallbacks]);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connectionStatus = state.isConnected !== null ? state.isConnected : true;

      // Skip state changes on first load to avoid interrupting initial navigation
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      // Use the debounced setter for other changes
      setConnectionState(connectionStatus);
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      const connectionStatus = state.isConnected !== null ? state.isConnected : true;
    });

    // Cleanup
    return () => {
      if (connectivityTimeout.current) {
        clearTimeout(connectivityTimeout.current);
      }
      unsubscribe();
    };
  }, [setConnectionState]);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        onNetworkRestore,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};
