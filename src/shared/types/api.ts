import { Cipher, Guess } from './cipher.js';
import { UserProfile, UserStats } from './user.js';
import { Breadcrumb, NarrativeThread } from './breadcrumb.js';

// API Request/Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Legacy API types for existing server
export interface InitResponse {
  type: 'init';
  postId: string;
  count: number;
  username: string;
}

export interface IncrementResponse {
  type: 'increment';
  postId: string;
  count: number;
}

export interface DecrementResponse {
  type: 'decrement';
  postId: string;
  count: number;
}

export interface GetCiphersResponse {
  ciphers: Cipher[];
  total: number;
}

export interface GetCipherResponse {
  cipher: Cipher;
  guesses: Guess[];
  userGuess?: Guess;
  timeRemaining: number; // seconds
}

export interface SubmitGuessRequest {
  cipherId: string;
  content: string;
}

export interface SubmitGuessResponse {
  guess: Guess;
  isRateLimited?: boolean;
  rateLimitReset?: number;
}

export interface RallyGuessRequest {
  guessId: string;
}

export interface RallyGuessResponse {
  success: boolean;
  newRallyCount: number;
  isRateLimited?: boolean;
  rateLimitReset?: number;
}

export interface GetLeaderboardResponse {
  users: Array<UserProfile & UserStats>;
  currentUserRank?: number;
  totalUsers: number;
}

export interface GetUserProfileResponse {
  profile: UserProfile;
  stats: UserStats;
  recentBreadcrumbs: Breadcrumb[];
}

export interface GetBreadcrumbsResponse {
  breadcrumbs: Breadcrumb[];
  narrativeThreads: NarrativeThread[];
  globalProgress: {
    total: number;
    byCategory: Record<string, number>;
  };
}

// Rate limiting
export interface RateLimit {
  key: string;
  limit: number;
  window: number; // seconds
  current: number;
  resetTime: number;
}

export const RATE_LIMITS = {
  GUESS_SUBMISSION: { limit: 5, window: 60 }, // 5 guesses per minute
  RALLY_ACTION: { limit: 10, window: 60 }, // 10 rallies per minute
  PROFILE_UPDATE: { limit: 1, window: 3600 } // 1 profile update per hour
} as const;
