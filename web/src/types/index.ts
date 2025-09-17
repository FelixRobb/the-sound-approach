import { Library, Search, User as UserIcon } from "lucide-react";

// Core data types (ported from mobile app)
// ==========================================
// Database Types
// ==========================================

export type Species = {
  id: string;
  common_name: string;
  scientific_name: string;
  created_at: string;
};

export type MediaType = "audio-hq" | "audio_lq" | "sonagram_video";

export type Recording = {
  id: string;
  catalogue_code: string;
  species_id: string;
  rec_number: number;
  site_name: string;
  audiohqid?: string;
  audiolqid?: string;
  sonagramvideoid?: string;
  caption: string;
  recorded_by: string;
  date_recorded: string;
  createdAt: string;
  species?: Species;
};

export type BookCode = {
  id: string;
  code: string;
  max_activations: number;
  activations_used: number;
  created_at: string;
};

export type UserActivation = {
  id: string;
  user_id: string;
  book_code_id: string;
  activated_at: string;
};

// ==========================================
// Authentication Types
// ==========================================

export type User = {
  id: string;
  email: string;
  /** Optional 8-character book access code that links the user to a physical copy of the book */
  bookCode?: string;
};

export type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  user: User | null;
  error: AuthError | null;
  hasCompletedOnboarding: boolean;
};

export type AuthAction =
  | {
      type: "RESTORE_TOKEN";
      token: string | null;
      user: User | null;
      hasCompletedOnboarding?: boolean;
    }
  | { type: "SIGN_IN"; token: string; user: User; hasCompletedOnboarding?: boolean }
  | { type: "SIGN_UP"; token: string; user: User }
  | { type: "SIGN_OUT" }
  | { type: "AUTH_ERROR"; error: AuthError | null }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "RESET_ONBOARDING" };

export type AuthContextType = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, bookCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  clearError: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

export type AuthError = {
  name: string;
  type: "SIGNIN" | "SIGNUP" | "SIGNOUT" | "DELETE_ACCOUNT";
  message: string;
};

// Audio types
export type AudioPlayerState = {
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string | null;
  error: string | null;
};

export type AudioState = {
  isPlaying: boolean;
  currentTrackId: string | null;
  position: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
};

export type AudioContextType = {
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string | null;
  currentTrackUri: string | null;
  currentTrackTitle: string | null;
  currentTime: number;
  duration: number;
  error: string | null;
  togglePlayPause: (uri: string, trackId: string, title?: string) => Promise<boolean>;
  seekTo: (time: number) => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;
  stop: () => void;
};

export type AudioAction =
  | { type: "PLAY"; trackId: string }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SET_POSITION"; position: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null };

// Search types
export type SearchFilter = "all" | "recordings" | "species";

export type SearchResults = {
  recordings: Recording[];
  species: Species[];
};

export type SortOption = "rec_number" | "speciescommon" | "speciesscientific";
export type SortSpeciesOption = "speciescommon" | "speciesscientific";

export type SortOrder = "asc" | "desc";
// Component prop types
export type SpeciesCardProps = {
  species: Species;
  onClick?: () => void;
};

export type RecordingCardProps = {
  recording: Recording;
  onClick?: () => void;
};

export type AudioPlayerPositionProps = {
  x: number;
  y: number;
};

export type MiniAudioPlayerProps = {
  recording: Recording;
  title?: string;
  size?: number;
};
// Navigation types
export type TabType = "recordings" | "search" | "profile";

export const navigationItems = [
  {
    id: "recordings" as TabType,
    title: "Library",
    icon: Library,
    description: "Browse recordings by book order or species",
  },
  {
    id: "search" as TabType,
    title: "Search",
    icon: Search,
    description: "Find specific recordings and species",
  },
  {
    id: "profile" as TabType,
    title: "Profile",
    icon: UserIcon,
    description: "Manage your account and settings",
  },
];

// Theme types
export type ThemeMode = "light" | "dark" | "system";

export type ThemeContextType = {
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
};
