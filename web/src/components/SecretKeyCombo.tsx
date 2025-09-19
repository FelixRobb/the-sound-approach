"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface SecretKeyComboProps {
  targetKeys?: string[];
  redirectPath?: string;
  onActivate?: () => void;
}

export default function SecretKeyCombo({
  targetKeys = ["t", "k", "s", "r"],
  redirectPath = "/admin/",
  onActivate,
}: SecretKeyComboProps) {
  const router = useRouter();
  const pressedKeys = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();
      // Only track our target keys
      if (key && targetKeys.includes(key)) {
        pressedKeys.current.add(key);
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Check if all target keys are pressed
        const allKeysPressed = targetKeys.every((targetKey) => pressedKeys.current.has(targetKey));
        if (allKeysPressed && pressedKeys.current.size === targetKeys.length) {
          // All keys are pressed simultaneously
          if (onActivate) {
            onActivate();
          } else {
            router.push(redirectPath);
          }
          // Clear the pressed keys
          pressedKeys.current.clear();
        }
        // Set a timeout to clear keys if they're not all pressed within a short window
        timeoutRef.current = setTimeout(() => {
          pressedKeys.current.clear();
        }, 1000); // 1 second window to press all keys
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();
      if (key && targetKeys.includes(key)) {
        pressedKeys.current.delete(key);
        // If no keys are pressed, clear the timeout
        if (pressedKeys.current.size === 0 && timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [targetKeys, redirectPath, router, onActivate]);

  // This component doesn't render anything visible
  return null;
}
