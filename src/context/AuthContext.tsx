// src/context/AuthContext.tsx
"use client";

import * as SecureStore from "expo-secure-store";
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
  | { type: "AUTH_ERROR"; error: string };

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
    const bootstrapAsync = async () => {
      let userToken = null;
      let user = null;

      try {
        // Fetch the token from storage
        userToken = await SecureStore.getItemAsync("userToken");
        const userString = await SecureStore.getItemAsync("user");

        if (userString) {
          user = JSON.parse(userString);
        }

        // Validate the token with Supabase
        if (userToken) {
          const { error } = await supabase.auth.getUser(userToken);

          if (error) {
            // Token is invalid or expired
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("user");
            userToken = null;
            user = null;
          }
        }
      } catch (e) {
        console.error("Failed to restore authentication state:", e);
      }

      // After restoring token, update state
      dispatch({ type: "RESTORE_TOKEN", token: userToken, user });
    };

    bootstrapAsync();
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
          // Store the session
          await SecureStore.setItemAsync("userToken", data.session.access_token);
          await SecureStore.setItemAsync("user", JSON.stringify(data.user));

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
          // Store the session
          await SecureStore.setItemAsync("userToken", data.session.access_token);
          await SecureStore.setItemAsync("user", JSON.stringify(data.user));

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
        await SecureStore.deleteItemAsync("userToken");
        await SecureStore.deleteItemAsync("user");
        dispatch({ type: "SIGN_OUT" });
      } catch (e) {
        console.error("Error signing out:", e);
      }
    },
    clearError: () => {
      dispatch({ type: "AUTH_ERROR", error: "" });
    },
  };

  return <AuthContext.Provider value={{ state, ...authActions }}>{children}</AuthContext.Provider>;
};
