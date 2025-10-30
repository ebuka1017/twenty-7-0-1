export interface Cipher {
  id: string;
  title: string;
  hint: string;
  solution: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  format: 'text' | 'image' | 'audio';
  content: string; // The actual cipher content
  contentUrl?: string | undefined; // For image/audio ciphers
  timeLimit: number; // in hours (3, 4, or 5)
  createdAt: number; // timestamp
  expiresAt: number; // timestamp
  isActive: boolean;
  sourceEvent?: string | undefined; // Real-world event that inspired this cipher
  breadcrumbData?: BreadcrumbMetadata | undefined;
}

export interface BreadcrumbMetadata {
  narrative_thread_id: string;
  connection_weight: number; // 0.1-1.0
  thematic_category: 'privacy' | 'auditing' | 'patents';
  cipher_source_event: string;
  unlock_threshold: number;
}

export interface Guess {
  id: string;
  cipherId: string;
  userId: string;
  username: string;
  content: string;
  rallyCount: number;
  createdAt: number;
  isWinner?: boolean;
}

export interface Rally {
  id: string;
  guessId: string;
  userId: string;
  createdAt: number;
}

export interface CipherDifficulty {
  name: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number; // hours
  color: string;
  complexity: number; // 1-5+ steps
}

export const DIFFICULTY_CONFIG: Record<string, CipherDifficulty> = {
  Easy: {
    name: 'Easy',
    timeLimit: 3,
    color: '#4ade80',
    complexity: 2
  },
  Medium: {
    name: 'Medium', 
    timeLimit: 4,
    color: '#f59e0b',
    complexity: 4
  },
  Hard: {
    name: 'Hard',
    timeLimit: 5,
    color: '#ef4444',
    complexity: 6
  }
};
