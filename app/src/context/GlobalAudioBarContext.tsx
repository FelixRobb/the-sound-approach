import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

type GlobalAudioBarContextType = {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  hide: () => void;
  show: () => void;
};

const GlobalAudioBarContext = createContext<GlobalAudioBarContextType | undefined>(undefined);

export const GlobalAudioBarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);

  const setVisible = (visible: boolean) => {
    setIsVisible(visible);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const show = () => {
    setIsVisible(true);
  };

  const value = {
    isVisible,
    setVisible,
    hide,
    show,
  };

  return <GlobalAudioBarContext.Provider value={value}>{children}</GlobalAudioBarContext.Provider>;
};

export const useGlobalAudioBar = () => {
  const context = useContext(GlobalAudioBarContext);
  if (context === undefined) {
    throw new Error("useGlobalAudioBar must be used within a GlobalAudioBarProvider");
  }
  return context;
};

/**
 * Hook that automatically hides the GlobalAudioBar when the component mounts
 * and shows it again when the component unmounts.
 * Useful for fullscreen components, video players, etc.
 */
export const useHideGlobalAudioBar = () => {
  const { hide, show } = useGlobalAudioBar();

  useEffect(() => {
    hide();
    return () => {
      show();
    };
  }, [hide, show]);
};

export default GlobalAudioBarContext;
