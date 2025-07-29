"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import { createClient } from "@/lib/supabase";
import { AuthState } from "@/types";

type AuthContextType = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, bookCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  clearError: () => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isLoading: true,
  user: null,
  error: null,
  hasCompletedOnboarding: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setState((prev) => ({ ...prev, error: error.message, isLoading: false }));
          return;
        }

        if (session?.user) {
          const hasCompleted = await checkOnboardingStatus();
          setState((prev) => ({
            ...prev,
            user: { id: session.user.id, email: session.user.email ?? "" },
            hasCompletedOnboarding: hasCompleted,
            isLoading: false,
          }));
        } else {
          const hasCompleted = await checkOnboardingStatus();
          setState((prev) => ({
            ...prev,
            hasCompletedOnboarding: hasCompleted,
            isLoading: false,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "An error occurred",
          isLoading: false,
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const hasCompleted = await checkOnboardingStatus();
        setState((prev) => ({
          ...prev,
          user: { id: session.user.id, email: session.user.email ?? "" },
          hasCompletedOnboarding: hasCompleted,
          error: null,
          isLoading: false,
        }));
      } else if (event === "SIGNED_OUT") {
        const hasCompleted = await checkOnboardingStatus();
        setState((prev) => ({
          ...prev,
          user: null,
          hasCompletedOnboarding: hasCompleted,
          isLoading: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const checkOnboardingStatus = async (): Promise<boolean> => {
    // For web, use localStorage to track onboarding completion
    if (typeof window === "undefined") return false;
    return localStorage.getItem("onboarding_completed") === "true";
  };

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sign in failed",
        isLoading: false,
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, bookCode: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // First validate the book code using RPC function like mobile app
      const { data: isAvailable, error: validationError } = (await supabase.rpc(
        "is_book_code_available",
        { code_param: bookCode }
      )) as { data: boolean; error: Error | null };

      if (validationError) {
        throw new Error("Error validating book code");
      }

      if (!isAvailable) {
        throw new Error("Invalid book code or maximum activations reached");
      }

      // Then sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            book_code: bookCode,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Failed to create user");

      if (data?.user && data?.session) {
        // Associate the user with the book code
        const { data: bookCodeData } = (await supabase
          .from("book_codes")
          .select("id")
          .eq("code", bookCode)
          .single()) as { data: { id: string } | null; error: Error | null };

        if (bookCodeData) {
          // Create user activation record
          const { error: activationError } = await supabase.from("user_activations").insert({
            user_id: data.user.id,
            book_code_id: bookCodeData.id,
          });

          if (activationError) throw activationError;

          // Increment the activations_used counter using RPC function
          const { error: incrementError } = await supabase.rpc("increment_book_code_activation", {
            code_param: bookCode,
          });

          if (incrementError) throw incrementError;
        }

        // Update state with user info including book code
        setState((prev) => ({
          ...prev,
          user: {
            id: data.user?.id ?? "",
            email: data.user?.email ?? "",
            bookCode,
          },
          isLoading: false,
        }));

        router.push("/onboarding");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sign up failed",
        isLoading: false,
      }));
      throw error;
    }
  };

  const signOut = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.removeItem("onboarding_completed");
      router.push("/");
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sign out failed",
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

  const completeOnboarding = async () => {
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
