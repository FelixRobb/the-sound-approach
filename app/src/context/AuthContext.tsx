import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetch as NetFetch } from "@react-native-community/netinfo";
import type React from "react";
import { createContext, useReducer, useEffect, useContext } from "react";

import { useToast } from "../components/bna-toast";
import {
  clearUserDownloads,
  clearOfflineAuthData,
  storeOfflineAuthData,
  getOfflineAuthData,
  clearSearchHistory,
} from "../lib/storageUtils";
import { supabase } from "../lib/supabase";
import type { AuthAction, AuthContextType, AuthState, User } from "../types";

import { NetworkContext } from "./NetworkContext";

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
  resetOnboarding: () => {},
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
    case "RESET_ONBOARDING":
      return {
        ...state,
        hasCompletedOnboarding: false,
      };
    case "COMPLETE_ONBOARDING":
      return {
        ...state,
        hasCompletedOnboarding: true,
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

// Helper to retrieve the user’s book code from the user_activations table
const fetchUserBookCode = async (userId: string): Promise<string | undefined> => {
  try {
    const { data, error } = await supabase
      .from("user_activations")
      // Join to book_codes table and get the code field
      .select("book_codes(code)")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error) {
      console.warn("Error fetching book code:", error);
      return undefined;
    }

    const code = (data as { book_codes?: { code?: string } })?.book_codes?.code;
    return code ?? undefined;
  } catch (err) {
    console.error("Unexpected error fetching book code:", err);
    return undefined;
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { onNetworkRestore } = useContext(NetworkContext);
  const toast = useToast();

  // Helper function to show error toast
  const showErrorToast = (title: string, message: string) => {
    toast.dismissAll(); // Clear any existing toasts
    toast.error(title, message);
  };

  // Add network restore callback to refresh session when network is restored
  useEffect(() => {
    const unsubscribe = onNetworkRestore(() => {
      void (async () => {
        try {
          // Skip if no user is logged in
          if (!state.userToken || !state.user) return;

          // Refresh session when network is restored
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.warn("Failed to refresh session on network restore:", error);
            return;
          }

          if (data?.session) {
            // Check onboarding status
            const hasCompletedOnboarding = await checkOnboardingStatus(data.session.user.id);

            let restoredBookCode =
              (data.session.user.user_metadata?.book_code as string | undefined) ?? undefined;

            if (!restoredBookCode) {
              restoredBookCode = await fetchUserBookCode(data.session.user.id);
            }

            dispatch({
              type: "RESTORE_TOKEN",
              token: data.session.access_token,
              user: {
                id: data.session.user.id,
                email: data.session.user.email || "",
                bookCode: restoredBookCode,
              },
              hasCompletedOnboarding,
            });
          }
        } catch (error) {
          console.error("Error refreshing session on network restore:", error);
        }
      })();
    });

    return () => unsubscribe();
  }, [onNetworkRestore, state.userToken, state.user]);

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
                // Attempt to get book code from metadata; if missing, fetch from DB
                let refreshedBookCode =
                  (session.user.user_metadata?.book_code as string | undefined) ?? undefined;

                if (!refreshedBookCode) {
                  refreshedBookCode = await fetchUserBookCode(session.user.id);
                }

                // Store the refreshed token and book code
                await storeOfflineAuthData(session.access_token, {
                  id: session.user.id,
                  email: session.user.email || "",
                  bookCode: refreshedBookCode,
                });

                // Check onboarding status
                const hasCompletedOnboarding = await checkOnboardingStatus(session.user.id);

                dispatch({
                  type: "RESTORE_TOKEN",
                  token: session.access_token,
                  user: {
                    id: session.user.id,
                    email: session.user.email || "",
                    bookCode: refreshedBookCode,
                  },
                  hasCompletedOnboarding,
                });
              }
              break;

            case "SIGNED_IN":
              if (session) {
                let signedInBookCode =
                  (session.user.user_metadata?.book_code as string | undefined) ?? undefined;

                if (!signedInBookCode) {
                  signedInBookCode = await fetchUserBookCode(session.user.id);
                }

                await storeOfflineAuthData(session.access_token, {
                  id: session.user.id,
                  email: session.user.email || "",
                  bookCode: signedInBookCode,
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
                      bookCode: signedInBookCode,
                    },
                    hasCompletedOnboarding,
                  });
                }
              }
              break;
          }
        });

        // Check network connectivity
        const { isConnected } = await NetFetch();

        if (!isConnected) {
          // Handle offline scenario
          const { token, user, isValid } = (await getOfflineAuthData()) as {
            token: string | null;
            user: User | null;
            isValid: boolean;
          };

          if (isValid && token && user) {
            // Check onboarding status even in offline mode
            const hasCompletedOnboarding = await checkOnboardingStatus(user.id);

            dispatch({
              type: "RESTORE_TOKEN",
              token,
              user,
              hasCompletedOnboarding,
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

            const hasCompletedOnboarding = await checkOnboardingStatus(sessionData.session.user.id);

            dispatch({
              type: "RESTORE_TOKEN",
              token: sessionData.session.access_token,
              user: {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email || "",
              },
              hasCompletedOnboarding,
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
            const { token, user, isValid } = (await getOfflineAuthData()) as {
              token: string | null;
              user: User | null;
              isValid: boolean;
            };
            if (isValid && token && user) {
              const hasCompletedOnboarding = await checkOnboardingStatus(user.id);
              dispatch({
                type: "RESTORE_TOKEN",
                token,
                user,
                hasCompletedOnboarding,
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
                const { token, user, isValid } = (await getOfflineAuthData()) as {
                  token: string | null;
                  user: User | null;
                  isValid: boolean;
                };
                if (isValid && token && user) {
                  const hasCompletedOnboarding = await checkOnboardingStatus(user.id);
                  dispatch({
                    type: "RESTORE_TOKEN",
                    token,
                    user,
                    hasCompletedOnboarding,
                  });
                } else {
                  await clearAuthState();
                  dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
                }
                return;
              }

              // Session is valid, update stored data
              let restoredBookCode =
                (sessionData.session.user.user_metadata?.book_code as string | undefined) ??
                undefined;

              if (!restoredBookCode) {
                restoredBookCode = await fetchUserBookCode(sessionData.session.user.id);
              }

              await storeOfflineAuthData(sessionData.session.access_token, {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email || "",
                bookCode: restoredBookCode,
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
                  bookCode: restoredBookCode,
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
                const { token, user, isValid } = (await getOfflineAuthData()) as {
                  token: string | null;
                  user: User | null;
                  isValid: boolean;
                };
                if (isValid && token && user) {
                  const hasCompletedOnboarding = await checkOnboardingStatus(user.id);
                  dispatch({
                    type: "RESTORE_TOKEN",
                    token,
                    user,
                    hasCompletedOnboarding,
                  });
                } else {
                  await clearOfflineAuthData();
                  dispatch({ type: "RESTORE_TOKEN", token: null, user: null });
                }
              }
            }
          } else {
            // No active session, check offline data
            const { token, user, isValid } = (await getOfflineAuthData()) as {
              token: string | null;
              user: User | null;
              isValid: boolean;
            };
            if (isValid && token && user) {
              // Use offline data temporarily
              const hasCompletedOnboarding = await checkOnboardingStatus(user.id);
              dispatch({
                type: "RESTORE_TOKEN",
                token,
                user,
                hasCompletedOnboarding,
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
            const { token, user, isValid } = (await getOfflineAuthData()) as {
              token: string | null;
              user: User | null;
              isValid: boolean;
            };
            if (isValid && token && user) {
              const hasCompletedOnboarding = await checkOnboardingStatus(user.id);
              dispatch({
                type: "RESTORE_TOKEN",
                token,
                user,
                hasCompletedOnboarding,
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

    void bootstrapAsync();

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
          showErrorToast("Login Error", error.message || "Unknown error");
          return;
        }

        if (data?.user && data?.session) {
          // Try metadata first, then fall back to DB lookup
          let bookCode = (data.user.user_metadata?.book_code as string | undefined) ?? undefined;

          if (!bookCode) {
            bookCode = await fetchUserBookCode(data.user.id);
          }

          // Store offline authentication data including the book code
          await storeOfflineAuthData(data.session.access_token, {
            id: data.user.id,
            email: data.user.email || "",
            bookCode,
          });

          // Check onboarding status for existing users
          const hasCompletedOnboarding = await checkOnboardingStatus(data.user.id);

          dispatch({
            type: "SIGN_IN",
            token: data.session.access_token,
            user: {
              id: data.user.id,
              email: data.user.email || "",
              bookCode,
            },
            hasCompletedOnboarding,
          });
        }
      } catch (error) {
        showErrorToast("Login Error", "An unexpected error occurred");
      }
    },

    signUp: async (email: string, password: string, bookCode: string) => {
      try {
        // First validate the book code
        const { data: isAvailable, error: validationError } = (await supabase.rpc(
          "is_book_code_available",
          { code_param: bookCode }
        )) as { data: boolean; error: Error | null };

        if (validationError) {
          showErrorToast("Signup Error", "Error validating book code");
          return;
        }

        if (!isAvailable) {
          showErrorToast("Signup Error", "Invalid book code or maximum activations reached");
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
          showErrorToast("Signup Error", error.message);
          return;
        }

        if (data?.user && data?.session) {
          // Associate the user with the book code
          const { data: bookCodeData } = (await supabase
            .from("book_codes")
            .select("id")
            .eq("code", bookCode)
            .single()) as { data: { id: string } | null; error: Error | null };

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

          // Store offline authentication data including the new book code
          await storeOfflineAuthData(data.session.access_token, {
            id: data.user.id,
            email: data.user.email || "",
            bookCode,
          });

          dispatch({
            type: "SIGN_UP",
            token: data.session.access_token,
            user: {
              id: data.user.id,
              email: data.user.email || "",
              bookCode,
            },
          });
        }
      } catch (e) {
        showErrorToast("Signup Error", "An unexpected error occurred");
      }
    },

    signOut: async () => {
      try {
        // Clear offline authentication data
        await clearOfflineAuthData();

        // Clear user downloads
        await clearUserDownloads(state.user?.id || null);

        await clearSearchHistory();

        // Only try to sign out from Supabase if online
        const { isConnected } = await NetFetch();
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
          showErrorToast("Delete Account Error", "No active session found");
          return;
        }

        // Verify the password first
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: session.user.email || "",
          password,
        });

        if (signInError) {
          showErrorToast("Delete Account Error", "Invalid password");
          return;
        }

        // Get the Supabase URL from your config
        const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL as string) || "";

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
          showErrorToast("Delete Account Error", result.error || "Failed to delete account");
          return;
        }

        // If successful, clear downloads and sign out the user locally
        await clearUserDownloads(state.user?.id || null);
        dispatch({ type: "SIGN_OUT" });
      } catch (e) {
        console.error("Error deleting account:", e);
        showErrorToast(
          "Delete Account Error",
          "An unexpected error occurred while deleting account"
        );
      }
    },

    clearError: () => {
      dispatch({ type: "AUTH_ERROR", error: null });
    },

    resetOnboarding: () => {
      dispatch({ type: "RESET_ONBOARDING" });
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
