import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import AudioService from "../lib/AudioService";

/**
 * Component that stops audio when a screen loses focus
 * Add this to any screen where you want to ensure audio stops when leaving
 */
const NavigationAudioStopper: React.FC = () => {
  const audioService = AudioService.getInstance();

  useFocusEffect(
    useCallback(() => {
      return () => {
        audioService.stop().catch((error) => {
          console.error("Error stopping audio on screen blur:", error);
        });
      };
    }, [audioService])
  );

  // This component renders nothing
  return null;
};

export default NavigationAudioStopper;
