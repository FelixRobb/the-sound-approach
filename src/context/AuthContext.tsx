import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import type React from "react";
import { createContext, useReducer, useEffect, useContext } from "react";

import { supabase } from "../lib/supabase";
import type { AuthAction, AuthContextType, AuthState } from "../types";

import { DownloadContext } from "./DownloadContext";

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
  deleteAccount: async () => {},
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
  const { clearAllDownloads } = useContext(DownloadContext);

  // Effect to check for stored token on app start
  useEffect(() => {
    let authStateSubscription: { data: { subscription: { unsubscribe: () => void } } } | null =
      null;

    const bootstrapAsync = async () => {
      try {
        // Check if we're offline first
        const { isConnected } = await NetInfo.fetch();

        if (!isConnected) {
          // When offline, check for stored offline token
          const offlineToken = await AsyncStorage.getItem("offline_auth_token");
          const tokenExpiry = await AsyncStorage.getItem("offline_token_expiry");

          if (offlineToken && tokenExpiry) {
            const expiryDate = new Date(tokenExpiry);
            const now = new Date();

            if (now < expiryDate) {
              // Token is still valid, restore offline session
              const userData = await AsyncStorage.getItem("offline_user_data");
              const user = userData ? JSON.parse(userData) : null;

              dispatch({
                type: "RESTORE_TOKEN",
                token: offlineToken,
                user,
              });
              return;
            } else {
              // Token expired, clear offline data
              await AsyncStorage.multiRemove([
                "offline_auth_token",
                "offline_token_expiry",
                "offline_user_data",
              ]);
            }
          }

          // No valid offline token
          dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
          return;
        }

        // Original online logic continues here...
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        // Check for refresh token errors
        if (sessionError) {
          // If it's a refresh token error, clear the session and sign out
          if (
            sessionError.message.includes("refresh_token_not_found") ||
            sessionError.message.includes("Invalid Refresh Token") ||
            sessionError.message.includes("Refresh Token Not Found")
          ) {
            await supabase.auth.signOut({ scope: "local" }); // Only clear local storage
            dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
            return;
          }

          // Handle other session errors
          dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
          return;
        }

        if (sessionData?.session) {
          // Verify the session is still valid by making a simple request
          try {
            // Test the session by getting user info
            const { error: userError } = await supabase.auth.getUser();

            if (userError) {
              // Session is invalid, clear it
              await supabase.auth.signOut({ scope: "local" });
              dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
              return;
            }

            // Session is valid, restore the user state
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
          } catch (verificationError) {
            await supabase.auth.signOut({ scope: "local" });
            dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
            return;
          }
        } else {
          // No active session
          dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
        }

        // Subscribe to auth state changes
        authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "SIGNED_OUT") {
            // User signed out or was deleted
            dispatch({ type: "SIGN_OUT" });
          } else if (event === "TOKEN_REFRESHED" && session) {
            // Token was successfully refreshed
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
          } else if (event === "SIGNED_IN" && session) {
            // User signed in
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
          // Store offline authentication data
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months from now

          await AsyncStorage.setItem("offline_auth_token", data.session.access_token);
          await AsyncStorage.setItem("offline_token_expiry", expiryDate.toISOString());
          await AsyncStorage.setItem(
            "offline_user_data",
            JSON.stringify({
              id: data.user.id,
              email: data.user.email || "",
            })
          );

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
        // Clear offline authentication data
        await AsyncStorage.multiRemove([
          "offline_auth_token",
          "offline_token_expiry",
          "offline_user_data",
        ]);

        // Only try to sign out from Supabase if online
        const { isConnected } = await NetInfo.fetch();
        if (isConnected) {
          await supabase.auth.signOut();
        }

        await clearAllDownloads();
        dispatch({ type: "SIGN_OUT" });
      } catch (e) {
        console.error("Error signing out:", e);
        dispatch({ type: "SIGN_OUT" });
      }
    },
    deleteAccount: async () => {
      try {
        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          dispatch({ type: "AUTH_ERROR", error: "No active session found" });
          return;
        }

        // Get the Supabase URL from your config
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

        // Call the edge function to delete the user
        const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          dispatch({ type: "AUTH_ERROR", error: result.error || "Failed to delete account" });
          return;
        }

        // If successful, sign out the user locally AND clear downloads
        await clearAllDownloads();
        dispatch({ type: "SIGN_OUT" });
      } catch (e) {
        console.error("Error deleting account:", e);
        dispatch({
          type: "AUTH_ERROR",
          error: "An unexpected error occurred while deleting account",
        });
      }
    },
    clearError: () => {
      dispatch({ type: "AUTH_ERROR", error: null });
    },
  };

  return <AuthContext.Provider value={{ state, ...authActions }}>{children}</AuthContext.Provider>;
};
