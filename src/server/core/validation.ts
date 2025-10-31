export class ValidationService {
  
  // Input sanitization
  static sanitizeInput(input: string): string {
    // Remove HTML tags and potential XSS using simple regex
    const sanitized = input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove remaining angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    
    // Trim whitespace and normalize spaces
    return sanitized.trim().replace(/\s+/g, ' ');
  }

  // Guess validation
  static validateGuess(content: string): { isValid: boolean; error?: string; sanitized?: string } {
    if (!content || content.length === 0) {
      return { isValid: false, error: 'Guess cannot be empty' };
    }

    if (content.length > 100) {
      return { isValid: false, error: 'Guess must be 100 characters or less' };
    }

    // Check for valid characters (letters, numbers, spaces only)
    const validPattern = /^[a-zA-Z0-9\s]+$/;
    if (!validPattern.test(content)) {
      return { isValid: false, error: 'Only letters, numbers, and spaces allowed' };
    }

    // Check for consecutive spaces
    if (/\s{2,}/.test(content)) {
      return { isValid: false, error: 'No consecutive spaces allowed' };
    }

    // Sanitize the content
    const sanitized = this.sanitizeInput(content);

    return { isValid: true, sanitized };
  }

  // User ID validation
  static validateUserId(userId: string): boolean {
    return typeof userId === 'string' && userId.length > 0 && userId.length < 50;
  }

  // Cipher ID validation (UUID format)
  static validateCipherId(cipherId: string): boolean {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(cipherId);
  }

  // Breadcrumb data validation
  static validateBreadcrumbData(data: any): { isValid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Breadcrumb data must be an object' };
    }

    const required = ['narrative_thread_id', 'thematic_category', 'connection_weight'];
    for (const field of required) {
      if (!(field in data)) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate thematic category
    const validCategories = ['privacy', 'auditing', 'patents'];
    if (!validCategories.includes(data.thematic_category)) {
      return { isValid: false, error: 'Invalid thematic category' };
    }

    // Validate connection weight
    if (typeof data.connection_weight !== 'number' || 
        data.connection_weight < 0.1 || 
        data.connection_weight > 1.0) {
      return { isValid: false, error: 'Connection weight must be between 0.1 and 1.0' };
    }

    // Validate UUID format for narrative_thread_id
    if (!this.validateCipherId(data.narrative_thread_id)) {
      return { isValid: false, error: 'Invalid narrative thread ID format' };
    }

    return { isValid: true };
  }

  // SQL injection pattern detection
  static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|")/,
      /(\bOR\b|\bAND\b).*?[=<>]/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS pattern detection
  static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Comprehensive input validation
  static validateAndSanitize(input: string, maxLength: number = 100): { 
    isValid: boolean; 
    sanitized?: string; 
    error?: string 
  } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Input must be a non-empty string' };
    }

    if (input.length > maxLength) {
      return { isValid: false, error: `Input must be ${maxLength} characters or less` };
    }

    if (this.containsSQLInjection(input)) {
      return { isValid: false, error: 'Invalid characters detected' };
    }

    if (this.containsXSS(input)) {
      return { isValid: false, error: 'Invalid characters detected' };
    }

    const sanitized = this.sanitizeInput(input);
    
    if (sanitized.length === 0) {
      return { isValid: false, error: 'Input cannot be empty after sanitization' };
    }

    return { isValid: true, sanitized };
  }
}
