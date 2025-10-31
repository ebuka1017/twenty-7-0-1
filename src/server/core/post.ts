import { context, reddit } from '@devvit/web/server';
import { Cipher } from '../../shared/types/index.js';
import { SplashScreenService } from './splash-screen.js';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  // Generate optimized splash screen configuration
  const splashConfig = SplashScreenService.generateVaultSplash();
  
  // Validate splash configuration
  const validation = SplashScreenService.validateSplashConfig(splashConfig);
  if (!validation.isValid) {
    console.error('Invalid splash configuration:', validation.errors);
    throw new Error(`Splash configuration invalid: ${validation.errors.join(', ')}`);
  }

  return await reddit.submitCustomPost({
    splash: splashConfig,
    postData: {
      gameState: 'vault_entry',
      cipherActive: false,
    },
    subredditName: subredditName,
    title: '🔐 2701: The Vault Awaits',
  });
};

export const createCipherPost = async (cipher: Cipher) => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  // Generate optimized splash screen configuration for this cipher
  const splashConfig = SplashScreenService.generateCipherSplash(cipher);
  
  // Validate splash configuration
  const validation = SplashScreenService.validateSplashConfig(splashConfig);
  if (!validation.isValid) {
    console.error('Invalid cipher splash configuration:', validation.errors);
    throw new Error(`Cipher splash configuration invalid: ${validation.errors.join(', ')}`);
  }

  // Generate engaging post title
  const postTitle = SplashScreenService.generateCipherTitle(cipher);

  return await reddit.submitCustomPost({
    splash: splashConfig,
    postData: {
      gameState: 'cipher_active',
      cipherActive: true,
      cipherId: cipher.id,
      difficulty: cipher.difficulty,
      timeLimit: cipher.timeLimit,
      format: cipher.format,
      hint: cipher.hint,
      createdAt: cipher.createdAt,
      expiresAt: cipher.expiresAt
    },
    subredditName: subredditName,
    title: postTitle,
  });
};

/**
 * Create a post announcing cipher solution
 */
export const createSolutionPost = async (cipher: Cipher, winner?: { username: string; content: string }) => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  // Generate solution splash screen
  const splashConfig = SplashScreenService.generateSolutionSplash(cipher, winner);
  
  // Validate splash configuration
  const validation = SplashScreenService.validateSplashConfig(splashConfig);
  if (!validation.isValid) {
    console.error('Invalid solution splash configuration:', validation.errors);
    throw new Error(`Solution splash configuration invalid: ${validation.errors.join(', ')}`);
  }

  const postTitle = winner 
    ? `🏆 Cipher Solved by ${winner.username}! Solution: ${cipher.solution}`
    : `🔒 Cipher Expired - Solution: ${cipher.solution}`;

  return await reddit.submitCustomPost({
    splash: splashConfig,
    postData: {
      gameState: 'cipher_solved',
      cipherActive: false,
      cipherId: cipher.id,
      solution: cipher.solution,
      winner: winner || null,
      solvedAt: Date.now()
    },
    subredditName: subredditName,
    title: postTitle,
  });
};

/**
 * Create a post for special events
 */
export const createEventPost = async (
  eventType: 'milestone' | 'leaderboard' | 'narrative',
  eventData: any,
  customTitle?: string
) => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  // Generate event splash screen
  const splashConfig = SplashScreenService.generateEventSplash(eventType, eventData);
  
  // Validate splash configuration
  const validation = SplashScreenService.validateSplashConfig(splashConfig);
  if (!validation.isValid) {
    console.error('Invalid event splash configuration:', validation.errors);
    throw new Error(`Event splash configuration invalid: ${validation.errors.join(', ')}`);
  }

  // Generate default titles if not provided
  const defaultTitles = {
    milestone: '🎉 Community Milestone Achieved!',
    leaderboard: `👑 New Champion: ${eventData?.username || 'Unknown'}`,
    narrative: '📖 Story Fragment Unlocked'
  };

  const postTitle = customTitle || defaultTitles[eventType];

  return await reddit.submitCustomPost({
    splash: splashConfig,
    postData: {
      gameState: 'event',
      eventType,
      eventData,
      createdAt: Date.now()
    },
    subredditName: subredditName,
    title: postTitle,
  });
};

/**
 * Create a teaser post for upcoming cipher (15 minutes before activation)
 */
export const createTeaserPost = async (cipher: Cipher) => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  // Create teaser splash with limited information
  const splashConfig = {
    appDisplayName: '2701',
    backgroundUri: 'vault-background.svg',
    buttonLabel: 'Prepare for Entry',
    description: `${cipher.difficulty} cipher incoming • Activates in 15 minutes • "${cipher.hint}"`,
    heading: 'Incoming Transmission',
    appIconUri: 'cicada-icon.svg'
  };

  return await reddit.submitCustomPost({
    splash: splashConfig,
    postData: {
      gameState: 'cipher_teaser',
      cipherActive: false,
      cipherId: cipher.id,
      difficulty: cipher.difficulty,
      hint: cipher.hint,
      activatesAt: cipher.createdAt
    },
    subredditName: subredditName,
    title: `⚡ Incoming ${cipher.difficulty} Cipher: "${cipher.hint}"`,
  });
};
