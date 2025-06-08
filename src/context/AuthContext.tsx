// src/context/AuthContext.tsx
import NetInfo from "@react-native-community/netinfo";
import type React from "react";
import { createContext, useReducer, useEffect } from "react";

import {
  clearUserDownloads,
  clearOfflineAuthData,
  storeOfflineAuthData,
  getOfflineAuthData,
} from "../lib/storageUtils";
import { supabase } from "../lib/supabase";
import type { AuthAction, AuthContextType, AuthState } from "../types";

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

// Helper function to check if error is a refresh token error
const isRefreshTokenError = (error: any): boolean => {
  const message = error?.message || "";
  return (
    message.includes("refresh_token_not_found") ||
    message.includes("Invalid Refresh Token") ||
    message.includes("Refresh Token Not Found") ||
    message.includes("AuthApiError: Invalid Refresh Token")
  );
};

// Helper function to safely clear auth state
const clearAuthState = async () => {
  try {
    await clearOfflineAuthData();
    // Use 'local' scope to avoid server call if offline
    await supabase.auth.signOut({ scope: "local" });
  } catch (error) {
    console.warn("Error clearing auth state:", error);
    // Continue anyway - we still want to clear local state
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Effect to check for stored token on app start
  useEffect(() => {
    let authStateSubscription: { data: { subscription: { unsubscribe: () => void } } } | null =
      null;
    let isMounted = true;

    const bootstrapAsync = async () => {
      try {
        // First, clear any existing session to prevent automatic refresh attempts
        // This prevents the refresh token error on first load
        await supabase.auth.signOut({ scope: "local" });

        // Set up auth state listener FIRST to catch any auth events
        authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;

          console.log("Auth state change:", event);

          switch (event) {
            case "SIGNED_OUT":
              dispatch({ type: "SIGN_OUT" });
              break;

            case "TOKEN_REFRESHED":
              if (session) {
                // Store the refreshed token
                await storeOfflineAuthData(session.access_token, {
                  id: session.user.id,
                  email: session.user.email || "",
                });

                dispatch({
                  type: "RESTORE_TOKEN",
                  token: session.access_token,
                  user: {
                    id: session.user.id,
                    email: session.user.email || "",
                  },
                });
              }
              break;

            case "SIGNED_IN":
              if (session) {
                await storeOfflineAuthData(session.access_token, {
                  id: session.user.id,
                  email: session.user.email || "",
                });

                dispatch({
                  type: "RESTORE_TOKEN",
                  token: session.access_token,
                  user: {
                    id: session.user.id,
                    email: session.user.email || "",
                  },
                });
              }
              break;
          }
        });

        // Check network connectivity
        const { isConnected } = await NetInfo.fetch();

        if (!isConnected) {
          // Handle offline scenario
          const { token, user, isValid } = await getOfflineAuthData();

          if (isValid && token && user) {
            dispatch({
              type: "RESTORE_TOKEN",
              token,
              user,
            });
          } else {
            await clearOfflineAuthData();
            dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
          }
          return;
        }

        // Check for stored offline auth data
        const { token: hasStoredAuth } = await getOfflineAuthData();

        if (!hasStoredAuth) {
          // No stored auth - this is likely a fresh install
          dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
          return;
        }

        // Try to get current session
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            if (isRefreshTokenError(sessionError)) {
              console.log("Refresh token error detected, clearing auth state");
              await clearAuthState();
              dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
              return;
            }

            // Other session errors
            console.warn("Session error:", sessionError);
            dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
            return;
          }

          if (sessionData?.session) {
            // Verify session is still valid
            const { error: userError } = await supabase.auth.getUser();

            if (userError) {
              if (isRefreshTokenError(userError)) {
                console.log("User verification failed with refresh token error");
                await clearAuthState();
                dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
                return;
              }

              // Other user errors
              console.warn("User verification error:", userError);
              await clearAuthState();
              dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
              return;
            }

            // Session is valid
            await storeOfflineAuthData(sessionData.session.access_token, {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email || "",
            });

            dispatch({
              type: "RESTORE_TOKEN",
              token: sessionData.session.access_token,
              user: {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email || "",
              },
            });
          } else {
            // No active session
            await clearOfflineAuthData();
            dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
          }
        } catch (verificationError) {
          console.error("Verification error:", verificationError);

          if (isRefreshTokenError(verificationError)) {
            await clearAuthState();
          }

          dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
        }
      } catch (error) {
        console.error("Failed to restore authentication state:", error);

        // If it's a refresh token error, clear everything
        if (isRefreshTokenError(error)) {
          await clearAuthState();
        }

        dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
      }
    };

    bootstrapAsync();

    // Cleanup function
    return () => {
      isMounted = false;
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
          await storeOfflineAuthData(data.session.access_token, {
            id: data.user.id,
            email: data.user.email || "",
          });

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
        const { data: isAvailable, error: validationError } = await supabase.rpc(
          "is_book_code_available",
          { code_param: bookCode }
        );

        if (validationError) {
          dispatch({ type: "AUTH_ERROR", error: "Error validating book code" });
          return;
        }

        if (!isAvailable) {
          dispatch({
            type: "AUTH_ERROR",
            error: "Invalid book code or maximum activations reached",
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

          // Store offline authentication data
          await storeOfflineAuthData(data.session.access_token, {
            id: data.user.id,
            email: data.user.email || "",
          });

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
        await clearOfflineAuthData();

        // Clear user downloads
        await clearUserDownloads(state.user?.id || null);

        // Only try to sign out from Supabase if online
        const { isConnected } = await NetInfo.fetch();
        if (isConnected) {
          await supabase.auth.signOut();
        } else {
          // If offline, just sign out locally
          await supabase.auth.signOut({ scope: "local" });
        }

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

        // If successful, clear downloads and sign out the user locally
        await clearUserDownloads(state.user?.id || null);
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
