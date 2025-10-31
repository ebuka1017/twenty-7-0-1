import { UserProfile, UserTitle, USER_TITLES, TitleName } from '../../shared/types/index.js';

export class UserService {
  
  /**
   * Calculate user title based on solves and rally accuracy
   */
  static calculateTitle(solvesCount: number, rallyAccuracy: number): TitleName {
    // Check titles in descending order of requirements
    if (solvesCount >= USER_TITLES.CIPHER_SAGE.requirements.solves && 
        rallyAccuracy >= USER_TITLES.CIPHER_SAGE.requirements.rally_accuracy) {
      return 'CIPHER_SAGE';
    }
    
    if (solvesCount >= USER_TITLES.MASTER_LOCKSMITH.requirements.solves && 
        rallyAccuracy >= USER_TITLES.MASTER_LOCKSMITH.requirements.rally_accuracy) {
      return 'MASTER_LOCKSMITH';
    }
    
    if (solvesCount >= USER_TITLES.LOCKSMITH.requirements.solves && 
        rallyAccuracy >= USER_TITLES.LOCKSMITH.requirements.rally_accuracy) {
      return 'LOCKSMITH';
    }
    
    return 'APPRENTICE';
  }

  /**
   * Calculate total score for leaderboard ranking
   */
  static calculateTotalScore(profile: UserProfile): number {
    const { difficulty_breakdown } = profile;
    
    // Base score: easy*1 + medium*3 + hard*5
    const baseScore = (difficulty_breakdown.easy * 1) + 
                     (difficulty_breakdown.medium * 3) + 
                     (difficulty_breakdown.hard * 5);
    
    // Speed bonus: faster average solve time = higher bonus (max 10 points)
    const avgSolveMinutes = profile.avg_solve_time_seconds / 60;
    const speedBonus = Math.max(0, Math.min(10, 10 - (avgSolveMinutes / 30)));
    
    // Rally bonus: higher accuracy = higher bonus (max 15 points)
    const rallyBonus = Math.floor((profile.rally_accuracy_percentage / 100) * 15);
    
    return Math.floor(baseScore + speedBonus + rallyBonus);
  }

  /**
   * Calculate individual score components for display
   */
  static calculateScoreBreakdown(profile: UserProfile): {
    baseScore: number;
    speedBonus: number;
    rallyBonus: number;
    totalScore: number;
  } {
    const { difficulty_breakdown } = profile;
    
    const baseScore = (difficulty_breakdown.easy * 1) + 
                     (difficulty_breakdown.medium * 3) + 
                     (difficulty_breakdown.hard * 5);
    
    const avgSolveMinutes = profile.avg_solve_time_seconds / 60;
    const speedBonus = Math.max(0, Math.min(10, 10 - (avgSolveMinutes / 30)));
    
    const rallyBonus = Math.floor((profile.rally_accuracy_percentage / 100) * 15);
    
    return {
      baseScore,
      speedBonus: Math.floor(speedBonus),
      rallyBonus,
      totalScore: Math.floor(baseScore + speedBonus + rallyBonus)
    };
  }

  /**
   * Check if user has earned a new title
   */
  static checkForNewTitle(profile: UserProfile): UserTitle | null {
    const currentTitle = this.calculateTitle(profile.solves_count, profile.rally_accuracy_percentage);
    
    // Check if user already has this title
    const hasTitle = profile.titles.some(title => title.name === USER_TITLES[currentTitle].name);
    
    if (!hasTitle) {
      return {
        name: USER_TITLES[currentTitle].name,
        earned_at: Date.now(),
        requirements_met: [
          `${profile.solves_count} solves`,
          `${profile.rally_accuracy_percentage}% rally accuracy`
        ]
      };
    }
    
    return null;
  }

  /**
   * Get user's highest title
   */
  static getHighestTitle(profile: UserProfile): string {
    if (profile.titles.length === 0) {
      return USER_TITLES.APPRENTICE.name;
    }
    
    // Find the highest title based on requirements
    const titleNames = profile.titles.map(t => t.name);
    
    if (titleNames.includes(USER_TITLES.CIPHER_SAGE.name)) return USER_TITLES.CIPHER_SAGE.name;
    if (titleNames.includes(USER_TITLES.MASTER_LOCKSMITH.name)) return USER_TITLES.MASTER_LOCKSMITH.name;
    if (titleNames.includes(USER_TITLES.LOCKSMITH.name)) return USER_TITLES.LOCKSMITH.name;
    
    return USER_TITLES.APPRENTICE.name;
  }

  /**
   * Format time duration for display
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get title color for display
   */
  static getTitleColor(titleName: string): string {
    switch (titleName) {
      case USER_TITLES.CIPHER_SAGE.name:
        return '#ff6b6b'; // Red for highest title
      case USER_TITLES.MASTER_LOCKSMITH.name:
        return '#f59e0b'; // Orange for master
      case USER_TITLES.LOCKSMITH.name:
        return '#00ff88'; // Green for locksmith
      default:
        return '#a0a0a0'; // Gray for apprentice
    }
  }
}