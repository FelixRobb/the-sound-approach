"use client";

import type React from "react";
import { createContext, useReducer, useEffect } from "react";

import { supabase } from "../lib/supabase";

// Define types
type User = {
  id: string;
  email: string;
};

type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  user: User | null;
  error: string | null;
};

type AuthAction =
  | { type: "RESTORE_TOKEN"; token: string | null; user: User | null }
  | { type: "SIGN_IN"; token: string; user: User }
  | { type: "SIGN_OUT" }
  | { type: "AUTH_ERROR"; error: string | null };

type AuthContextType = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, bookCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

// Initial state
const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  user: null,
  error: null,
};

// Create context
export const AuthContext = createContext<AuthContextType>({
  state: initialState,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  clearError: () => {},
});

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "RESTORE_TOKEN":
      return {
        ...state,
        userToken: action.token,
        user: action.user,
        isLoading: false,
      };
    case "SIGN_IN":
      return {
        ...state,
        isSignout: false,
        userToken: action.token,
        user: action.user,
        error: null,
      };
    case "SIGN_OUT":
      return {
        ...state,
        isSignout: true,
        userToken: null,
        user: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        error: action.error,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Effect to check for stored token on app start
  useEffect(() => {
    let authStateSubscription: { data: { subscription: { unsubscribe: () => void } } } | null =
      null;

    const bootstrapAsync = async () => {
      try {
        // Get the current session from Supabase
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session) {
          // Session exists, restore the user state
          dispatch({
            type: "RESTORE_TOKEN",
            token: sessionData.session.access_token,
            user: sessionData.session.user
              ? {
                  id: sessionData.session.user.id,
                  email: sessionData.session.user.email || "",
                }
              : null,
          });
        } else {
          // No active session
          dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
        }

        // Subscribe to auth state changes
        authStateSubscription = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_OUT") {
            // User signed out or was deleted
            dispatch({ type: "SIGN_OUT" });
          } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
            // User signed in or token was refreshed
            dispatch({
              type: "RESTORE_TOKEN",
              token: session.access_token,
              user: session.user
                ? {
                    id: session.user.id,
                    email: session.user.email || "",
                  }
                : null,
            });
          }
        });
      } catch (e) {
        console.error("Failed to restore authentication state:", e);
        dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
      }
    };

    bootstrapAsync();

    // Clean up subscription when unmounting
    return () => {
      if (authStateSubscription) {
        authStateSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Auth actions
  const authActions = {
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          dispatch({ type: "AUTH_ERROR", error: error.message });
          return;
        }

        if (data?.user && data?.session) {
          dispatch({
            type: "SIGN_IN",
            token: data.session.access_token,
            user: {
              id: data.user.id,
              email: data.user.email || "",
            },
          });
        }
      } catch (e) {
        dispatch({ type: "AUTH_ERROR", error: "An unexpected error occurred" });
      }
    },
    signUp: async (email: string, password: string, bookCode: string) => {
      try {
        // First validate the book code
        const { data: bookCodeData, error: bookCodeError } = await supabase
          .from("book_codes")
          .select("*")
          .eq("code", bookCode)
          .single();

        if (bookCodeError || !bookCodeData) {
          dispatch({ type: "AUTH_ERROR", error: "Invalid book code" });
          return;
        }

        if (bookCodeData.activations_used >= bookCodeData.max_activations) {
          dispatch({
            type: "AUTH_ERROR",
            error: "This book code has reached its maximum number of activations",
          });
          return;
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

        if (error) {
          dispatch({ type: "AUTH_ERROR", error: error.message });
          return;
        }

        if (data?.user && data?.session) {
          // Associate the user with the book code
          const { data: bookCodeData } = await supabase
            .from("book_codes")
            .select("id")
            .eq("code", bookCode)
            .single();

          if (bookCodeData) {
            // Create user activation record
            await supabase.from("user_activations").insert({
              user_id: data.user.id,
              book_code_id: bookCodeData.id,
            });

            // Increment the activations_used counter
            await supabase.rpc("increment_book_code_activation", {
              code_param: bookCode,
            });
          }

          dispatch({
            type: "SIGN_IN",
            token: data.session.access_token,
            user: {
              id: data.user.id,
              email: data.user.email || "",
            },
          });
        }
      } catch (e) {
        dispatch({ type: "AUTH_ERROR", error: "An unexpected error occurred" });
      }
    },
    signOut: async () => {
      try {
        await supabase.auth.signOut();
        dispatch({ type: "SIGN_OUT" });
      } catch (e) {
        console.error("Error signing out:", e);
      }
    },
    clearError: () => {
      dispatch({ type: "AUTH_ERROR", error: null });
    },
  };

  return <AuthContext.Provider value={{ state, ...authActions }}>{children}</AuthContext.Provider>;
};
