import { Cipher } from '../../shared/types/index.js';
import { PerplexityService, GeminiService, CipherValidationService, CipherGenerationRequest } from './ai-services.js';
import { getRandomFallbackCipher, getFallbackCipherPool } from './fallback-ciphers.js';
import { KVStoreService } from './kvstore.js';
import { ConfigService, DEFAULT_CONFIG } from './config.js';
import { redis } from '@devvit/web/server';

export class CipherGenerationService {
  private perplexityService: PerplexityService;
  private geminiService: GeminiService;
  private kvStore: KVStoreService;

  constructor() {
    this.perplexityService = new PerplexityService();
    this.geminiService = new GeminiService();
    this.kvStore = new KVStoreService();
  }

  /**
   * Main cipher generation method with AI integration and fallback
   */
  async generateCipher(): Promise<Cipher> {
    console.log('Starting cipher generation process...');
    
    try {
      // Try AI generation with timeout
      const cipher = await this.generateWithAI();
      console.log('Successfully generated cipher with AI:', cipher.id);
      return cipher;
    } catch (error) {
      console.warn('AI generation failed, using fallback:', error);
      
      // Set backup mode indicator
      await redis.set('backup_mode', 'true');
      await redis.expire('backup_mode', 3600);
      
      // Use fallback cipher
      const fallbackCipher = await this.selectFallbackCipher();
      console.log('Using fallback cipher:', fallbackCipher.id);
      return fallbackCipher;
    }
  }

  /**
   * Generate cipher using AI services with timeout
   */
  private async generateWithAI(): Promise<Cipher> {
    // Check if AI services are configured
    if (!ConfigService.areAIServicesConfigured()) {
      throw new Error('AI services not configured - using fallback');
    }

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('AI generation timeout')), DEFAULT_CONFIG.CIPHER_GENERATION_TIMEOUT)
    );

    const generationPromise = this.performAIGeneration();
    
    return await Promise.race([generationPromise, timeoutPromise]);
  }

  /**
   * Perform the actual AI generation process
   */
  private async performAIGeneration(): Promise<Cipher> {
    // Step 1: Fetch recent events from Perplexity
    const theme = this.selectRandomTheme();
    console.log(`Fetching events for theme: ${theme}`);
    
    const events = await this.perplexityService.fetchRecentEvents(theme);
    if (!events || events.length === 0) {
      throw new Error('No events found from Perplexity API');
    }

    // Select the most relevant event
    const selectedEvent = events.reduce((best, current) => 
      current.relevanceScore > best.relevanceScore ? current : best
    );

    console.log(`Selected event: ${selectedEvent.title} (relevance: ${selectedEvent.relevanceScore})`);

    // Step 2: Generate cipher with Gemini
    const difficulty = this.selectDifficultyLevel();
    const format = this.selectCipherFormat();

    const request: CipherGenerationRequest = {
      event: selectedEvent,
      difficulty,
      format
    };

    console.log(`Generating ${difficulty} ${format} cipher...`);
    const cipher = await this.geminiService.generateCipher(request);

    // Step 3: Validate generated cipher
    const validation = CipherValidationService.validateGeneratedCipher(cipher);
    if (!validation.isValid) {
      console.error('Generated cipher validation failed:', validation.errors);
      throw new Error(`Cipher validation failed: ${validation.errors.join(', ')}`);
    }

    // Step 4: Check for duplicates
    const isDuplicate = await this.checkForDuplicate(cipher);
    if (isDuplicate) {
      console.warn('Generated cipher is a duplicate, retrying...');
      // Retry once with different parameters
      return await this.performAIGeneration();
    }

    return cipher;
  }

  /**
   * Select fallback cipher from pre-generated pool
   */
  private async selectFallbackCipher(): Promise<Cipher> {
    try {
      // Try to get from fallback pool in KV store
      const poolData = await redis.get('fallback_cipher_pool');
      let pool: Cipher[] = [];
      
      if (poolData) {
        pool = JSON.parse(poolData);
      }

      // If pool is empty or low, replenish it
      if (pool.length < DEFAULT_CONFIG.MIN_FALLBACK_POOL_SIZE) {
        console.log('Replenishing fallback cipher pool...');
        pool = getFallbackCipherPool(DEFAULT_CONFIG.FALLBACK_POOL_SIZE);
        await redis.set('fallback_cipher_pool', JSON.stringify(pool));
      }

      // Select random cipher from pool
      const selectedIndex = Math.floor(Math.random() * pool.length);
      const selectedCipher = pool[selectedIndex];
      
      if (!selectedCipher) {
        throw new Error('No cipher available in fallback pool');
      }

      // Remove selected cipher from pool
      pool.splice(selectedIndex, 1);
      await redis.set('fallback_cipher_pool', JSON.stringify(pool));

      // Update timestamps for the selected cipher
      const now = Date.now();
      selectedCipher.createdAt = now;
      selectedCipher.expiresAt = now + (selectedCipher.timeLimit * 60 * 60 * 1000);

      return selectedCipher;

    } catch (error) {
      console.error('Error selecting fallback cipher:', error);
      // Last resort: use hardcoded fallback
      return getRandomFallbackCipher();
    }
  }

  /**
   * Check if cipher is a duplicate by comparing solution hash
   */
  private async checkForDuplicate(cipher: Cipher): Promise<boolean> {
    try {
      // Create hash of solution for duplicate detection
      const solutionHash = await this.createHash(cipher.solution);
      const existingHash = await redis.get(`solution_hash:${solutionHash}`);
      
      if (existingHash) {
        return true; // Duplicate found
      }

      // Store hash for future duplicate detection
      await redis.set(`solution_hash:${solutionHash}`, cipher.id);
      await redis.expire(`solution_hash:${solutionHash}`, DEFAULT_CONFIG.SOLUTION_HASH_TTL);
      return false;

    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false; // Assume not duplicate if check fails
    }
  }

  /**
   * Create simple hash of a string (for duplicate detection)
   */
  private async createHash(input: string): Promise<string> {
    // Simple hash function for duplicate detection
    // In production, you'd use a proper crypto hash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Select random theme for event fetching
   */
  private selectRandomTheme(): 'privacy' | 'auditing' | 'patents' {
    const themes: ('privacy' | 'auditing' | 'patents')[] = ['privacy', 'auditing', 'patents'];
    const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    return selectedTheme!; // We know this will always be defined
  }

  /**
   * Select difficulty level based on configured distribution
   */
  private selectDifficultyLevel(): 'Easy' | 'Medium' | 'Hard' {
    const rand = Math.random();
    const { Easy, Medium } = DEFAULT_CONFIG.DIFFICULTY_DISTRIBUTION;
    
    if (rand < Easy) return 'Easy';
    if (rand < Easy + Medium) return 'Medium';
    return 'Hard';
  }

  /**
   * Select cipher format based on configured distribution
   */
  private selectCipherFormat(): 'text' | 'image' | 'audio' {
    const rand = Math.random();
    const { text, image } = DEFAULT_CONFIG.FORMAT_DISTRIBUTION;
    
    if (rand < text) return 'text';
    if (rand < text + image) return 'image';
    return 'audio';
  }

  /**
   * Store generated cipher in KV store
   */
  async storeCipher(cipher: Cipher): Promise<void> {
    try {
      await this.kvStore.saveCipher(cipher);
      console.log(`Cipher stored successfully: ${cipher.id}`);
      
      // Update global statistics
      await this.updateGlobalStats();
      
    } catch (error) {
      console.error('Error storing cipher:', error);
      throw error;
    }
  }

  /**
   * Update global cipher statistics
   */
  private async updateGlobalStats(): Promise<void> {
    try {
      await redis.incrBy('global_cipher_count', 1);
      
      // Update daily cipher count
      const today = new Date().toISOString().split('T')[0];
      await redis.incrBy(`daily_cipher_count:${today}`, 1);
      
    } catch (error) {
      console.error('Error updating global stats:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get backup mode status
   */
  async isInBackupMode(): Promise<boolean> {
    try {
      const backupMode = await redis.get('backup_mode');
      return backupMode === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear backup mode
   */
  async clearBackupMode(): Promise<void> {
    try {
      await redis.del('backup_mode');
    } catch (error) {
      console.error('Error clearing backup mode:', error);
    }
  }

  /**
   * Initialize fallback cipher pool if empty
   */
  async initializeFallbackPool(): Promise<void> {
    try {
      const poolData = await redis.get('fallback_cipher_pool');
      
      if (!poolData) {
        console.log('Initializing fallback cipher pool...');
        const pool = getFallbackCipherPool(DEFAULT_CONFIG.FALLBACK_POOL_SIZE);
        await redis.set('fallback_cipher_pool', JSON.stringify(pool));
        console.log(`Initialized fallback pool with ${pool.length} ciphers`);
      }
    } catch (error) {
      console.error('Error initializing fallback pool:', error);
    }
  }

  /**
   * Get cipher generation statistics
   */
  async getGenerationStats(): Promise<{
    totalGenerated: number;
    todayGenerated: number;
    backupMode: boolean;
    fallbackPoolSize: number;
  }> {
    try {
      const [totalStr, todayStr, backupMode, poolData] = await Promise.all([
        redis.get('global_cipher_count'),
        redis.get(`daily_cipher_count:${new Date().toISOString().split('T')[0]}`),
        redis.get('backup_mode'),
        redis.get('fallback_cipher_pool')
      ]);

      const pool = poolData ? JSON.parse(poolData) : [];

      return {
        totalGenerated: parseInt(totalStr || '0'),
        todayGenerated: parseInt(todayStr || '0'),
        backupMode: backupMode === 'true',
        fallbackPoolSize: pool.length
      };
    } catch (error) {
      console.error('Error getting generation stats:', error);
      return {
        totalGenerated: 0,
        todayGenerated: 0,
        backupMode: false,
        fallbackPoolSize: 0
      };
    }
  }
}
