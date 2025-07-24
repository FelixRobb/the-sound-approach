import { Library, Search, User as UserIcon } from "lucide-react";

// Core data types (ported from mobile app)
export type Species = {
  id: string;
  common_name: string;
  scientific_name: string;
  created_at: string;
};

export type Recording = {
  id: string;
  species_id: string;
  title: string;
  audiohqid: string;
  audiolqid: string;
  sonogramvideoid: string;
  book_page_number: number;
  caption: string;
  orderInBook: number;
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

export type User = {
  id: string;
  email: string;
  bookCode?: string;
};

// Authentication types
export type AuthState = {
  isLoading: boolean;
  user: User | null;
  error: string | null;
  hasCompletedOnboarding: boolean;
};

export type AuthAction =
  | { type: "LOADING" }
  | { type: "SIGN_IN"; user: User }
  | { type: "SIGN_UP"; user: User }
  | { type: "SIGN_OUT" }
  | { type: "ERROR"; error: string }
  | { type: "RESTORE_TOKEN"; user: User; hasCompletedOnboarding: boolean }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "RESET_ONBOARDING" };

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

export type AudioAction =
  | { type: "PLAY"; trackId: string }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SET_POSITION"; position: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null };

// Download types
export type DownloadState = {
  downloads: Record<string, DownloadItem>;
  isDownloading: boolean;
  error: string | null;
};

export type DownloadItem = {
  id: string;
  title: string;
  progress: number;
  status: "pending" | "downloading" | "completed" | "error";
  localUri?: string;
};

export type DownloadAction =
  | { type: "START_DOWNLOAD"; item: DownloadItem }
  | { type: "UPDATE_PROGRESS"; id: string; progress: number }
  | { type: "COMPLETE_DOWNLOAD"; id: string; localUri: string }
  | { type: "ERROR_DOWNLOAD"; id: string; error: string }
  | { type: "REMOVE_DOWNLOAD"; id: string };

// Search types
export type SearchFilter = "all" | "recordings" | "species";

// Component prop types
export type SpeciesCardProps = {
  species: Species;
  onClick?: () => void;
};

export type RecordingCardProps = {
  recording: Recording;
  onClick?: () => void;
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
