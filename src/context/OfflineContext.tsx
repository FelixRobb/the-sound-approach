import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { createContext, useContext, useCallback } from "react";

import type { RootStackParamList } from "../types";

import { NetworkContext } from "./NetworkContext";

type OfflineContextType = {
  handleOfflineRedirect: () => void;
  canNavigateToRecordingDetails: (recordingId: string) => boolean;
  isScreenAllowedOffline: (screenName: keyof RootStackParamList) => boolean;
};

export const OfflineContext = createContext<OfflineContextType>({
  handleOfflineRedirect: () => {},
  canNavigateToRecordingDetails: () => true,
  isScreenAllowedOffline: () => true,
});

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useContext(NetworkContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Handle redirecting when going offline
  // This function is only used when in MainNavigator
  // The main app navigator will automatically switch to OfflineNavigator when offline
  const handleOfflineRedirect = useCallback(() => {
    if (!isConnected) {
      // Just redirect to Downloads directly when offline
      navigation.reset({
        index: 0,
        routes: [{ name: "Downloads" }],
      });
    }
  }, [isConnected, navigation]);

  // Check if a screen is allowed to be accessed while offline
  const isScreenAllowedOffline = (screenName: keyof RootStackParamList): boolean => {
    // When offline, only allow certain screens
    if (!isConnected) {
      const allowedScreens: (keyof RootStackParamList)[] = ["Downloads", "OfflineNotice"];
      return allowedScreens.includes(screenName);
    }
    return true;
  };

  // Check if navigation to RecordingDetails is allowed
  // This will be used to prevent navigation from Downloads to RecordingDetails when offline
  const canNavigateToRecordingDetails = (): boolean => {
    // When online, always allow navigation
    if (isConnected) {
      return true;
    }

    // When offline, don't allow navigation to recording details
    return false;
  };

  return (
    <OfflineContext.Provider
      value={{
        handleOfflineRedirect,
        canNavigateToRecordingDetails,
        isScreenAllowedOffline,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
