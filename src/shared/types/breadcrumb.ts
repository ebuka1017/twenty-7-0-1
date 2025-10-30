export interface Breadcrumb {
  breadcrumb_id: string;
  narrative_thread_id: string;
  connection_nodes: string[]; // IDs of connected breadcrumbs
  reveal_threshold: number; // Default 50
  collected_timestamp: number;
  cipher_solution_hash: string; // SHA-256 of solution
  thematic_weight: number; // 0.1-1.0
  connection_strength: number; // 0.1-1.0
  thematic_category: 'privacy' | 'auditing' | 'patents';
  content: string; // The actual narrative content revealed
  cipher_source_event: string;
}

export interface NarrativeThread {
  thread_id: string;
  thematic_category: 'privacy' | 'auditing' | 'patents';
  breadcrumb_count: number;
  completion_threshold: number; // 50 for story fragment unlock
  is_unlocked: boolean;
  story_fragment?: string;
  created_at: number;
  updated_at: number;
}

export interface StoryFragment {
  fragment_id: string;
  narrative_thread_id: string;
  content: string;
  unlock_timestamp: number;
  breadcrumb_ids: string[]; // Breadcrumbs that unlocked this fragment
}

export const THEME_DICTIONARY = {
  privacy: [
    'ECPA', 'surveillance', 'encryption', 'privacy', 'data protection',
    'digital rights', 'wiretapping', 'metadata', 'anonymity', 'VPN'
  ],
  auditing: [
    'PCAOB', 'SOX', 'compliance', 'financial audit', 'internal controls',
    'risk assessment', 'governance', 'transparency', 'accountability', 'oversight'
  ],
  patents: [
    'USPTO', 'prior art', 'claims', 'intellectual property', 'innovation',
    'patent law', 'invention', 'licensing', 'infringement', 'prosecution'
  ]
} as const;

export const NARRATIVE_THRESHOLDS = {
  STORY_FRAGMENT: 50, // Breadcrumbs needed to unlock story fragment
  MASTER_CIPHER: 200, // Total breadcrumbs across all threads for endgame
  THREAD_DISTRIBUTION: {
    privacy: 67,
    auditing: 67, 
    patents: 66
  }
} as const;
