import { Cipher } from '../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';

// Pre-generated fallback ciphers for when AI APIs fail
export const FALLBACK_CIPHERS: Omit<Cipher, 'id' | 'createdAt' | 'expiresAt' | 'isActive'>[] = [
  {
    title: "Digital Privacy Cipher #1",
    hint: "Caesar's shift in the digital age",
    solution: "ENCRYPTION",
    difficulty: "Easy",
    format: "text",
    content: "HQFUBSWLRQ",
    timeLimit: 3,
    sourceEvent: "Recent ECPA privacy legislation discussion",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.8,
      thematic_category: "privacy",
      cipher_source_event: "ECPA privacy legislation",
      unlock_threshold: 50
    }
  },
  {
    title: "Audit Trail Mystery",
    hint: "Follow the money, backwards",
    solution: "COMPLIANCE",
    difficulty: "Medium",
    format: "text", 
    content: "ECNAILPMOC",
    timeLimit: 4,
    sourceEvent: "PCAOB audit standards update",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.7,
      thematic_category: "auditing",
      cipher_source_event: "PCAOB standards update",
      unlock_threshold: 50
    }
  },
  {
    title: "Patent Puzzle",
    hint: "Base64 encoding of innovation",
    solution: "INVENTION",
    difficulty: "Easy",
    format: "text",
    content: "SU5WRU5USU9O",
    timeLimit: 3,
    sourceEvent: "USPTO patent reform discussion",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.6,
      thematic_category: "patents",
      cipher_source_event: "USPTO reform discussion",
      unlock_threshold: 50
    }
  },
  {
    title: "Surveillance State",
    hint: "Atbash cipher from ancient times",
    solution: "PRIVACY",
    difficulty: "Medium",
    format: "text",
    content: "KIREZBX",
    timeLimit: 4,
    sourceEvent: "Digital surveillance legislation debate",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.9,
      thematic_category: "privacy",
      cipher_source_event: "Surveillance legislation debate",
      unlock_threshold: 50
    }
  },
  {
    title: "Financial Controls",
    hint: "ROT13 for the modern auditor",
    solution: "OVERSIGHT",
    difficulty: "Easy",
    format: "text",
    content: "BIREFVTUG",
    timeLimit: 3,
    sourceEvent: "SOX compliance requirements update",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.5,
      thematic_category: "auditing",
      cipher_source_event: "SOX compliance update",
      unlock_threshold: 50
    }
  },
  {
    title: "Intellectual Property Lock",
    hint: "Vigenère with key 'USPTO'",
    solution: "INNOVATION",
    difficulty: "Hard",
    format: "text",
    content: "CJJSPMFCSR",
    timeLimit: 5,
    sourceEvent: "Patent litigation landmark case",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.8,
      thematic_category: "patents",
      cipher_source_event: "Patent litigation case",
      unlock_threshold: 50
    }
  },
  {
    title: "Data Protection Protocol",
    hint: "Binary to ASCII conversion",
    solution: "SECURITY",
    difficulty: "Medium",
    format: "text",
    content: "01010011 01000101 01000011 01010101 01010010 01001001 01010100 01011001",
    timeLimit: 4,
    sourceEvent: "GDPR enforcement action",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.7,
      thematic_category: "privacy",
      cipher_source_event: "GDPR enforcement",
      unlock_threshold: 50
    }
  },
  {
    title: "Audit Evidence Chain",
    hint: "Morse code for accountants",
    solution: "EVIDENCE",
    difficulty: "Medium",
    format: "text",
    content: ". ...- .. -.. . -. -.-. .",
    timeLimit: 4,
    sourceEvent: "Audit evidence standards revision",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.6,
      thematic_category: "auditing",
      cipher_source_event: "Evidence standards revision",
      unlock_threshold: 50
    }
  },
  {
    title: "Prior Art Discovery",
    hint: "Hexadecimal encoding",
    solution: "RESEARCH",
    difficulty: "Easy",
    format: "text",
    content: "52455345415243",
    timeLimit: 3,
    sourceEvent: "Patent search algorithm improvement",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.4,
      thematic_category: "patents",
      cipher_source_event: "Search algorithm improvement",
      unlock_threshold: 50
    }
  },
  {
    title: "Encrypted Communications",
    hint: "Playfair cipher with key 'CICADA'",
    solution: "ANONYMOUS",
    difficulty: "Hard",
    format: "text",
    content: "BMPMXNQVR",
    timeLimit: 5,
    sourceEvent: "Encrypted messaging app court case",
    breadcrumbData: {
      narrative_thread_id: uuidv4(),
      connection_weight: 0.9,
      thematic_category: "privacy",
      cipher_source_event: "Messaging app court case",
      unlock_threshold: 50
    }
  }
];

export function getRandomFallbackCipher(): Cipher {
  const template = FALLBACK_CIPHERS[Math.floor(Math.random() * FALLBACK_CIPHERS.length)];
  if (!template) {
    throw new Error('No fallback ciphers available');
  }
  
  const now = Date.now();
  
  return {
    id: uuidv4(),
    title: template.title,
    hint: template.hint,
    solution: template.solution,
    difficulty: template.difficulty,
    format: template.format,
    content: template.content,
    contentUrl: template.contentUrl,
    timeLimit: template.timeLimit,
    createdAt: now,
    expiresAt: now + (template.timeLimit * 60 * 60 * 1000), // Convert hours to milliseconds
    isActive: true,
    sourceEvent: template.sourceEvent,
    breadcrumbData: template.breadcrumbData
  };
}

export function getFallbackCipherPool(count: number = 10): Cipher[] {
  const ciphers: Cipher[] = [];
  const usedIndices = new Set<number>();
  
  while (ciphers.length < count && usedIndices.size < FALLBACK_CIPHERS.length) {
    let index = Math.floor(Math.random() * FALLBACK_CIPHERS.length);
    
    // Ensure we don't duplicate ciphers in the same pool
    while (usedIndices.has(index)) {
      index = (index + 1) % FALLBACK_CIPHERS.length;
    }
    
    usedIndices.add(index);
    const template = FALLBACK_CIPHERS[index];
    if (!template) continue;
    
    const now = Date.now();
    
    ciphers.push({
      id: uuidv4(),
      title: template.title,
      hint: template.hint,
      solution: template.solution,
      difficulty: template.difficulty,
      format: template.format,
      content: template.content,
      contentUrl: template.contentUrl,
      timeLimit: template.timeLimit,
      createdAt: now,
      expiresAt: now + (template.timeLimit * 60 * 60 * 1000),
      isActive: true,
      sourceEvent: template.sourceEvent,
      breadcrumbData: template.breadcrumbData
    });
  }
  
  return ciphers;
}
