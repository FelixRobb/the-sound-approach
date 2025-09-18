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
    console.log("SecretKeyCombo mounted");
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      console.log("Key pressed:", key);
      // Only track our target keys
      if (targetKeys.includes(key)) {
        pressedKeys.current.add(key);
        console.log("Pressed keys:", pressedKeys.current);
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Check if all target keys are pressed
        const allKeysPressed = targetKeys.every((targetKey) => pressedKeys.current.has(targetKey));
        console.log("All keys pressed:", allKeysPressed);
        if (allKeysPressed && pressedKeys.current.size === targetKeys.length) {
          // All keys are pressed simultaneously
          if (onActivate) {
            onActivate();
          } else {
            router.push(redirectPath);
          }
          console.log("All keys pressed and activated");
          // Clear the pressed keys
          pressedKeys.current.clear();
        }
        console.log("Cleared pressed keys");
        // Set a timeout to clear keys if they're not all pressed within a short window
        timeoutRef.current = setTimeout(() => {
          pressedKeys.current.clear();
        }, 1000); // 1 second window to press all keys
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      console.log("Key released:", key);
      if (targetKeys.includes(key)) {
        pressedKeys.current.delete(key);
        console.log("Pressed keys:", pressedKeys.current);
        // If no keys are pressed, clear the timeout
        if (pressedKeys.current.size === 0 && timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          console.log("Timeout cleared");
        }
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      console.log("SecretKeyCombo unmounted");
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        console.log("Timeout cleared");
      }
    };
  }, [targetKeys, redirectPath, router, onActivate]);

  // This component doesn't render anything visible
  return null;
}
