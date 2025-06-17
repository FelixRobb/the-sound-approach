"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
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
            user: { id: session.user.id, email: session.user.email! },
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
          user: { id: session.user.id, email: session.user.email! },
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

  const checkOnboardingStatus = async (userId?: string): Promise<boolean> => {
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
      // Validate book code first
      const { data: bookCodeData, error: bookCodeError } = await supabase
        .from("book_codes")
        .select("*")
        .eq("code", bookCode)
        .single();

      if (bookCodeError || !bookCodeData) {
        throw new Error("Invalid book code");
      }

      if (bookCodeData.activations_used >= bookCodeData.max_activations) {
        throw new Error("Book code has reached maximum activations");
      }

      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Failed to create user");

      // Create user activation record
      const { error: activationError } = await supabase.from("user_activations").insert({
        user_id: data.user.id,
        book_code_id: bookCodeData.id,
      });

      if (activationError) throw activationError;

      // Update book code usage
      const { error: updateError } = await supabase
        .from("book_codes")
        .update({ activations_used: bookCodeData.activations_used + 1 })
        .eq("id", bookCodeData.id);

      if (updateError) throw updateError;
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

      // Note: We keep onboarding status even after sign out
      // so users don't have to see it again on the same browser
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

    try {
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
    } catch (error) {
      throw error;
    }
  };

  const deleteAccount = async (password: string) => {
    if (!state.user) throw new Error("No user logged in");

    try {
      // Verify password first
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: state.user.email,
        password,
      });

      if (verifyError) throw new Error("Password is incorrect");

      // Call delete user function (this would need to be implemented as a Supabase function)
      const { error } = await supabase.rpc("delete_user_account");

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      // Store onboarding completion in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_completed", "true");
      }

      setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const resetOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("onboarding_completed");
      setState((prev) => ({ ...prev, hasCompletedOnboarding: false }));
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
