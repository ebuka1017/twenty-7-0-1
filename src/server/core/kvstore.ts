import { Context } from '@devvit/public-api';
import { Cipher, Guess, UserProfile, Breadcrumb, Rally } from '../../shared/types/index.js';

export class KVStoreService {
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  // Cipher operations
  async saveCipher(cipher: Cipher): Promise<void> {
    await this.context.redis.hSet(`cipher:${cipher.id}`, {
      id: cipher.id,
      title: cipher.title,
      hint: cipher.hint,
      solution: cipher.solution,
      difficulty: cipher.difficulty,
      format: cipher.format,
      content: cipher.content,
      contentUrl: cipher.contentUrl || '',
      timeLimit: cipher.timeLimit.toString(),
      createdAt: cipher.createdAt.toString(),
      expiresAt: cipher.expiresAt.toString(),
      isActive: cipher.isActive.toString(),
      sourceEvent: cipher.sourceEvent || '',
      breadcrumbData: cipher.breadcrumbData ? JSON.stringify(cipher.breadcrumbData) : ''
    });

    // Add to active ciphers list if active
    if (cipher.isActive) {
      const count = await this.context.redis.incrBy('active_cipher_count', 1);
      await this.context.redis.set(`active_cipher_id:${count}`, cipher.id);
    }
  }

  async getCipher(cipherId: string): Promise<Cipher | null> {
    const data = await this.context.redis.hGetAll(`cipher:${cipherId}`);
    if (!data || !data.id) return null;

    return {
      id: data.id,
      title: data.title || '',
      hint: data.hint || '',
      solution: data.solution || '',
      difficulty: (data.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Easy',
      format: (data.format as 'text' | 'image' | 'audio') || 'text',
      content: data.content || '',
      contentUrl: data.contentUrl || undefined,
      timeLimit: parseInt(data.timeLimit || '3'),
      createdAt: parseInt(data.createdAt || '0'),
      expiresAt: parseInt(data.expiresAt || '0'),
      isActive: data.isActive === 'true',
      sourceEvent: data.sourceEvent || undefined,
      breadcrumbData: data.breadcrumbData ? JSON.parse(data.breadcrumbData) : undefined
    };
  }

  async getActiveCiphers(): Promise<Cipher[]> {
    // Get all cipher keys and check which ones are active
    // This is a simplified approach - in production we'd use a proper index
    const ciphers: Cipher[] = [];
    
    // For now, we'll track active cipher IDs in a simple counter-based system
    const activeCipherCountStr = await this.context.redis.get('active_cipher_count');
    const activeCipherCount = parseInt(activeCipherCountStr || '0');
    
    for (let i = 1; i <= activeCipherCount; i++) {
      const cipherId = await this.context.redis.get(`active_cipher_id:${i}`);
      if (cipherId) {
        const cipher = await this.getCipher(cipherId);
        if (cipher && cipher.isActive && cipher.expiresAt > Date.now()) {
          ciphers.push(cipher);
        }
      }
    }

    return ciphers.sort((a, b) => a.createdAt - b.createdAt);
  }

  async expireCipher(cipherId: string): Promise<void> {
    await this.context.redis.hSet(`cipher:${cipherId}`, { isActive: 'false' });
    // Note: In a production system, we'd properly remove from active list
    // For now, the getActiveCiphers method filters by expiration time
  }

  // Guess operations
  async saveGuess(guess: Guess): Promise<void> {
    await this.context.redis.hSet(`guess:${guess.id}`, {
      id: guess.id,
      cipherId: guess.cipherId,
      userId: guess.userId,
      username: guess.username,
      content: guess.content,
      rallyCount: guess.rallyCount.toString(),
      createdAt: guess.createdAt.toString(),
      isWinner: (guess.isWinner || false).toString()
    });

    // Add to cipher's guess list (using a simple counter and individual keys)
    const guessCount = await this.context.redis.incrBy(`cipher_guess_count:${guess.cipherId}`, 1);
    await this.context.redis.set(`cipher_guess:${guess.cipherId}:${guessCount}`, guess.id);
  }

  async getCipherGuesses(cipherId: string): Promise<Guess[]> {
    const guessCountStr = await this.context.redis.get(`cipher_guess_count:${cipherId}`);
    const guessCount = parseInt(guessCountStr || '0');
    const guesses: Guess[] = [];

    for (let i = 1; i <= guessCount; i++) {
      const guessId = await this.context.redis.get(`cipher_guess:${cipherId}:${i}`);
      if (guessId) {
        const data = await this.context.redis.hGetAll(`guess:${guessId}`);
        if (data && data.id) {
          guesses.push({
            id: data.id,
            cipherId: data.cipherId || '',
            userId: data.userId || '',
            username: data.username || '',
            content: data.content || '',
            rallyCount: parseInt(data.rallyCount || '0'),
            createdAt: parseInt(data.createdAt || '0'),
            isWinner: data.isWinner === 'true'
          });
        }
      }
    }

    return guesses.sort((a, b) => b.rallyCount - a.rallyCount);
  }

  // Rally operations (atomic)
  async incrementRallyCount(guessId: string): Promise<number> {
    return await this.context.redis.hIncrBy(`guess:${guessId}`, 'rallyCount', 1);
  }

  async addRally(rally: Rally): Promise<void> {
    await this.context.redis.hSet(`rally:${rally.id}`, {
      id: rally.id,
      guessId: rally.guessId,
      userId: rally.userId,
      createdAt: rally.createdAt.toString()
    });

    // Track user's rallies (using simple counter and keys)
    const rallyCount = await this.context.redis.incrBy(`user_rally_count:${rally.userId}`, 1);
    await this.context.redis.set(`user_rally:${rally.userId}:${rallyCount}`, rally.id);
  }

  async hasUserRallied(userId: string, guessId: string): Promise<boolean> {
    const rallyCountStr = await this.context.redis.get(`user_rally_count:${userId}`);
    const rallyCount = parseInt(rallyCountStr || '0');
    
    for (let i = 1; i <= rallyCount; i++) {
      const rallyId = await this.context.redis.get(`user_rally:${userId}:${i}`);
      if (rallyId) {
        const rally = await this.context.redis.hGetAll(`rally:${rallyId}`);
        if (rally && rally.guessId === guessId) {
          return true;
        }
      }
    }
    
    return false;
  }

  // User profile operations
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.context.redis.hSet(`user:${profile.user_id}`, {
      user_id: profile.user_id,
      username: profile.username,
      solves_count: profile.solves_count.toString(),
      successful_rallies: profile.successful_rallies.toString(),
      total_rallies: profile.total_rallies.toString(),
      breadcrumbs_collected: JSON.stringify(profile.breadcrumbs_collected),
      titles: JSON.stringify(profile.titles),
      avg_solve_time_seconds: profile.avg_solve_time_seconds.toString(),
      difficulty_breakdown: JSON.stringify(profile.difficulty_breakdown),
      rally_accuracy_percentage: profile.rally_accuracy_percentage.toString(),
      join_timestamp: profile.join_timestamp.toString(),
      last_active: profile.last_active.toString()
    });
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const data = await this.context.redis.hGetAll(`user:${userId}`);
    if (!data || !data.user_id) return null;

    return {
      user_id: data.user_id,
      username: data.username || '',
      solves_count: parseInt(data.solves_count || '0'),
      successful_rallies: parseInt(data.successful_rallies || '0'),
      total_rallies: parseInt(data.total_rallies || '0'),
      breadcrumbs_collected: JSON.parse(data.breadcrumbs_collected || '[]'),
      titles: JSON.parse(data.titles || '[]'),
      avg_solve_time_seconds: parseFloat(data.avg_solve_time_seconds || '0'),
      difficulty_breakdown: JSON.parse(data.difficulty_breakdown || '{"easy":0,"medium":0,"hard":0}'),
      rally_accuracy_percentage: parseFloat(data.rally_accuracy_percentage || '0'),
      join_timestamp: parseInt(data.join_timestamp || '0'),
      last_active: parseInt(data.last_active || '0')
    };
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; current: number; resetTime: number }> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / (windowSeconds * 1000))}`;
    
    // Get current count for this window
    const currentStr = await this.context.redis.get(windowKey);
    const current = parseInt(currentStr || '0');
    
    if (current >= limit) {
      const resetTime = now + (windowSeconds * 1000);
      return { allowed: false, current, resetTime };
    }
    
    // Increment counter for this window
    await this.context.redis.incrBy(windowKey, 1);
    await this.context.redis.expire(windowKey, windowSeconds);
    
    return { allowed: true, current: current + 1, resetTime: now + (windowSeconds * 1000) };
  }

  // Breadcrumb operations
  async saveBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    await this.context.redis.hSet(`breadcrumb:${breadcrumb.breadcrumb_id}`, {
      breadcrumb_id: breadcrumb.breadcrumb_id,
      narrative_thread_id: breadcrumb.narrative_thread_id,
      connection_nodes: JSON.stringify(breadcrumb.connection_nodes),
      reveal_threshold: breadcrumb.reveal_threshold.toString(),
      collected_timestamp: breadcrumb.collected_timestamp.toString(),
      cipher_solution_hash: breadcrumb.cipher_solution_hash,
      thematic_weight: breadcrumb.thematic_weight.toString(),
      connection_strength: breadcrumb.connection_strength.toString(),
      thematic_category: breadcrumb.thematic_category,
      content: breadcrumb.content,
      cipher_source_event: breadcrumb.cipher_source_event
    });

    // Add to global breadcrumb counter
    await this.context.redis.incrBy('global_breadcrumb_count', 1);
    await this.context.redis.incrBy(`breadcrumb_count:${breadcrumb.thematic_category}`, 1);
  }

  async getBreadcrumbCount(): Promise<{ total: number; byCategory: Record<string, number> }> {
    const total = await this.context.redis.get('global_breadcrumb_count') || '0';
    const privacy = await this.context.redis.get('breadcrumb_count:privacy') || '0';
    const auditing = await this.context.redis.get('breadcrumb_count:auditing') || '0';
    const patents = await this.context.redis.get('breadcrumb_count:patents') || '0';

    return {
      total: parseInt(total),
      byCategory: {
        privacy: parseInt(privacy),
        auditing: parseInt(auditing),
        patents: parseInt(patents)
      }
    };
  }
}
