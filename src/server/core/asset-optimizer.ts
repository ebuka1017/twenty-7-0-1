/**
 * Asset optimization utilities for splash screens
 */
export class AssetOptimizer {
  
  /**
   * Validate SVG asset size and format
   */
  static validateSVGAsset(svgContent: string, maxSizeKB: number = 2048): {
    isValid: boolean;
    sizeKB: number;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Calculate size
    const sizeBytes = new TextEncoder().encode(svgContent).length;
    const sizeKB = Math.round(sizeBytes / 1024);
    
    // Check size limit
    if (sizeKB > maxSizeKB) {
      errors.push(`SVG size ${sizeKB}KB exceeds limit of ${maxSizeKB}KB`);
    }
    
    // Check for SVG structure
    if (!svgContent.includes('<svg')) {
      errors.push('Invalid SVG format - missing <svg> tag');
    }
    
    if (!svgContent.includes('</svg>')) {
      errors.push('Invalid SVG format - missing closing </svg> tag');
    }
    
    // Check for viewBox (recommended for responsive design)
    if (!svgContent.includes('viewBox')) {
      warnings.push('SVG missing viewBox attribute - may not scale properly');
    }
    
    // Check for excessive complexity
    const pathCount = (svgContent.match(/<path/g) || []).length;
    if (pathCount > 100) {
      warnings.push(`High path count (${pathCount}) may impact performance`);
    }
    
    // Check for embedded images (not recommended)
    if (svgContent.includes('<image') || svgContent.includes('data:image')) {
      warnings.push('Embedded images in SVG may increase file size significantly');
    }
    
    // Check for animations (may not work in all contexts)
    if (svgContent.includes('<animate') || svgContent.includes('<animateTransform')) {
      warnings.push('SVG animations may not work in all Reddit contexts');
    }
    
    return {
      isValid: errors.length === 0,
      sizeKB,
      errors,
      warnings
    };
  }
  
  /**
   * Generate optimized SVG recommendations
   */
  static generateOptimizationTips(svgContent: string): string[] {
    const tips: string[] = [];
    
    // Check for common optimization opportunities
    if (svgContent.includes('stroke-width="1"')) {
      tips.push('Consider using default stroke-width to reduce file size');
    }
    
    if (svgContent.includes('fill="none"')) {
      tips.push('Use CSS classes instead of inline fill="none" for repeated styles');
    }
    
    if (svgContent.includes('transform=')) {
      tips.push('Consider simplifying transforms or using CSS transforms');
    }
    
    if (svgContent.includes('<!--')) {
      tips.push('Remove comments to reduce file size');
    }
    
    if (svgContent.includes('  ') || svgContent.includes('\n')) {
      tips.push('Minify SVG by removing unnecessary whitespace');
    }
    
    if (svgContent.includes('xmlns:')) {
      tips.push('Remove unused XML namespaces');
    }
    
    return tips;
  }
  
  /**
   * Check asset dimensions for different use cases
   */
  static validateAssetDimensions(
    width: number, 
    height: number, 
    assetType: 'background' | 'icon'
  ): { isValid: boolean; recommendations: string[] } {
    const recommendations: string[] = [];
    let isValid = true;
    
    if (assetType === 'background') {
      // Background should be 1920x1080 (16:9 aspect ratio)
      const expectedRatio = 16 / 9;
      const actualRatio = width / height;
      
      if (Math.abs(actualRatio - expectedRatio) > 0.1) {
        recommendations.push(`Background aspect ratio should be 16:9 (current: ${actualRatio.toFixed(2)}:1)`);
        isValid = false;
      }
      
      if (width < 1920 || height < 1080) {
        recommendations.push('Background should be at least 1920x1080 for HD displays');
      }
      
      if (width > 3840 || height > 2160) {
        recommendations.push('Background larger than 4K may be unnecessarily large');
      }
      
    } else if (assetType === 'icon') {
      // Icon should be square and at least 512x512
      if (width !== height) {
        recommendations.push('App icon should be square (equal width and height)');
        isValid = false;
      }
      
      if (width < 512 || height < 512) {
        recommendations.push('App icon should be at least 512x512 for crisp display');
        isValid = false;
      }
      
      if (width > 1024 || height > 1024) {
        recommendations.push('App icon larger than 1024x1024 may be unnecessarily large');
      }
    }
    
    return { isValid, recommendations };
  }
  
  /**
   * Generate color palette recommendations for cyberpunk theme
   */
  static getCyberpunkColorPalette(): {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
    text: string[];
  } {
    return {
      primary: ['#00ff88', '#00cc6a', '#00aa55'], // Neon green variants
      secondary: ['#ff6b6b', '#ff5555', '#ff4444'], // Warning red variants
      accent: ['#f59e0b', '#e59400', '#cc8400'], // Amber variants
      background: ['#1a1a1a', '#2d2d2d', '#404040'], // Dark grays
      text: ['#ffffff', '#e0e0e0', '#a0a0a0'] // Light grays
    };
  }
  
  /**
   * Validate color contrast for accessibility
   */
  static validateColorContrast(foreground: string, background: string): {
    ratio: number;
    isAACompliant: boolean;
    isAAACompliant: boolean;
  } {
    // Simplified contrast calculation (in production, use a proper library)
    // This is a placeholder implementation
    const getLuminance = (color: string): number => {
      // Convert hex to RGB and calculate relative luminance
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const sRGB = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };
    
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      isAACompliant: ratio >= 4.5,
      isAAACompliant: ratio >= 7
    };
  }
  
  /**
   * Generate asset performance report
   */
  static generateAssetReport(assets: { name: string; sizeKB: number; type: string }[]): {
    totalSizeKB: number;
    recommendations: string[];
    performance: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const totalSizeKB = assets.reduce((sum, asset) => sum + asset.sizeKB, 0);
    const recommendations: string[] = [];
    
    // Performance thresholds
    let performance: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    
    if (totalSizeKB > 5000) {
      performance = 'poor';
      recommendations.push('Total asset size exceeds 5MB - consider optimization');
    } else if (totalSizeKB > 3000) {
      performance = 'fair';
      recommendations.push('Total asset size over 3MB - optimization recommended');
    } else if (totalSizeKB > 1000) {
      performance = 'good';
      recommendations.push('Asset size is reasonable but could be optimized further');
    }
    
    // Check individual assets
    assets.forEach(asset => {
      if (asset.type === 'background' && asset.sizeKB > 2000) {
        recommendations.push(`Background "${asset.name}" is large (${asset.sizeKB}KB)`);
      }
      if (asset.type === 'icon' && asset.sizeKB > 500) {
        recommendations.push(`Icon "${asset.name}" is large (${asset.sizeKB}KB)`);
      }
    });
    
    return {
      totalSizeKB,
      recommendations,
      performance
    };
  }
}