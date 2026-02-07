/**
 * FORTRESS ZAG - Layer 1: Perimeter Defense
 * 
 * Input sanitization and attack detection before any content enters context.
 * Blocks: Prompt injection, unicode smuggling, delimiter confusion, homograph attacks
 */

const fs = require('fs');
const path = require('path');

// Security configuration
const CONFIG = {
  // Unicode sanitization
  normalizeUnicode: true,
  removeZeroWidth: true,
  detectBidi: true,
  
  // Pattern detection
  detectPromptInjection: true,
  detectDelimiterConfusion: true,
  detectHomographs: true,
  
  // Response thresholds
  maxInputLength: 100000,
  maxNestingDepth: 10
};

// Zero-width characters to remove
const ZERO_WIDTH_CHARS = [
  '\u200B', // zero-width space
  '\u200C', // zero-width non-joiner
  '\u200D', // zero-width joiner
  '\u2060', // word joiner
  '\uFEFF', // zero-width no-break space
];

// Bidi override characters (high risk)
const BIDI_CHARS = [
  '\u202A', // LRE (left-to-right embedding)
  '\u202B', // RLE (right-to-left embedding)
  '\u202C', // PDF (pop directional formatting)
  '\u202D', // LRO (left-to-right override)
  '\u202E', // RLO (right-to-left override)
  '\u2066', // LRI (left-to-right isolate)
  '\u2067', // RLI (right-to-left isolate)
  '\u2068', // FSI (first strong isolate)
  '\u2069', // PDI (pop directional isolate)
];

// Homograph confusables (Cyrillic/Latin lookalikes)
const HOMOGRAPHS = {
  'а': 'a', // Cyrillic а (U+0430) vs Latin a (U+0061)
  'е': 'e', // Cyrillic е (U+0435) vs Latin e (U+0065)
  'о': 'o', // Cyrillic о (U+043E) vs Latin o (U+006F)
  'р': 'p', // Cyrillic р (U+0440) vs Latin p (U+0070)
  'с': 'c', // Cyrillic с (U+0441) vs Latin c (U+0063)
  'х': 'x', // Cyrillic х (U+0445) vs Latin x (U+0078)
};

// Prompt injection patterns
const INJECTION_PATTERNS = [
  // Direct override attempts
  /ignore\s+(previous|earlier|above|prior)/i,
  /forget\s+(everything|all|previous|context)/i,
  /disregard\s+(system|instructions?|prompt)/i,
  
  // System prompt manipulation
  /system\s*(override|prompt|instruction)/i,
  /you\s+are\s+now\s+/i,
  /new\s+(role|personality|mode)/i,
  
  // Authority abuse
  /administrator\s+says?/i,
  /developer\s+mode/i,
  /DAN\s*(mode|do anything now)/i,
  /jailbreak/i,
  
  // Delimiter confusion
  /```\s*system/i,
  /```\s*ignore/i,
  /<!--\s*system/i,
  /\/\/\s*system/i,
  
  // Context manipulation
  /context\s*window\s*(ignore|bypass)/i,
  /token\s*overflow/i,
  /attention\s*override/i,
];

// Dangerous delimiters that might confuse parsing
const DELIMITER_PATTERNS = [
  { pattern: /```[\s\S]*?```/, name: 'code-block' },
  { pattern: /<!--[\s\S]*?-->/, name: 'html-comment' },
  { pattern: /\/\*[\s\S]*?\*\//, name: 'c-comment' },
  { pattern: /<![\s\S]*?>/, name: 'sgml-declaration' },
];

/**
 * Sanitize input through all perimeter defenses
 */
function sanitizeInput(input, source = 'unknown') {
  const result = {
    originalLength: input.length,
    sanitized: input,
    actions: [],
    threats: [],
    blocked: false
  };
  
  // Check 1: Size limit
  if (input.length > CONFIG.maxInputLength) {
    result.threats.push({
      type: 'size-limit',
      severity: 'high',
      message: `Input exceeds max length (${input.length} > ${CONFIG.maxInputLength})`
    });
    result.blocked = true;
    return result;
  }
  
  // Check 2: Unicode normalization
  if (CONFIG.normalizeUnicode) {
    const normalized = input.normalize('NFKC');
    if (normalized !== input) {
      result.actions.push('unicode-normalized');
      result.sanitized = normalized;
    }
  }
  
  // Check 3: Zero-width character removal
  if (CONFIG.removeZeroWidth) {
    const withoutZeroWidth = removeZeroWidthChars(result.sanitized);
    if (withoutZeroWidth !== result.sanitized) {
      const removed = result.sanitized.length - withoutZeroWidth.length;
      result.actions.push(`removed-${removed}-zero-width-chars`);
      result.sanitized = withoutZeroWidth;
    }
  }
  
  // Check 4: Bidi character detection
  if (CONFIG.detectBidi) {
    const bidiFound = detectBidiChars(input);
    if (bidiFound.length > 0) {
      result.threats.push({
        type: 'bidi-override',
        severity: 'critical',
        message: `Bidi override characters detected: ${bidiFound.join(', ')}`,
        chars: bidiFound
      });
      result.blocked = true;
    }
  }
  
  // Check 5: Homograph detection
  if (CONFIG.detectHomographs) {
    const homographs = detectHomographs(result.sanitized);
    if (homographs.length > 0) {
      result.threats.push({
        type: 'homograph-attack',
        severity: 'high',
        message: `Homograph characters detected`,
        findings: homographs
      });
      // Don't block, but warn and normalize
      result.actions.push('homographs-normalized');
      result.sanitized = normalizeHomographs(result.sanitized);
    }
  }
  
  // Check 6: Prompt injection detection
  if (CONFIG.detectPromptInjection) {
    const injections = detectPromptInjection(result.sanitized);
    if (injections.length > 0) {
      result.threats.push({
        type: 'prompt-injection',
        severity: 'critical',
        message: 'Prompt injection patterns detected',
        patterns: injections
      });
      result.blocked = true;
    }
  }
  
  // Check 7: Delimiter confusion
  if (CONFIG.detectDelimiterConfusion) {
    const delimiters = detectDelimiters(result.sanitized);
    if (delimiters.suspicious) {
      result.threats.push({
        type: 'delimiter-confusion',
        severity: 'high',
        message: 'Suspicious delimiter usage detected',
        details: delimiters
      });
    }
  }
  
  // Check 8: Nesting depth (prevent context window attacks)
  const depth = calculateNestingDepth(result.sanitized);
  if (depth > CONFIG.maxNestingDepth) {
    result.threats.push({
      type: 'nesting-depth',
      severity: 'medium',
      message: `Excessive nesting depth (${depth} > ${CONFIG.maxNestingDepth})`
    });
  }
  
  // Log security event
  logSecurityEvent({
    source,
    action: result.blocked ? 'blocked' : 'sanitized',
    threats: result.threats.length,
    actions: result.actions
  });
  
  return result;
}

function removeZeroWidthChars(text) {
  let result = text;
  for (const char of ZERO_WIDTH_CHARS) {
    result = result.split(char).join('');
  }
  return result;
}

function detectBidiChars(text) {
  const found = [];
  for (const char of BIDI_CHARS) {
    if (text.includes(char)) {
      found.push(`U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
    }
  }
  return found;
}

function detectHomographs(text) {
  const found = [];
  for (const [cyrillic, latin] of Object.entries(HOMOGRAPHS)) {
    if (text.includes(cyrillic)) {
      found.push({ cyrillic, latin, code: `U+${cyrillic.charCodeAt(0).toString(16).toUpperCase()}` });
    }
  }
  return found;
}

function normalizeHomographs(text) {
  let result = text;
  for (const [cyrillic, latin] of Object.entries(HOMOGRAPHS)) {
    result = result.split(cyrillic).join(latin);
  }
  return result;
}

function detectPromptInjection(text) {
  const found = [];
  for (const pattern of INJECTION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      found.push({
        pattern: pattern.toString(),
        match: matches[0].substring(0, 50)
      });
    }
  }
  return found;
}

function detectDelimiters(text) {
  const results = {
    found: [],
    suspicious: false
  };
  
  for (const { pattern, name } of DELIMITER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      results.found.push({ type: name, count: matches.length });
      
      // Check for suspicious content inside delimiters
      for (const match of matches) {
        const inner = match.slice(3, -3).toLowerCase();
        if (inner.includes('system') || inner.includes('ignore') || inner.includes('override')) {
          results.suspicious = true;
        }
      }
    }
  }
  
  return results;
}

function calculateNestingDepth(text) {
  let maxDepth = 0;
  let currentDepth = 0;
  
  const brackets = [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '<', close: '>' },
  ];
  
  for (const char of text) {
    for (const { open, close } of brackets) {
      if (char === open) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === close) {
        currentDepth--;
      }
    }
  }
  
  return maxDepth;
}

function logSecurityEvent(event) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    layer: 'perimeter',
    ...event
  };
  
  // In production, this would write to a proper audit log
  if (event.threats > 0 || event.action === 'blocked') {
    console.error('[SECURITY]', JSON.stringify(logEntry));
  }
}

// Export API
module.exports = {
  sanitizeInput,
  removeZeroWidthChars,
  detectBidiChars,
  detectHomographs,
  normalizeHomographs,
  detectPromptInjection,
  CONFIG,
  ZERO_WIDTH_CHARS,
  BIDI_CHARS,
  HOMOGRAPHS
};

// CLI
if (require.main === module) {
  const input = process.argv.slice(2).join(' ') || 'Test input';
  const result = sanitizeInput(input, 'cli');
  console.log(JSON.stringify(result, null, 2));
}
