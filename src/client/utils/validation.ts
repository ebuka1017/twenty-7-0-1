// Client-side validation utilities
export class ClientValidation {
  
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
}