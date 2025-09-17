"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import { AuthState, AuthContextType } from "@/types";
import { createClient } from "@/utils/supabase/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  user: null,
  error: null,
  hasCompletedOnboarding: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setState((prev) => ({
            ...prev,
            error: { name: "", type: "SIGNIN", message: error.message },
            isLoading: false,
            isSignout: false,
            userToken: null,
            user: null,
            hasCompletedOnboarding: false,
          }));
          return;
        }

        if (session?.user) {
          const hasCompleted = checkOnboardingStatus();
          setState((prev) => ({
            ...prev,
            user: { id: session.user.id, email: session.user.email ?? "" },
            hasCompletedOnboarding: hasCompleted,
            isLoading: false,
          }));
        } else {
          const hasCompleted = checkOnboardingStatus();
          setState((prev) => ({
            ...prev,
            hasCompletedOnboarding: hasCompleted,
            isLoading: false,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? { name: "", type: "SIGNIN", message: error.message }
              : { name: "", type: "SIGNIN", message: "An error occurred" },
          isSignout: false,
          userToken: null,
          user: null,
          hasCompletedOnboarding: false,
          isLoading: false,
        }));
      }
    };

    void getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const hasCompleted = checkOnboardingStatus();
        setState((prev) => ({
          ...prev,
          user: { id: session.user.id, email: session.user.email ?? "" },
          hasCompletedOnboarding: hasCompleted,
          error: null,
          isSignout: false,
          userToken: null,
          isLoading: false,
        }));
      } else if (event === "SIGNED_OUT") {
        const hasCompleted = checkOnboardingStatus();
        setState((prev) => ({
          ...prev,
          user: null,
          hasCompletedOnboarding: hasCompleted,
          isLoading: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const checkOnboardingStatus = (): boolean => {
    // For web, use localStorage to track onboarding completion
    if (typeof window === "undefined") return false;
    return localStorage.getItem("onboarding_completed") === "true";
  };

  // Sign in is now handled by server actions
  const signIn = () => {
    // This is kept for compatibility but should not be used
    // Use the server action in /app/login/actions.ts instead
    throw new Error("Use server-side login action instead");
  };

  // Sign up is now handled by server actions
  const signUp = () => {
    // This is kept for compatibility but should not be used
    // Use the server action in /app/login/actions.ts instead
    throw new Error("Use server-side signup action instead");
  };

  const signOut = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Clear local storage first
      localStorage.removeItem("onboarding_completed");

      // Use the server-side signout endpoint
      const response = await fetch("/auth/signout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Sign out failed");
      }

      // The server will redirect, but we can also update state
      setState((prev) => ({
        ...prev,
        user: null,
        hasCompletedOnboarding: false,
        isLoading: false,
        error: null,
      }));

      // Redirect to home
      window.location.href = "/";
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? { name: "", type: "SIGNOUT", message: error.message }
            : { name: "", type: "SIGNOUT", message: "Sign out failed" },
        isSignout: false,
        userToken: null,
        user: null,
        hasCompletedOnboarding: false,
        isLoading: false,
      }));
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!state.user) throw new Error("No user logged in");

    // First verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: state.user.email,
      password: currentPassword,
    });

    if (verifyError) throw new Error("Current password is incorrect");

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  const deleteAccount = async (password: string) => {
    if (!state.user) throw new Error("No user logged in");

    try {
      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("No active session found");
      }

      // Verify the password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email || "",
        password,
      });

      if (signInError) {
        throw new Error("Invalid password");
      }

      // Get the Supabase URL from environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      // Call the edge function to delete the user
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const result = (await response.json()) as { error: string | null };

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account");
      }

      // If successful, sign out the user locally
      await signOut();
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  const completeOnboarding = () => {
    // Store onboarding completion in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_completed", "true");
    }

    setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const resetOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("onboarding_completed");
      setState((prev) => ({ ...prev, hasCompletedOnboarding: false }));
      router.push("/onboarding");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        signIn,
        signUp,
        signOut,
        changePassword,
        deleteAccount,
        clearError,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
