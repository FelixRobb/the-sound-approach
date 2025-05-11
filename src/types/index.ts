// src/types/index.ts

// ==========================================
// Database Types
// ==========================================

export type Species = {
  id: string;
  common_name: string;
  scientific_name: string;
  created_at: string;
};

export type MediaType = "audio-hq" | "audio_lq" | "sonogram_video";

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

export type UserDownload = {
  id: string;
  user_id: string;
  recording_id: string;
  downloaded_at: string;
};

// ==========================================
// Authentication Types
// ==========================================

export type User = {
  id: string;
  email: string;
};

export type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  user: User | null;
  error: string | null;
};

export type AuthAction =
  | { type: "RESTORE_TOKEN"; token: string | null; user: User | null }
  | { type: "SIGN_IN"; token: string; user: User }
  | { type: "SIGN_OUT" }
  | { type: "AUTH_ERROR"; error: string };

export type AuthContextType = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, bookCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

// ==========================================
// Download Types
// ==========================================

export type DownloadStatus = "idle" | "downloading" | "completed" | "error";

export type DownloadInfo = {
  recordingId: string;
  status: DownloadStatus;
  progress: number;
  error?: string;
};

export type DownloadRecord = {
  recording_id: string;
  audio_path: string;
  downloaded_at: number;
  title?: string;
  species_name?: string;
  scientific_name?: string;
  book_page_number?: number;
  caption?: string;
};

export type DownloadContextType = {
  downloads: Record<string, DownloadInfo>;
  downloadedRecordings: string[];
  totalStorageUsed: number;
  downloadRecording: (recording: Recording) => Promise<void>;
  deleteDownload: (recordingId: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  isDownloaded: (recordingId: string) => boolean;
  getDownloadPath: (fileId: string, isAudio: boolean) => string | null;
  getDownloadedRecordings: () => Promise<DownloadRecord[]>;
};

// ==========================================
// Audio Types
// ==========================================

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export type AudioState = {
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
  playbackSpeed: PlaybackSpeed;
  isLooping: boolean;
  currentAudioId: string | null;
};

export type AudioContextType = {
  audioState: AudioState;
  loadAudio: (uri: string, audioId: string) => Promise<boolean>;
  playAudio: () => Promise<boolean>;
  pauseAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekAudio: (position: number) => Promise<void>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<void>;
  toggleLooping: () => Promise<void>;
};

// ==========================================
// Video Types
// ==========================================

export type VideoPlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export type VideoPlayerState = {
  videoId: string | null;
  playbackState: VideoPlaybackState;
  position: number;
  duration: number;
  isFullscreen: boolean;
  error: string | null;
};

export type VideoContextType = {
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
  currentVideoId: string | null;
  isFullscreen: boolean;
  error: string | null;
  playVideo: (uri: string, videoId: string) => Promise<boolean>;
  togglePlayPause: (uri: string, videoId: string) => Promise<boolean>;
  stopPlayback: () => Promise<boolean>;
  seekTo: (position: number) => Promise<boolean>;
  toggleFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<boolean>;
};

// ==========================================
// Network Types
// ==========================================

export type NetworkContextType = {
  isConnected: boolean;
};

// ==========================================
// Theme Types
// ==========================================

export type ThemeMode = "light" | "dark" | "system";

export type ThemeContextType = {
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
};

// ==========================================
// Navigation Types
// ==========================================

export type RootStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Login: undefined;
  MainTabs: undefined;
  RecordingDetails: { recordingId: string };
  SpeciesDetails: { speciesId: string };
  Search: undefined;
  OfflineNotice: undefined;
  Profile: undefined;
  Downloads: undefined;
};

export type MainTabParamList = {
  Recordings: undefined;
  Downloads: undefined;
  Profile: undefined;
};

// ==========================================
// Component Props Types
// ==========================================

export type AudioPlayerProps = {
  audioUri: string | null;
  audioId: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
};

export type RecordingItemProps = {
  recording: Recording;
  onPress: () => void;
  onPlayPress: () => void;
  isPlaying: boolean;
  isDownloaded: boolean;
};

export type SpeciesItemProps = {
  species: Species;
  onPress: () => void;
};

export type DownloadItemProps = {
  download: DownloadRecord;
  onPress: () => void;
  onPlayPress: () => void;
  onDeletePress: () => void;
  isPlaying: boolean;
};

export type SonogramViewerProps = {
  uri: string | null;
  onPress: () => void;
};

export type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  autoSubmit?: boolean;
  onSubmit?: () => void;
};

// ==========================================
// Utility Types
// ==========================================

export type StorageInfo = {
  size: number;
  used: number;
  free: number;
};

export type SearchFilter = "all" | "species" | "recordings" | "pages";

export type SortOption = "book" | "name" | "recent";
