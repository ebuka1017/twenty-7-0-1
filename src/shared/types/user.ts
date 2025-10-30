export interface UserProfile {
  user_id: string;
  username: string;
  solves_count: number;
  successful_rallies: number;
  total_rallies: number;
  breadcrumbs_collected: string[]; // breadcrumb IDs
  titles: UserTitle[];
  avg_solve_time_seconds: number;
  difficulty_breakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  rally_accuracy_percentage: number;
  join_timestamp: number;
  last_active: number;
}

export interface UserTitle {
  name: string;
  earned_at: number;
  requirements_met: string[];
}

export interface UserStats {
  total_score: number;
  rank: number;
  speed_bonus: number;
  rally_bonus: number;
}

export const USER_TITLES = {
  APPRENTICE: {
    name: 'Apprentice',
    requirements: { solves: 1, rally_accuracy: 0 }
  },
  LOCKSMITH: {
    name: 'Locksmith', 
    requirements: { solves: 5, rally_accuracy: 30 }
  },
  MASTER_LOCKSMITH: {
    name: 'Master Locksmith',
    requirements: { solves: 10, rally_accuracy: 50 }
  },
  CIPHER_SAGE: {
    name: 'Cipher Sage',
    requirements: { solves: 25, rally_accuracy: 70 }
  }
} as const;

export type TitleName = keyof typeof USER_TITLES;
