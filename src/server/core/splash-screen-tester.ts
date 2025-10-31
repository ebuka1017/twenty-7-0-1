import { SplashScreenService, SplashScreenConfig } from './splash-screen.js';
import { Cipher } from '../../shared/types/cipher.js';

/**
 * Testing utilities for splash screen configurations
 */
export class SplashScreenTester {
  
  /**
   * Test all splash screen variants for a cipher
   */
  static testCipherSplashScreens(cipher: Cipher): {
    results: Array<{
      variant: string;
      config: SplashScreenConfig;
      validation: { isValid: boolean; errors: string[] };
      assetValidation: { isValid: boolean; errors: string[]; warnings: string[] };
    }>;
    summary: {
      totalVariants: number;
      validVariants: number;
      commonIssues: string[];
    };
  } {
    const results = [];
    const commonIssues: string[] = [];
    
    // Test main cipher splash
    const mainConfig = SplashScreenService.generateCipherSplash(cipher);
    const mainValidation = SplashScreenService.validateSplashConfig(mainConfig);
    const mainAssetValidation = this.validateAssets(mainConfig);
    
    results.push({
      variant: 'main',
      config: mainConfig,
      validation: mainValidation,
      assetValidation: mainAssetValidation
    });
    
    // Test splash variants
    const variants = SplashScreenService.generateSplashVariants(cipher);
    variants.forEach((config, index) => {
      const validation = SplashScreenService.validateSplashConfig(config);
      const assetValidation = this.validateAssets(config);
      
      results.push({
        variant: `variant-${index}`,
        config,
        validation,
        assetValidation
      });
    });
    
    // Collect common issues
    results.forEach(result => {
      if (!result.validation.isValid) {
        result.validation.errors.forEach(error => {
          if (!commonIssues.includes(error)) {
            commonIssues.push(error);
          }
        });
      }
      if (!result.assetValidation.isValid) {
        result.assetValidation.errors.forEach(error => {
          if (!commonIssues.includes(error)) {
            commonIssues.push(error);
          }
        });
      }
    });
    
    const validVariants = results.filter(r => r.validation.isValid && r.assetValidation.isValid).length;
    
    return {
      results,
      summary: {
        totalVariants: results.length,
        validVariants,
        commonIssues
      }
    };
  }
  
  /**
   * Test solution splash screen
   */
  static testSolutionSplash(cipher: Cipher, winner?: { username: string; content: string }): {
    config: SplashScreenConfig;
    validation: { isValid: boolean; errors: string[] };
    assetValidation: { isValid: boolean; errors: string[]; warnings: string[] };
  } {
    const config = SplashScreenService.generateSolutionSplash(cipher, winner);
    const validation = SplashScreenService.validateSplashConfig(config);
    const assetValidation = this.validateAssets(config);
    
    return {
      config,
      validation,
      assetValidation
    };
  }
  
  /**
   * Test event splash screens
   */
  static testEventSplashes(): {
    results: Array<{
      eventType: string;
      config: SplashScreenConfig;
      validation: { isValid: boolean; errors: string[] };
      assetValidation: { isValid: boolean; errors: string[]; warnings: string[] };
    }>;
  } {
    const eventTypes: Array<'milestone' | 'leaderboard' | 'narrative'> = ['milestone', 'leaderboard', 'narrative'];
    const results: Array<{
      eventType: string;
      config: SplashScreenConfig;
      validation: { isValid: boolean; errors: string[] };
      assetValidation: { isValid: boolean; errors: string[]; warnings: string[] };
    }> = [];
    
    eventTypes.forEach(eventType => {
      const testData = this.getTestEventData(eventType);
      const config = SplashScreenService.generateEventSplash(eventType, testData);
      const validation = SplashScreenService.validateSplashConfig(config);
      const assetValidation = this.validateAssets(config);
      
      results.push({
        eventType,
        config,
        validation,
        assetValidation
      });
    });
    
    return { results };
  }
  
  /**
   * Validate splash screen assets
   */
  private static validateAssets(config: SplashScreenConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if assets exist (simplified check)
    if (config.backgroundUri && !config.backgroundUri.startsWith('data:')) {
      if (!config.backgroundUri.endsWith('.svg') && !config.backgroundUri.endsWith('.png')) {
        errors.push(`Background asset "${config.backgroundUri}" should be SVG or PNG format`);
      }
    }
    
    if (config.appIconUri && !config.appIconUri.startsWith('data:')) {
      if (!config.appIconUri.endsWith('.svg') && !config.appIconUri.endsWith('.png')) {
        errors.push(`App icon "${config.appIconUri}" should be SVG or PNG format`);
      }
    }
    
    // Check for cyberpunk theme consistency
    if (!config.heading.toLowerCase().includes('vault') && 
        !config.heading.toLowerCase().includes('cipher') &&
        !config.heading.toLowerCase().includes('2701')) {
      warnings.push('Heading may not align with cyberpunk vault theme');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get test data for different event types
   */
  private static getTestEventData(eventType: 'milestone' | 'leaderboard' | 'narrative'): any {
    switch (eventType) {
      case 'milestone':
        return { milestone: '1000 ciphers solved', count: 1000 };
      case 'leaderboard':
        return { username: 'TestSolver', score: 2500, rank: 1 };
      case 'narrative':
        return { fragmentId: 'test-fragment', title: 'The First Clue' };
      default:
        return {};
    }
  }
  
  /**
   * Generate comprehensive test report
   */
  static generateTestReport(cipher: Cipher): {
    cipherTests: ReturnType<typeof SplashScreenTester.testCipherSplashScreens>;
    solutionTests: {
      withWinner: ReturnType<typeof SplashScreenTester.testSolutionSplash>;
      withoutWinner: ReturnType<typeof SplashScreenTester.testSolutionSplash>;
    };
    eventTests: ReturnType<typeof SplashScreenTester.testEventSplashes>;
    overallScore: {
      totalTests: number;
      passedTests: number;
      score: number; // 0-100
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
    };
    recommendations: string[];
  } {
    // Run all tests
    const cipherTests = this.testCipherSplashScreens(cipher);
    const solutionWithWinner = this.testSolutionSplash(cipher, { username: 'TestWinner', content: 'Test solution' });
    const solutionWithoutWinner = this.testSolutionSplash(cipher);
    const eventTests = this.testEventSplashes();
    
    // Calculate overall score
    const allTests: Array<{
      validation: { isValid: boolean; errors: string[] };
      assetValidation: { isValid: boolean; errors: string[]; warnings: string[] };
    }> = [
      ...cipherTests.results,
      solutionWithWinner,
      solutionWithoutWinner,
      ...eventTests.results
    ];
    
    const totalTests = allTests.length;
    const passedTests = allTests.filter(test => 
      test.validation.isValid && test.assetValidation.isValid
    ).length;
    
    const score = Math.round((passedTests / totalTests) * 100);
    
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (cipherTests.summary.validVariants < cipherTests.summary.totalVariants) {
      recommendations.push('Fix cipher splash screen validation errors');
    }
    
    if (!solutionWithWinner.validation.isValid || !solutionWithoutWinner.validation.isValid) {
      recommendations.push('Fix solution splash screen configuration');
    }
    
    const failedEventTests = eventTests.results.filter(r => !r.validation.isValid);
    if (failedEventTests.length > 0) {
      recommendations.push(`Fix event splash screens: ${failedEventTests.map(t => t.eventType).join(', ')}`);
    }
    
    if (score < 90) {
      recommendations.push('Review asset optimization guidelines');
      recommendations.push('Ensure all splash screens follow cyberpunk theme');
    }
    
    return {
      cipherTests,
      solutionTests: {
        withWinner: solutionWithWinner,
        withoutWinner: solutionWithoutWinner
      },
      eventTests,
      overallScore: {
        totalTests,
        passedTests,
        score,
        grade
      },
      recommendations
    };
  }
  
  /**
   * Test splash screen performance characteristics
   */
  static testPerformance(config: SplashScreenConfig): {
    loadTime: 'fast' | 'medium' | 'slow';
    mobileOptimized: boolean;
    accessibilityScore: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let loadTime: 'fast' | 'medium' | 'slow' = 'fast';
    let mobileOptimized = true;
    let accessibilityScore = 100;
    
    // Estimate load time based on content
    const contentLength = JSON.stringify(config).length;
    if (contentLength > 2000) {
      loadTime = 'slow';
      recommendations.push('Reduce splash screen content size');
    } else if (contentLength > 1000) {
      loadTime = 'medium';
    }
    
    // Check mobile optimization
    if (config.description && config.description.length > 150) {
      mobileOptimized = false;
      accessibilityScore -= 20;
      recommendations.push('Shorten description for mobile readability');
    }
    
    if (config.heading && config.heading.length > 50) {
      mobileOptimized = false;
      accessibilityScore -= 15;
      recommendations.push('Shorten heading for mobile display');
    }
    
    // Check accessibility
    if (config.buttonLabel && config.buttonLabel.length < 3) {
      accessibilityScore -= 25;
      recommendations.push('Button label should be more descriptive');
    }
    
    return {
      loadTime,
      mobileOptimized,
      accessibilityScore: Math.max(0, accessibilityScore),
      recommendations
    };
  }
}