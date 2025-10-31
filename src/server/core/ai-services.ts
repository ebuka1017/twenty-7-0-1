import { Cipher, BreadcrumbMetadata } from '../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from './config.js';

// Theme dictionaries for each category
const THEME_DICTIONARIES = {
  privacy: [
    'ECPA', 'surveillance', 'encryption', 'digital privacy', 'data protection',
    'wiretapping', 'electronic communications', 'privacy rights', 'GDPR',
    'personal data', 'anonymity', 'metadata', 'tracking', 'cookies'
  ],
  auditing: [
    'PCAOB', 'SOX', 'compliance', 'financial auditing', 'internal controls',
    'audit evidence', 'materiality', 'risk assessment', 'audit procedures',
    'independence', 'professional skepticism', 'audit opinion', 'GAAS'
  ],
  patents: [
    'USPTO', 'prior art', 'claims', 'intellectual property', 'patent law',
    'invention', 'novelty', 'non-obviousness', 'utility', 'patent search',
    'patent prosecution', 'patent litigation', 'patent portfolio'
  ]
};

export interface EventData {
  title: string;
  summary: string;
  url: string;
  timestamp: string;
  thematicCategory: 'privacy' | 'auditing' | 'patents';
  relevanceScore: number;
}

export interface CipherGenerationRequest {
  event: EventData;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  format: 'text' | 'image' | 'audio';
}

export class PerplexityService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ConfigService.getPerplexityApiKey() || '';
  }

  async fetchRecentEvents(theme: 'privacy' | 'auditing' | 'patents'): Promise<EventData[]> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const searchQueries = {
      privacy: "ECPA digital privacy surveillance encryption recent news",
      auditing: "PCAOB SOX financial auditing compliance recent news", 
      patents: "USPTO patent law intellectual property recent news"
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant that finds recent news events. Return results in JSON format with title, summary, url, and timestamp fields.'
            },
            {
              role: 'user',
              content: `Find 3 recent news events related to: ${searchQueries[theme]}. Focus on events from the past week. Return as JSON array.`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Perplexity API');
      }

      // Parse JSON response and validate
      const events = JSON.parse(content);
      return events.map((event: any) => ({
        title: event.title || 'Untitled Event',
        summary: event.summary || event.description || 'No summary available',
        url: event.url || '#',
        timestamp: event.timestamp || new Date().toISOString(),
        thematicCategory: theme,
        relevanceScore: this.calculateRelevanceScore(event.summary || '', theme)
      }));

    } catch (error) {
      console.error('Perplexity API error:', error);
      throw error;
    }
  }

  private calculateRelevanceScore(text: string, theme: 'privacy' | 'auditing' | 'patents'): number {
    const keywords = THEME_DICTIONARIES[theme];
    const textLower = text.toLowerCase();
    
    let matches = 0;
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    
    return Math.min(matches / keywords.length, 1.0);
  }
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ConfigService.getGeminiApiKey() || '';
  }

  async generateCipher(request: CipherGenerationRequest): Promise<Cipher> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildCipherPrompt(request);

    try {
      const response = await fetch(`${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      return this.parseCipherResponse(content, request);

    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private buildCipherPrompt(request: CipherGenerationRequest): string {
    const { event, difficulty, format } = request;
    
    const difficultyInstructions = {
      Easy: "Create a simple cipher using basic techniques like Caesar cipher, ROT13, or Atbash. Should be solvable in 1-2 steps.",
      Medium: "Create a moderate cipher using techniques like Vigenère cipher, book cipher, or polyalphabetic substitution. Should require 3-4 steps to solve.",
      Hard: "Create a complex cipher using advanced techniques like RSA, multi-layer encryption, or steganography. Should require 5+ steps and advanced knowledge."
    };

    const formatInstructions = {
      text: "Create a text-based cipher with the encrypted message clearly displayed.",
      image: "Create a cipher that would be embedded in an image using steganography or visual patterns.",
      audio: "Create a cipher that would be embedded in audio using Morse code, frequency analysis, or spectrograms."
    };

    return `Create a ${difficulty.toLowerCase()} cryptographic cipher based on this recent event: "${event.title}" - ${event.summary}

The cipher should incorporate themes from ${event.thematicCategory} and be solvable by a community of puzzle enthusiasts.

Difficulty: ${difficulty} - ${difficultyInstructions[difficulty]}
Format: ${format} - ${formatInstructions[format]}

Requirements:
1. Include a cryptic hint (max 50 characters)
2. The solution should be a single word or short phrase related to the event
3. Embed thematic keywords from ${event.thematicCategory}
4. Make it challenging but fair for the specified difficulty level

Return your response in this exact JSON format:
{
  "title": "Descriptive title for the cipher",
  "hint": "Cryptic hint (max 50 chars)",
  "content": "The actual cipher content",
  "solution": "The solution word/phrase",
  "explanation": "Brief explanation of how to solve it"
}`;
  }

  private parseCipherResponse(content: string, request: CipherGenerationRequest): Cipher {
    try {
      // Extract JSON from the response (Gemini sometimes includes extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.title || !parsed.hint || !parsed.content || !parsed.solution) {
        throw new Error('Missing required fields in Gemini response');
      }

      const now = Date.now();
      const timeLimit = this.getTimeLimitForDifficulty(request.difficulty);

      // Generate breadcrumb metadata
      const breadcrumbData: BreadcrumbMetadata = {
        narrative_thread_id: uuidv4(),
        connection_weight: this.calculateConnectionWeight(request.event.relevanceScore),
        thematic_category: request.event.thematicCategory,
        cipher_source_event: request.event.title,
        unlock_threshold: 50
      };

      return {
        id: uuidv4(),
        title: parsed.title.substring(0, 100), // Limit title length
        hint: parsed.hint.substring(0, 50), // Enforce hint length limit
        solution: parsed.solution.toUpperCase().trim(),
        difficulty: request.difficulty,
        format: request.format,
        content: parsed.content,
        timeLimit,
        createdAt: now,
        expiresAt: now + (timeLimit * 60 * 60 * 1000), // Convert hours to milliseconds
        isActive: true,
        sourceEvent: `${request.event.title} - ${request.event.url}`,
        breadcrumbData
      };

    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse cipher from Gemini response');
    }
  }

  private getTimeLimitForDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): number {
    const timeLimits = {
      Easy: 3,
      Medium: 4,
      Hard: 5
    };
    return timeLimits[difficulty];
  }

  private calculateConnectionWeight(relevanceScore: number): number {
    // Convert relevance score (0-1) to connection weight (0.1-1.0)
    return Math.max(0.1, Math.min(1.0, relevanceScore));
  }
}

// Cipher validation service
export class CipherValidationService {
  static validateGeneratedCipher(cipher: Cipher): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic field validation
    if (!cipher.title || cipher.title.length === 0) {
      errors.push('Title is required');
    }
    if (!cipher.hint || cipher.hint.length === 0) {
      errors.push('Hint is required');
    }
    if (cipher.hint && cipher.hint.length > 50) {
      errors.push('Hint must be 50 characters or less');
    }
    if (!cipher.solution || cipher.solution.length === 0) {
      errors.push('Solution is required');
    }
    if (!cipher.content || cipher.content.length === 0) {
      errors.push('Content is required');
    }

    // Difficulty validation
    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    if (!validDifficulties.includes(cipher.difficulty)) {
      errors.push('Invalid difficulty level');
    }

    // Format validation
    const validFormats = ['text', 'image', 'audio'];
    if (!validFormats.includes(cipher.format)) {
      errors.push('Invalid format');
    }

    // Time limit validation
    const expectedTimeLimits = { Easy: 3, Medium: 4, Hard: 5 };
    if (cipher.timeLimit !== expectedTimeLimits[cipher.difficulty]) {
      errors.push('Invalid time limit for difficulty level');
    }

    // Breadcrumb validation
    if (cipher.breadcrumbData) {
      const validCategories = ['privacy', 'auditing', 'patents'];
      if (!validCategories.includes(cipher.breadcrumbData.thematic_category)) {
        errors.push('Invalid thematic category in breadcrumb data');
      }
      if (cipher.breadcrumbData.connection_weight < 0.1 || cipher.breadcrumbData.connection_weight > 1.0) {
        errors.push('Connection weight must be between 0.1 and 1.0');
      }
    }

    // Content quality checks
    if (cipher.solution.length > 50) {
      errors.push('Solution is too long (max 50 characters)');
    }

    // Check for potential duplicates by comparing solution hash
    // This would be enhanced with actual duplicate detection in production
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static assignDifficulty(content: string, solution: string): 'Easy' | 'Medium' | 'Hard' {
    let complexity = 0;

    // Analyze cipher complexity
    if (content.includes(' ')) complexity += 1; // Multiple words
    if (/[0-9]/.test(content)) complexity += 1; // Contains numbers
    if (content.length > 50) complexity += 1; // Long content
    if (solution.length > 10) complexity += 1; // Long solution
    if (/[^a-zA-Z0-9\s]/.test(content)) complexity += 2; // Special characters

    // Detect cipher types (simplified)
    if (content.match(/^[01\s]+$/)) complexity += 2; // Binary
    if (content.match(/^[A-F0-9\s]+$/i) && content.length > 10) complexity += 2; // Hex
    if (content.includes('.-') || content.includes('-.')) complexity += 2; // Morse code

    if (complexity <= 2) return 'Easy';
    if (complexity <= 4) return 'Medium';
    return 'Hard';
  }
}
