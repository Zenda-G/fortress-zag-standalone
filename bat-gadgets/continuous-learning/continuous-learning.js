/**
 * Continuous Learning v2 - Instinct-Based Pattern Extraction
 * 
 * Extracts patterns from conversations, scores them by confidence,
 * and auto-generates skills from high-confidence patterns.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Workspace root detection
function getWorkspaceRoot() {
  // Check if we're in a skill subdirectory
  const cwd = process.cwd();
  if (cwd.includes('skills' + path.sep + 'continuous-learning')) {
    return path.resolve(cwd, '..', '..');
  }
  return cwd;
}

const WORKSPACE_ROOT = getWorkspaceRoot();

// Paths (always relative to workspace root)
const INSTINCTS_DIR = path.join(WORKSPACE_ROOT, 'memory', 'instincts');
const INDEX_FILE = path.join(INSTINCTS_DIR, 'index.json');
const AUTO_SKILLS_DIR = path.join(WORKSPACE_ROOT, 'skills', 'auto-generated');

// Ensure directories exist
function ensureDirs() {
  [INSTINCTS_DIR, AUTO_SKILLS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Initialize index if it doesn't exist
function initIndex() {
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify({
      version: '1.0',
      created: new Date().toISOString(),
      instincts: [],
      stats: {
        totalLearned: 0,
        totalEvolved: 0,
        lastExtraction: null
      }
    }, null, 2));
  }
}

// Load index
function loadIndex() {
  ensureDirs();
  initIndex();
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

// Save index
function saveIndex(index) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

// Generate UUID
function uuid() {
  return crypto.randomUUID();
}

/**
 * Extract patterns from conversation text
 * Looks for:
 * - Repeated tool usage patterns
 * - Common file operations
 * - Preferred coding styles
 * - Workflow patterns
 */
function extractPatterns(text) {
  const patterns = [];
  
  // Pattern 1: Tool usage sequences
  const toolSequenceMatch = text.match(/(?:read|write|edit|exec)\([^)]+\)[\s\S]*?(?:read|write|edit|exec)\([^)]+\)/gi);
  if (toolSequenceMatch && toolSequenceMatch.length >= 2) {
    patterns.push({
      type: 'tool-sequence',
      content: toolSequenceMatch[toolSequenceMatch.length - 1],
      frequency: toolSequenceMatch.length
    });
  }
  
  // Pattern 2: File operation preferences
  const fileOps = text.match(/(web_fetch|web_search|browser)\s*\(/gi);
  if (fileOps && fileOps.length >= 3) {
    patterns.push({
      type: 'research-workflow',
      content: 'Prefers web research before coding',
      frequency: fileOps.length
    });
  }
  
  // Pattern 3: Error handling patterns
  const errorHandling = text.match(/try\s*\{[\s\S]*?\}\s*catch|error|ErrorAction SilentlyContinue/gi);
  if (errorHandling && errorHandling.length >= 2) {
    patterns.push({
      type: 'error-handling',
      content: 'Consistent error handling pattern detected',
      frequency: errorHandling.length
    });
  }
  
  // Pattern 4: Security consciousness
  const securityRefs = text.match(/security|Security Shield|sanitize|validate/gi);
  if (securityRefs && securityRefs.length >= 3) {
    patterns.push({
      type: 'security-first',
      content: 'Security-conscious workflow pattern',
      frequency: securityRefs.length
    });
  }
  
  return patterns;
}

/**
 * Calculate confidence score based on frequency and context
 */
function calculateConfidence(pattern, existingInstinct = null) {
  let score = 0;
  
  // Base score from frequency
  score += Math.min(pattern.frequency * 0.1, 0.4);
  
  // Boost for existing instincts (learning reinforcement)
  if (existingInstinct) {
    score += existingInstinct.confidence * 0.3;
  }
  
  // Context-specific boosts
  if (pattern.type === 'security-first') score += 0.1;
  if (pattern.type === 'error-handling') score += 0.05;
  
  return Math.min(score, 1.0);
}

/**
 * Create or update an instinct
 */
function createInstinct(pattern, context = '') {
  const index = loadIndex();
  const existing = index.instincts.find(i => i.type === pattern.type);
  
  const confidence = calculateConfidence(pattern, existing);
  
  if (existing) {
    // Update existing
    existing.confidence = confidence;
    existing.lastSeen = new Date().toISOString();
    existing.evidence.push({
      date: new Date().toISOString(),
      context: context.substring(0, 200)
    });
    existing.evidence = existing.evidence.slice(-5); // Keep last 5
    saveIndex(index);
    return { action: 'updated', instinct: existing };
  } else {
    // Create new
    const instinct = {
      id: uuid(),
      type: pattern.type,
      name: pattern.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: pattern.content,
      confidence: confidence,
      created: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      context: context.substring(0, 500),
      evidence: [{
        date: new Date().toISOString(),
        context: context.substring(0, 200)
      }],
      evolved: false
    };
    
    index.instincts.push(instinct);
    index.stats.totalLearned++;
    saveIndex(index);
    
    // Save individual instinct file
    const instinctFile = path.join(INSTINCTS_DIR, `${instinct.id}.md`);
    fs.writeFileSync(instinctFile, renderInstinctMarkdown(instinct));
    
    return { action: 'created', instinct };
  }
}

/**
 * Render instinct as markdown
 */
function renderInstinctMarkdown(instinct) {
  return `---
id: ${instinct.id}
name: ${instinct.name}
created: ${instinct.created}
confidence: ${instinct.confidence.toFixed(2)}
context: ${instinct.context.substring(0, 100)}...
action: Apply this pattern when ${instinct.type.replace(/-/g, ' ')}
evidence_count: ${instinct.evidence.length}
---

# ${instinct.name}

**Confidence:** ${(instinct.confidence * 100).toFixed(0)}%

## Pattern
${instinct.content}

## Context
${instinct.context}

## Evidence
${instinct.evidence.map(e => `- ${e.date}: ${e.context.substring(0, 100)}...`).join('\n')}
`;
}

/**
 * View all instincts with filtering
 */
function viewInstincts(filter = {}) {
  const index = loadIndex();
  let instincts = index.instincts;
  
  if (filter.minConfidence) {
    instincts = instincts.filter(i => i.confidence >= filter.minConfidence);
  }
  
  if (filter.type) {
    instincts = instincts.filter(i => i.type === filter.type);
  }
  
  // Sort by confidence desc
  instincts.sort((a, b) => b.confidence - a.confidence);
  
  return {
    total: index.instincts.length,
    filtered: instincts.length,
    stats: index.stats,
    instincts: instincts.map(i => ({
      id: i.id,
      name: i.name,
      type: i.type,
      confidence: i.confidence,
      created: i.created,
      evolved: i.evolved
    }))
  };
}

/**
 * Export instincts to file
 */
function exportInstincts(outputPath = null) {
  const index = loadIndex();
  const exportData = {
    version: '1.0',
    exported: new Date().toISOString(),
    instincts: index.instincts
  };
  
  const filePath = outputPath || path.join(INSTINCTS_DIR, `export-${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
  
  return { path: filePath, count: index.instincts.length };
}

/**
 * Import instincts from file
 */
function importInstincts(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const index = loadIndex();
  
  let imported = 0;
  let merged = 0;
  
  for (const instinct of importData.instincts) {
    const existing = index.instincts.find(i => i.type === instinct.type);
    if (!existing) {
      instinct.id = uuid(); // New ID to avoid conflicts
      index.instincts.push(instinct);
      imported++;
    } else {
      // Merge confidence
      existing.confidence = Math.max(existing.confidence, instinct.confidence);
      merged++;
    }
  }
  
  saveIndex(index);
  return { imported, merged, total: index.instincts.length };
}

/**
 * Evolve high-confidence instincts into skills
 */
function evolveInstincts(minConfidence = 0.7) {
  const index = loadIndex();
  const candidates = index.instincts.filter(i => 
    i.confidence >= minConfidence && !i.evolved
  );
  
  const evolved = [];
  
  for (const instinct of candidates) {
    const skillFile = path.join(AUTO_SKILLS_DIR, `${instinct.type}.md`);
    
    const skillContent = `---
name: ${instinct.name}
type: auto-generated
source_instinct: ${instinct.id}
confidence: ${instinct.confidence}
created: ${new Date().toISOString()}
---

# ${instinct.name}

**Auto-generated from instinct ${instinct.id}**
**Confidence:** ${(instinct.confidence * 100).toFixed(0)}%

## When to Apply
${instinct.context}

## Pattern
${instinct.content}

## Evidence
This pattern has been observed ${instinct.evidence.length} times.

## Usage
Apply this pattern automatically when similar contexts are detected.
`;
    
    fs.writeFileSync(skillFile, skillContent);
    
    instinct.evolved = true;
    instinct.evolvedTo = skillFile;
    evolved.push(instinct);
  }
  
  index.stats.totalEvolved += evolved.length;
  saveIndex(index);
  
  return { evolved: evolved.length, skills: evolved.map(e => e.name) };
}

/**
 * Main learning function - extract from recent context
 */
function learnFromContext(context) {
  const patterns = extractPatterns(context);
  const results = [];
  
  for (const pattern of patterns) {
    const result = createInstinct(pattern, context);
    results.push(result);
  }
  
  // Update stats
  const index = loadIndex();
  index.stats.lastExtraction = new Date().toISOString();
  saveIndex(index);
  
  return results;
}

// Export API
module.exports = {
  learnFromContext,
  viewInstincts,
  exportInstincts,
  importInstincts,
  evolveInstincts,
  createInstinct,
  extractPatterns,
  // Direct access
  INSTINCTS_DIR,
  INDEX_FILE,
  WORKSPACE_ROOT
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'status':
      console.log(JSON.stringify(viewInstincts(), null, 2));
      break;
    case 'export':
      console.log(exportInstincts(args[1]));
      break;
    case 'import':
      console.log(importInstincts(args[1]));
      break;
    case 'evolve':
      console.log(evolveInstincts(parseFloat(args[1]) || 0.7));
      break;
    default:
      console.log('Usage: node continuous-learning.js [status|export|import|evolve]');
  }
}
