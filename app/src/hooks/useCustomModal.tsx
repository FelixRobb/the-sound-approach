import { useState } from "react";

import type { CustomModalButton } from "../components/CustomModal";

export type UseCustomModalOptions = {
  title: string;
  message: string;
  icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  iconColor?: string;
  buttons: CustomModalButton[];
  closeOnBackdrop?: boolean;
};

export const useCustomModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [modalOptions, setModalOptions] = useState<UseCustomModalOptions | null>(null);

  const showModal = (options: UseCustomModalOptions) => {
    setModalOptions(options);
    setIsVisible(true);
  };

  const hideModal = () => {
    setIsVisible(false);
    // Clear options after animation completes
    setTimeout(() => {
      setModalOptions(null);
    }, 300);
  };

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      confirmStyle?: "default" | "destructive";
      icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
      iconColor?: string;
    }
  ) => {
    showModal({
      title,
      message,
      icon: options?.icon,
      iconColor: options?.iconColor,
      buttons: [
        {
          text: options?.cancelText || "Cancel",
          onPress: hideModal,
          style: "cancel",
        },
        {
          text: options?.confirmText || "Confirm",
          onPress: async () => {
            await onConfirm();
            hideModal();
          },
          style: options?.confirmStyle || "default",
        },
      ],
    });
  };

  const showDestructiveModal = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
      iconColor?: string;
    }
  ) => {
    showConfirmModal(title, message, onConfirm, {
      ...options,
      confirmStyle: "destructive",
    });
  };

  return {
    isVisible,
    modalOptions,
    showModal,
    hideModal,
    showConfirmModal,
    showDestructiveModal,
  };
};
