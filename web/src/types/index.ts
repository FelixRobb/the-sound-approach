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
};

// Authentication types
export type AuthState = {
  isLoading: boolean;
  user: User | null;
  error: string | null;
  hasCompletedOnboarding: boolean;
};

// Audio player types
export type AudioPlayerState = {
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string | null;
  error: string | null;
};

// Search types
export type SearchResults = {
  recordings: Recording[];
  species: Species[];
};

export type SearchFilter = "all" | "species" | "recordings";

// Theme types
export type ThemeMode = "light" | "dark" | "system";

// Page props types
export type RecordingPageProps = {
  params: { id: string };
};

export type SpeciesPageProps = {
  params: { id: string };
};

// Component prop types
export type MiniAudioPlayerProps = {
  trackId: string;
  audioUri: string;
  size?: number;
};

export type VideoPlayerProps = {
  videoUri: string;
  title?: string;
};

export type PageBadgeProps = {
  page: number | string;
  className?: string;
};

export type SpeciesCardProps = {
  species: Species;
  onClick?: () => void;
};

export type RecordingCardProps = {
  recording: Recording;
  onClick?: () => void;
};
