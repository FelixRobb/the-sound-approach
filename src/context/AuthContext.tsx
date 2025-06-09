// src/context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  hasCompletedOnboarding: false,
};

// Create context
export const AuthContext = createContext<AuthContextType>({
  state: initialState,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
  clearError: () => {},
  completeOnboarding: async () => {},
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
        hasCompletedOnboarding: action.hasCompletedOnboarding ?? state.hasCompletedOnboarding,
      };
    case "SIGN_IN":
      return {
        ...state,
        isSignout: false,
        userToken: action.token,
        user: action.user,
        error: null,
        hasCompletedOnboarding: action.hasCompletedOnboarding ?? true, // Existing users have completed onboarding
      };
    case "SIGN_UP":
      return {
        ...state,
        isSignout: false,
        userToken: action.token,
        user: action.user,
        error: null,
        hasCompletedOnboarding: false, // New users need to complete onboarding
      };
    case "SIGN_OUT":
      return {
        ...state,
        isSignout: true,
        userToken: null,
        user: null,
        hasCompletedOnboarding: false,
      };
    case "COMPLETE_ONBOARDING":
      return {
        ...state,
        hasCompletedOnboarding: true,
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
const isRefreshTokenError = (error: unknown): boolean => {
  const message =
    typeof error === "object" && error !== null && "message" in error ? String(error.message) : "";
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

// Helper function to check onboarding completion status
const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    const onboardingStatus = await AsyncStorage.getItem(`onboarding_completed_${userId}`);
    return onboardingStatus === "true";
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return true; // Default to completed for existing users
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
        // Set up auth state listener FIRST to catch any auth events
        authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;

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

                // Check onboarding status
                const hasCompletedOnboarding = await checkOnboardingStatus(session.user.id);

                dispatch({
                  type: "RESTORE_TOKEN",
                  token: session.access_token,
                  user: {
                    id: session.user.id,
                    email: session.user.email || "",
                  },
                  hasCompletedOnboarding,
                });
              }
              break;

            case "SIGNED_IN":
              if (session) {
                await storeOfflineAuthData(session.access_token, {
                  id: session.user.id,
                  email: session.user.email || "",
                });

                // Only check onboarding status if we don't already have a user token
                // This prevents overriding the onboarding status for new signups
                if (!state.userToken) {
                  const hasCompletedOnboarding = await checkOnboardingStatus(session.user.id);

                  dispatch({
                    type: "RESTORE_TOKEN",
                    token: session.access_token,
                    user: {
                      id: session.user.id,
                      email: session.user.email || "",
                    },
                    hasCompletedOnboarding,
                  });
                }
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

        // Check for stored offline auth data first
        const { token: hasStoredAuth } = await getOfflineAuthData();

        if (!hasStoredAuth) {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

          if (!sessionError && sessionData?.session) {
            // Valid session found, store it
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
            return;
          }

          dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
          return;
        }

        // We have stored auth data, try to restore session
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

          // Handle refresh token errors specifically
          if (sessionError && isRefreshTokenError(sessionError as Error)) {
            await clearAuthState();
            dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
            return;
          }

          if (sessionError) {
            // Other session errors - log but try to continue with offline data
            console.warn("Session error:", sessionError);

            // Fall back to offline data if available and valid
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

          if (sessionData?.session) {
            // Session exists, verify it's still valid
            try {
              const { error: userError } = await supabase.auth.getUser();

              if (userError && isRefreshTokenError(userError as Error)) {
                await clearAuthState();
                dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
                return;
              }

              if (userError) {
                // Other user errors - try offline fallback
                console.warn("User verification error:", userError);
                const { token, user, isValid } = await getOfflineAuthData();
                if (isValid && token && user) {
                  dispatch({
                    type: "RESTORE_TOKEN",
                    token,
                    user,
                  });
                } else {
                  await clearAuthState();
                  dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
                }
                return;
              }

              // Session is valid, update stored data
              await storeOfflineAuthData(sessionData.session.access_token, {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email || "",
              });

              // Check onboarding status for existing users
              const hasCompletedOnboarding = await checkOnboardingStatus(
                sessionData.session.user.id
              );

              dispatch({
                type: "RESTORE_TOKEN",
                token: sessionData.session.access_token,
                user: {
                  id: sessionData.session.user.id,
                  email: sessionData.session.user.email || "",
                },
                hasCompletedOnboarding,
              });
            } catch (verificationError) {
              console.error("Session verification error:", verificationError);

              if (isRefreshTokenError(verificationError)) {
                await clearAuthState();
                dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
              } else {
                // Try offline fallback for other errors
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
              }
            }
          } else {
            // No active session, check offline data
            const { token, user, isValid } = await getOfflineAuthData();
            if (isValid && token && user) {
              // Use offline data temporarily
              dispatch({
                type: "RESTORE_TOKEN",
                token,
                user,
              });
            } else {
              await clearOfflineAuthData();
              dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
            }
          }
        } catch (error) {
          console.error("Bootstrap error:", error);

          // If it's a refresh token error, clear everything
          if (isRefreshTokenError(error)) {
            await clearAuthState();
            dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
          } else {
            // For other errors, try offline fallback
            const { token, user, isValid } = await getOfflineAuthData();
            if (isValid && token && user) {
              dispatch({
                type: "RESTORE_TOKEN",
                token,
                user,
              });
            } else {
              dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
            }
          }
        }
      } catch (error) {
        console.error("Failed to restore authentication state:", error);
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
  }, [state.userToken]);

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

          // Check onboarding status for existing users
          const hasCompletedOnboarding = await checkOnboardingStatus(data.user.id);

          dispatch({
            type: "SIGN_IN",
            token: data.session.access_token,
            user: {
              id: data.user.id,
              email: data.user.email || "",
            },
            hasCompletedOnboarding,
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
            type: "SIGN_UP",
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

    deleteAccount: async (password: string) => {
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

        // Verify the password first
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: session.user.email || "",
          password,
        });

        if (signInError) {
          dispatch({ type: "AUTH_ERROR", error: "Invalid password" });
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

    completeOnboarding: async () => {
      try {
        // Store onboarding completion status
        const userId = state.user?.id;
        if (userId) {
          await AsyncStorage.setItem(`onboarding_completed_${userId}`, "true");
        }
        dispatch({ type: "COMPLETE_ONBOARDING" });
      } catch (error) {
        console.error("Error completing onboarding:", error);
      }
    },
  };

  return <AuthContext.Provider value={{ state, ...authActions }}>{children}</AuthContext.Provider>;
};
