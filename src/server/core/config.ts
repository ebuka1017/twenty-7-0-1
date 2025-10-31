/**
 * Configuration service for API keys and environment variables
 */
export class ConfigService {
  /**
   * Get Perplexity API key from environment
   */
  static getPerplexityApiKey(): string | undefined {
    // In Devvit, environment variables are not directly accessible
    // API keys would need to be configured through Devvit's settings system
    // For now, return undefined to trigger fallback mode
    return process.env.PERPLEXITY_API_KEY;
  }

  /**
   * Get Gemini API key from environment
   */
  static getGeminiApiKey(): string | undefined {
    // In Devvit, environment variables are not directly accessible
    // API keys would need to be configured through Devvit's settings system
    // For now, return undefined to trigger fallback mode
    return process.env.GEMINI_API_KEY;
  }

  /**
   * Check if AI services are configured
   */
  static areAIServicesConfigured(): boolean {
    return !!(this.getPerplexityApiKey() && this.getGeminiApiKey());
  }

  /**
   * Get configuration status for debugging
   */
  static getConfigStatus(): {
    perplexityConfigured: boolean;
    geminiConfigured: boolean;
    aiServicesEnabled: boolean;
  } {
    const perplexityConfigured = !!this.getPerplexityApiKey();
    const geminiConfigured = !!this.getGeminiApiKey();
    
    return {
      perplexityConfigured,
      geminiConfigured,
      aiServicesEnabled: perplexityConfigured && geminiConfigured
    };
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  // Cipher generation settings
  CIPHER_GENERATION_TIMEOUT: 30000, // 30 seconds
  FALLBACK_POOL_SIZE: 50,
  MIN_FALLBACK_POOL_SIZE: 5,
  
  // Difficulty distribution (percentages)
  DIFFICULTY_DISTRIBUTION: {
    Easy: 0.5,    // 50%
    Medium: 0.35, // 35%
    Hard: 0.15    // 15%
  },
  
  // Format distribution (percentages)
  FORMAT_DISTRIBUTION: {
    text: 0.6,    // 60%
    image: 0.25,  // 25%
    audio: 0.15   // 15%
  },
  
  // Time limits by difficulty (hours)
  TIME_LIMITS: {
    Easy: 3,
    Medium: 4,
    Hard: 5
  },
  
  // Rate limiting
  RATE_LIMITS: {
    GUESS_SUBMISSION: {
      limit: 5,
      windowSeconds: 60
    },
    RALLY_ACTION: {
      limit: 10,
      windowSeconds: 60
    }
  },
  
  // Backup mode settings
  BACKUP_MODE_TTL: 3600, // 1 hour
  
  // Hash settings for duplicate detection
  SOLUTION_HASH_TTL: 30 * 24 * 60 * 60 // 30 days
} as const;
