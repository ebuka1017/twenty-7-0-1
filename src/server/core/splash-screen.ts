import { Cipher } from '../../shared/types/index.js';

export interface SplashScreenConfig {
  appDisplayName: string;
  backgroundUri: string;
  buttonLabel: string;
  description: string;
  heading: string;
  appIconUri: string;
}

export class SplashScreenService {
  
  /**
   * Generate splash screen configuration for a new cipher post
   */
  static generateCipherSplash(cipher: Cipher): SplashScreenConfig {
    const timeLimit = cipher.timeLimit === 1 ? '1 hour' : `${cipher.timeLimit} hours`;
    
    // Difficulty-specific descriptions with more engaging language
    const difficultyDescriptions = {
      Easy: 'A gateway cipher for aspiring vault breakers',
      Medium: 'A challenging puzzle requiring cryptographic insight', 
      Hard: 'An elite-level cipher for master code breakers'
    };

    // Format-specific hints
    const formatHints = {
      text: 'Decode the encrypted message',
      image: 'Uncover the hidden visual cipher',
      audio: 'Listen for the encoded frequencies'
    };

    // Create engaging description
    const description = `${difficultyDescriptions[cipher.difficulty]} • ${timeLimit} to crack • ${formatHints[cipher.format]} • "${cipher.hint}"`;

    // Generate dynamic heading based on cipher properties
    const headings = [
      'A New Cipher Has Dropped',
      'The Vault Awaits Your Skills',
      'Another Mystery Emerges',
      'Can You Break This Code?',
      'The Next Challenge Arrives'
    ];
    
    // Select heading based on cipher ID hash for consistency
    const headingIndex = parseInt(cipher.id.slice(-1), 16) % headings.length;
    const heading = headings[headingIndex] || 'A New Cipher Has Dropped';

    return {
      appDisplayName: '2701',
      backgroundUri: 'vault-background.svg',
      buttonLabel: 'Enter the Vault',
      description,
      heading,
      appIconUri: 'cicada-icon.svg'
    };
  }

  /**
   * Generate splash screen for general vault entry
   */
  static generateVaultSplash(): SplashScreenConfig {
    return {
      appDisplayName: '2701',
      backgroundUri: 'vault-background.svg',
      buttonLabel: 'Enter the Vault',
      description: 'Join the community of cipher solvers and unlock the mysteries within',
      heading: 'Welcome to the Vault',
      appIconUri: 'cicada-icon.svg'
    };
  }

  /**
   * Generate splash screen for expired cipher with solution reveal
   */
  static generateSolutionSplash(cipher: Cipher, winner?: { username: string; content: string }): SplashScreenConfig {
    const description = winner 
      ? `Solved by ${winner.username}: "${winner.content}" • Solution: ${cipher.solution}`
      : `Unsolved • Solution revealed: ${cipher.solution}`;

    return {
      appDisplayName: '2701',
      backgroundUri: 'vault-background.svg',
      buttonLabel: 'View Results',
      description,
      heading: winner ? 'Cipher Cracked!' : 'Cipher Expired',
      appIconUri: 'cicada-icon.svg'
    };
  }

  /**
   * Generate splash screen for special events or announcements
   */
  static generateEventSplash(eventType: 'milestone' | 'leaderboard' | 'narrative', customData?: any): SplashScreenConfig {
    const configs = {
      milestone: {
        heading: 'Community Milestone Reached!',
        description: 'The vault community has achieved a significant breakthrough',
        buttonLabel: 'Celebrate'
      },
      leaderboard: {
        heading: 'New Leaderboard Champion!',
        description: `${customData?.username || 'A solver'} has claimed the top position`,
        buttonLabel: 'View Rankings'
      },
      narrative: {
        heading: 'Story Fragment Unlocked',
        description: 'Enough breadcrumbs have been collected to reveal new narrative',
        buttonLabel: 'Read Fragment'
      }
    };

    const config = configs[eventType];
    
    return {
      appDisplayName: '2701',
      backgroundUri: 'vault-background.svg',
      buttonLabel: config.buttonLabel,
      description: config.description,
      heading: config.heading,
      appIconUri: 'cicada-icon.svg'
    };
  }

  /**
   * Generate post title for cipher posts
   */
  static generateCipherTitle(cipher: Cipher): string {
    // Create more engaging titles
    const titleTemplates = [
      `🔐 Cipher #{id}: "{hint}" [{difficulty}]`,
      `⚡ New {difficulty} Challenge: "{hint}"`,
      `🎯 Vault #{id}: {difficulty} Cipher Dropped`,
      `🔓 Can You Solve: "{hint}" [{difficulty}]`,
      `💎 {difficulty} Mystery: "{hint}"`
    ];

    // Select template based on cipher properties
    const templateIndex = parseInt(cipher.id.slice(-2), 16) % titleTemplates.length;
    const template = titleTemplates[templateIndex] || titleTemplates[0];
    
    if (!template) {
      throw new Error('No title template available');
    }

    return template
      .replace('{id}', cipher.id.slice(-8))
      .replace('{hint}', cipher.hint)
      .replace('{difficulty}', cipher.difficulty);
  }

  /**
   * Validate splash screen assets and configuration
   */
  static validateSplashConfig(config: SplashScreenConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!config.appDisplayName || config.appDisplayName.length === 0) {
      errors.push('App display name is required');
    }

    if (!config.heading || config.heading.length === 0) {
      errors.push('Heading is required');
    }

    if (!config.description || config.description.length === 0) {
      errors.push('Description is required');
    }

    if (!config.buttonLabel || config.buttonLabel.length === 0) {
      errors.push('Button label is required');
    }

    // Validate field lengths (Reddit limits)
    if (config.heading.length > 100) {
      errors.push('Heading must be 100 characters or less');
    }

    if (config.description.length > 300) {
      errors.push('Description must be 300 characters or less');
    }

    if (config.buttonLabel.length > 50) {
      errors.push('Button label must be 50 characters or less');
    }

    // Validate asset URIs
    if (!config.backgroundUri || !config.backgroundUri.endsWith('.svg')) {
      errors.push('Background URI must be a valid SVG file');
    }

    if (!config.appIconUri || !config.appIconUri.endsWith('.svg')) {
      errors.push('App icon URI must be a valid SVG file');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get asset optimization recommendations
   */
  static getAssetOptimizationTips(): string[] {
    return [
      'Keep background SVG under 2MB for fast loading',
      'Use optimized SVG with minimal paths and gradients',
      'Ensure 1920x1080 aspect ratio for background',
      'Keep app icon at 512x512 resolution',
      'Use web-safe colors with good contrast',
      'Test splash screens on mobile devices',
      'Compress SVG files using SVGO or similar tools',
      'Avoid complex animations in splash assets'
    ];
  }

  /**
   * Generate A/B test variants for splash screens
   */
  static generateSplashVariants(cipher: Cipher): SplashScreenConfig[] {
    const baseConfig = this.generateCipherSplash(cipher);
    
    // Create variants with different messaging
    const variants: SplashScreenConfig[] = [
      baseConfig, // Original
      {
        ...baseConfig,
        heading: 'Your Next Challenge Awaits',
        buttonLabel: 'Accept Challenge'
      },
      {
        ...baseConfig,
        heading: 'The Vault Has New Secrets',
        buttonLabel: 'Unlock Secrets'
      },
      {
        ...baseConfig,
        heading: 'Test Your Cipher Skills',
        buttonLabel: 'Prove Yourself'
      }
    ];

    return variants;
  }
}
