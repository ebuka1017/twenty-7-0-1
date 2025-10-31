import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort, realtime } from '@devvit/web/server';
import { createPost, createCipherPost } from './core/post';
import { CipherGenerationService } from './core/cipher-generation.js';
import { KVStoreService } from './core/kvstore.js';
import { Cipher, Guess } from '../shared/types/index.js';

const app = express();

// Helper function to handle T-10 second lockdown
async function handleCipherLockdown(cipher: Cipher): Promise<void> {
  try {
    console.log(`Handling lockdown for cipher: ${cipher.id}`);
    
    // Send realtime update about lockdown
    try {
      await realtime.send(`cipher_${cipher.id}`, {
        type: 'cipher_lockdown',
        cipherId: cipher.id,
        timestamp: Date.now(),
        timeRemaining: cipher.expiresAt - Date.now()
      });
    } catch (realtimeError) {
      console.error('Failed to send lockdown realtime update:', realtimeError);
    }
    
  } catch (error) {
    console.error(`Error handling cipher lockdown for ${cipher.id}:`, error);
  }
}

// Helper function to handle cipher expiration
async function handleCipherExpiration(cipher: Cipher, kvStore: KVStoreService): Promise<void> {
  try {
    console.log(`Handling expiration for cipher: ${cipher.id}`);
    
    // Get all guesses for this cipher
    const guesses = await kvStore.getCipherGuesses(cipher.id);
    
    // Determine winner (highest rally count, ties broken by earliest timestamp)
    let winner: Guess | null = null;
    if (guesses.length > 0) {
      // Sort by rally count (descending) then by timestamp (ascending for ties)
      const sortedGuesses = guesses.sort((a, b) => {
        if (b.rallyCount !== a.rallyCount) {
          return b.rallyCount - a.rallyCount;
        }
        return a.createdAt - b.createdAt;
      });
      
      winner = sortedGuesses[0] || null;
      
      // Only consider it a win if there's at least 1 rally
      if (winner && winner.rallyCount === 0) {
        winner = null;
      }
    }
    
    // Mark cipher as expired
    await kvStore.expireCipher(cipher.id);
    
    // Send realtime update about expiration
    try {
      await realtime.send(`cipher_${cipher.id}`, {
        type: 'cipher_expired',
        cipherId: cipher.id,
        winner: winner ? {
          id: winner.id,
          username: winner.username,
          content: winner.content,
          rallyCount: winner.rallyCount
        } : null,
        solution: cipher.solution,
        timestamp: Date.now()
      });
    } catch (realtimeError) {
      console.error('Failed to send expiration realtime update:', realtimeError);
    }
    
    // Handle winner logic
    if (winner) {
      console.log(`Winner determined: ${winner.username} with "${winner.content}" (${winner.rallyCount} rallies)`);
      
      // Mark the winning guess
      await redis.hSet(`guess:${winner.id}`, { isWinner: 'true' });
      
      // Update user stats for the winner
      await kvStore.incrementUserSolves(winner.userId, 
        cipher.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
        cipher.expiresAt - cipher.createdAt
      );
      
      // Update rally stats for all users who rallied for the winning guess
      await updateRallyStats(winner.id, kvStore, true);
      
      // Generate breadcrumb for solved cipher
      await generateBreadcrumb(cipher, winner, kvStore);
      
      // Create Reddit comment with solution
      await postSolutionComment(cipher, winner);
      
    } else {
      console.log(`No winner for cipher: ${cipher.id} (no guesses with rallies)`);
      
      // Create Reddit comment with solution (no winner)
      await postSolutionComment(cipher, null);
    }
    
    // Update rally stats for users who rallied for non-winning guesses
    for (const guess of guesses) {
      if (!winner || guess.id !== winner.id) {
        await updateRallyStats(guess.id, kvStore, false);
      }
    }
    
  } catch (error) {
    console.error(`Error handling cipher expiration for ${cipher.id}:`, error);
  }
}

// Helper function to update rally stats for users
async function updateRallyStats(guessId: string, _kvStore: KVStoreService, wasSuccessful: boolean): Promise<void> {
  try {
    // This is a simplified approach - in production we'd need a proper index of rallies by guess
    // For now, we'll skip the rally stats update to avoid complexity
    console.log(`Rally stats update needed for guess ${guessId}, successful: ${wasSuccessful}`);
    
    // TODO: Implement proper rally stats tracking
    // Would need to:
    // 1. Get all users who rallied for this guess
    // 2. Update their successful_rallies count if wasSuccessful
    // 3. Recalculate their rally accuracy percentage
    
  } catch (error) {
    console.error('Error updating rally stats:', error);
  }
}

// Helper function to generate breadcrumb for solved cipher
async function generateBreadcrumb(cipher: Cipher, winner: Guess, kvStore: KVStoreService): Promise<void> {
  try {
    if (!cipher.breadcrumbData) {
      console.log(`No breadcrumb data for cipher: ${cipher.id}`);
      return;
    }
    
    const breadcrumb = {
      breadcrumb_id: `breadcrumb_${cipher.id}_${Date.now()}`,
      narrative_thread_id: cipher.breadcrumbData.narrative_thread_id,
      connection_nodes: [], // Will be populated by breadcrumb analysis
      reveal_threshold: cipher.breadcrumbData.unlock_threshold,
      collected_timestamp: Date.now(),
      cipher_solution_hash: cipher.solution, // Simplified - in production would be hashed
      thematic_weight: cipher.breadcrumbData.connection_weight,
      connection_strength: cipher.breadcrumbData.connection_weight,
      thematic_category: cipher.breadcrumbData.thematic_category,
      content: `Cipher "${cipher.title}" solved by ${winner.username}`,
      cipher_source_event: cipher.breadcrumbData.cipher_source_event
    };
    
    await kvStore.saveBreadcrumb(breadcrumb);
    console.log(`Generated breadcrumb: ${breadcrumb.breadcrumb_id} for thread: ${breadcrumb.narrative_thread_id}`);
    
  } catch (error) {
    console.error('Error generating breadcrumb:', error);
  }
}

// Helper function to post solution as Reddit comment
async function postSolutionComment(cipher: Cipher, winner: Guess | null): Promise<void> {
  try {
    const { subredditName, postId } = context;
    if (!subredditName || !postId) {
      console.error('Missing subreddit or post context for comment posting');
      return;
    }
    
    let commentText: string;
    if (winner) {
      commentText = `🔓 **CIPHER SOLVED!**\n\n` +
                   `**Solution:** \`${cipher.solution}\`\n` +
                   `**Winner:** u/${winner.username}\n` +
                   `**Winning Guess:** "${winner.content}"\n` +
                   `**Rally Count:** ${winner.rallyCount}\n` +
                   `**Difficulty:** ${cipher.difficulty}\n\n` +
                   `Congratulations to u/${winner.username} for cracking this ${cipher.difficulty.toLowerCase()} cipher! 🎉\n\n` +
                   `*A new breadcrumb has been added to the ${cipher.breadcrumbData?.thematic_category || 'mystery'} thread...*`;
    } else {
      commentText = `🔒 **CIPHER EXPIRED**\n\n` +
                   `**Solution:** \`${cipher.solution}\`\n` +
                   `**Result:** Unsolved\n` +
                   `**Difficulty:** ${cipher.difficulty}\n\n` +
                   `This ${cipher.difficulty.toLowerCase()} cipher has expired without a winner. The vault remains sealed... 🔐\n\n` +
                   `*No breadcrumb was collected. The mystery deepens.*`;
    }
    
    await reddit.submitComment({
      id: postId,
      text: commentText
    });
    
    console.log(`Posted solution comment for cipher: ${cipher.id}`);
    
  } catch (error) {
    console.error('Error posting solution comment:', error);
  }
}

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/cipher-create', async (_req, res): Promise<void> => {
  try {
    // For now, create a basic cipher post - will be enhanced in later tasks
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating cipher post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create cipher post',
    });
  }
});

router.get('/api/ciphers', async (_req, res): Promise<void> => {
  try {
    const kvStore = new KVStoreService();
    const ciphers = await kvStore.getActiveCiphers();
    
    res.json({
      success: true,
      data: {
        ciphers,
        total: ciphers.length
      }
    });
  } catch (error) {
    console.error(`Error fetching ciphers: ${error}`);
    res.status(400).json({
      success: false,
      error: 'Failed to fetch ciphers'
    });
  }
});

router.get('/api/leaderboard', async (req, res): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    
    const kvStore = new KVStoreService();
    const leaderboardData = await kvStore.getLeaderboard(page, limit);
    
    res.json({
      success: true,
      data: leaderboardData
    });
  } catch (error) {
    console.error(`Error fetching leaderboard: ${error}`);
    res.status(400).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// API endpoint for user profile
router.get('/api/user/profile', async (_req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }
    
    const kvStore = new KVStoreService();
    let profile = await kvStore.getUserProfile(username);
    
    // Create profile if it doesn't exist
    if (!profile) {
      profile = {
        user_id: username,
        username,
        solves_count: 0,
        successful_rallies: 0,
        total_rallies: 0,
        breadcrumbs_collected: [],
        titles: [],
        avg_solve_time_seconds: 0,
        difficulty_breakdown: { easy: 0, medium: 0, hard: 0 },
        rally_accuracy_percentage: 0,
        join_timestamp: Date.now(),
        last_active: Date.now()
      };
      
      await kvStore.saveUserProfile(profile);
    }
    
    // Calculate stats
    const { UserService } = await import('./core/user-service.js');
    const scoreBreakdown = UserService.calculateScoreBreakdown(profile);
    
    const stats = {
      total_score: scoreBreakdown.totalScore,
      rank: await kvStore.getUserRank(username),
      speed_bonus: scoreBreakdown.speedBonus,
      rally_bonus: scoreBreakdown.rallyBonus
    };
    
    res.json({
      success: true,
      data: {
        profile,
        stats
      }
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

router.post('/internal/on-comment-submit', async (_req, res): Promise<void> => {
  try {
    // Placeholder for comment processing - will be enhanced in later tasks
    res.json({
      status: 'success',
      message: 'Comment processed',
    });
  } catch (error) {
    console.error(`Error processing comment: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to process comment',
    });
  }
});

// Scheduler job handlers
router.post('/internal/scheduler/generateCipher', async (_req, res): Promise<void> => {
  try {
    console.log('Starting scheduled cipher generation...');
    
    const cipherService = new CipherGenerationService();
    
    // Initialize fallback pool if needed
    await cipherService.initializeFallbackPool();
    
    // Generate new cipher
    const cipher = await cipherService.generateCipher();
    
    // Store cipher in KV store
    await cipherService.storeCipher(cipher);
    
    // Create Reddit post for the cipher
    const post = await createCipherPost(cipher);
    
    console.log(`Successfully generated and posted cipher: ${cipher.id}`);
    
    res.json({
      status: 'success',
      message: `Cipher generated and posted: ${cipher.id}`,
      cipherId: cipher.id,
      postId: post.id
    });
    
  } catch (error) {
    console.error('Scheduled cipher generation failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate cipher',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/internal/scheduler/expireCiphers', async (_req, res): Promise<void> => {
  try {
    console.log('Starting cipher expiration check...');
    
    const kvStore = new KVStoreService();
    const activeCiphers = await kvStore.getActiveCiphers();
    const now = Date.now();
    let expiredCount = 0;
    let lockedCount = 0;
    
    for (const cipher of activeCiphers) {
      const timeRemaining = cipher.expiresAt - now;
      
      // Handle T-10 second lockdown
      if (timeRemaining <= 10000 && timeRemaining > 0) {
        await handleCipherLockdown(cipher);
        lockedCount++;
        console.log(`Locked cipher: ${cipher.id} (${Math.floor(timeRemaining / 1000)}s remaining)`);
      }
      
      // Handle expiration
      if (cipher.expiresAt <= now) {
        await handleCipherExpiration(cipher, kvStore);
        expiredCount++;
        console.log(`Expired cipher: ${cipher.id}`);
      }
    }
    
    res.json({
      status: 'success',
      message: `Expired ${expiredCount} ciphers, locked ${lockedCount} ciphers`,
      expiredCount,
      lockedCount
    });
    
  } catch (error) {
    console.error('Cipher expiration check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to expire ciphers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint for manual cipher generation (for testing/admin use)
router.post('/api/generate-cipher', async (_req, res): Promise<void> => {
  try {
    const cipherService = new CipherGenerationService();
    
    // Generate new cipher
    const cipher = await cipherService.generateCipher();
    
    // Store cipher in KV store
    await cipherService.storeCipher(cipher);
    
    res.json({
      success: true,
      data: {
        cipher,
        message: 'Cipher generated successfully'
      }
    });
    
  } catch (error) {
    console.error('Manual cipher generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cipher',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint for cipher generation statistics
router.get('/api/cipher-stats', async (_req, res): Promise<void> => {
  try {
    const cipherService = new CipherGenerationService();
    const stats = await cipherService.getGenerationStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Failed to get cipher stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cipher statistics'
    });
  }
});

// API endpoint for rally updates polling (fallback when realtime fails)
router.get('/api/cipher/:cipherId/rally-updates', async (req, res): Promise<void> => {
  try {
    const { cipherId } = req.params;
    // const { since } = req.query; // For future use when implementing proper polling
    
    if (!cipherId) {
      res.status(400).json({
        success: false,
        error: 'Cipher ID is required'
      });
      return;
    }
    
    // For simplicity, we'll return empty updates for now
    // In a full implementation, we'd track recent rally updates with timestamps
    // and return only updates since the 'since' timestamp
    
    res.json({
      success: true,
      data: {
        updates: [] // No updates for polling fallback in this implementation
      }
    });
    
  } catch (error) {
    console.error(`Failed to get rally updates for cipher ${req.params.cipherId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rally updates'
    });
  }
});

// API endpoint for individual cipher details
router.get('/api/cipher/:cipherId', async (req, res): Promise<void> => {
  try {
    const { cipherId } = req.params;
    
    if (!cipherId) {
      res.status(400).json({
        success: false,
        error: 'Cipher ID is required'
      });
      return;
    }
    
    const kvStore = new KVStoreService();
    const cipher = await kvStore.getCipher(cipherId);
    
    if (!cipher) {
      res.status(404).json({
        success: false,
        error: 'Cipher not found'
      });
      return;
    }
    
    // Get guess count for this cipher
    const guessCount = await kvStore.getGuessCount(cipherId);
    
    res.json({
      success: true,
      data: {
        cipher,
        guessCount
      }
    });
    
  } catch (error) {
    console.error(`Failed to get cipher ${req.params.cipherId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cipher details'
    });
  }
});

// API endpoint for fetching cipher guesses
router.get('/api/cipher/:cipherId/guesses', async (req, res): Promise<void> => {
  try {
    const { cipherId } = req.params;
    
    if (!cipherId) {
      res.status(400).json({
        success: false,
        error: 'Cipher ID is required'
      });
      return;
    }
    
    const kvStore = new KVStoreService();
    const guesses = await kvStore.getCipherGuesses(cipherId);
    
    res.json({
      success: true,
      data: {
        guesses
      }
    });
    
  } catch (error) {
    console.error(`Failed to get guesses for cipher ${req.params.cipherId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guesses'
    });
  }
});

// API endpoint for rallying behind a guess
router.post('/api/rally-guess', async (req, res): Promise<void> => {
  try {
    const { guessId } = req.body;
    
    if (!guessId) {
      res.status(400).json({
        success: false,
        error: 'Guess ID is required'
      });
      return;
    }
    
    // Get current user
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }
    
    // Check rate limiting for rallies
    const rateLimitKey = `rate_limit:rally:${username}`;
    const currentCount = await redis.get(rateLimitKey);
    
    if (currentCount && parseInt(currentCount) >= 10) {
      // For simplicity, use a fixed 60-second reset time
      const resetTime = new Date(Date.now() + 60000);
      
      res.status(429).json({
        success: false,
        error: 'Rally rate limit exceeded',
        isRateLimited: true,
        rateLimitReset: resetTime.toISOString()
      });
      return;
    }
    
    const kvStore = new KVStoreService();
    
    // Check if user has already rallied for this guess
    const hasRallied = await kvStore.hasUserRallied(username, guessId);
    if (hasRallied) {
      res.status(400).json({
        success: false,
        error: 'You have already rallied for this guess'
      });
      return;
    }
    
    // Create rally record
    const rally = {
      id: `rally_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      guessId,
      userId: username,
      createdAt: Date.now()
    };
    
    // Get the guess to find the cipher ID
    const guessData = await redis.hGetAll(`guess:${guessId}`);
    if (!guessData || !guessData.cipherId) {
      res.status(404).json({
        success: false,
        error: 'Guess not found'
      });
      return;
    }

    // Add rally and increment counter atomically
    await kvStore.addRally(rally);
    const newRallyCount = await kvStore.incrementRallyCount(guessId);
    
    // Send realtime update to all connected clients
    try {
      await realtime.send(`cipher_${guessData.cipherId}`, {
        type: 'rally_update',
        guessId,
        newRallyCount,
        cipherId: guessData.cipherId,
        timestamp: Date.now()
      });
    } catch (realtimeError) {
      console.error('Failed to send realtime update:', realtimeError);
      // Don't fail the request if realtime fails
    }
    
    // Update rate limiting
    await redis.incrBy(rateLimitKey, 1);
    await redis.expire(rateLimitKey, 60); // 1 minute
    
    res.json({
      success: true,
      data: {
        newRallyCount,
        message: 'Rally added successfully'
      }
    });
    
  } catch (error) {
    console.error('Failed to rally guess:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rally guess'
    });
  }
});

// API endpoint for submitting guesses
router.post('/api/submit-guess', async (req, res): Promise<void> => {
  try {
    const { cipherId, content } = req.body;
    
    if (!cipherId || !content) {
      res.status(400).json({
        success: false,
        error: 'Cipher ID and guess content are required'
      });
      return;
    }
    
    // Get current user
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }
    
    // Validate guess content
    const { ValidationService } = await import('./core/validation.js');
    const validation = ValidationService.validateGuess(content);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: validation.error || 'Invalid guess format'
      });
      return;
    }
    
    // Check rate limiting
    const kvStore = new KVStoreService();
    const rateLimitKey = `rate_limit:guess:${username}`;
    const currentCount = await redis.get(rateLimitKey);
    
    if (currentCount && parseInt(currentCount) >= 5) {
      // For simplicity, use a fixed 60-second reset time
      const resetTime = new Date(Date.now() + 60000);
      
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        isRateLimited: true,
        rateLimitReset: resetTime.toISOString()
      });
      return;
    }
    
    // Check if cipher exists and is active
    const cipher = await kvStore.getCipher(cipherId);
    if (!cipher) {
      res.status(404).json({
        success: false,
        error: 'Cipher not found'
      });
      return;
    }
    
    if (!cipher.isActive || cipher.expiresAt <= Date.now()) {
      res.status(400).json({
        success: false,
        error: 'Cipher is no longer active'
      });
      return;
    }
    
    // Store the guess
    const guess = {
      id: `guess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      cipherId,
      userId: username,
      username,
      content: validation.sanitized || content.trim(),
      rallyCount: 0,
      createdAt: Date.now()
    };
    
    await kvStore.storeGuess(guess);
    
    // Update rate limiting
    await redis.incrBy(rateLimitKey, 1);
    await redis.expire(rateLimitKey, 60); // 1 minute
    
    res.json({
      success: true,
      data: {
        guess,
        message: 'Guess submitted successfully'
      }
    });
    
  } catch (error) {
    console.error('Failed to submit guess:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit guess'
    });
  }
});

// API endpoint for configuration status (for debugging)
router.get('/api/config-status', async (_req, res): Promise<void> => {
  try {
    const { ConfigService } = await import('./core/config.js');
    const configStatus = ConfigService.getConfigStatus();
    
    res.json({
      success: true,
      data: {
        ...configStatus,
        message: configStatus.aiServicesEnabled 
          ? 'AI services are configured and enabled'
          : 'AI services not configured - using fallback mode'
      }
    });
    
  } catch (error) {
    console.error('Failed to get config status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration status'
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
