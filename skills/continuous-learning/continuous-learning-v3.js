/**
 * Continuous Learning v3
 * 
 * Full implementation with automatic pattern extraction,
 * instinct generation, and adaptive behavior.
 */

const fs = require('fs');
const path = require('path');

class ContinuousLearningV3 {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.instinctsDir = options.instinctsDir || './data/instincts';
    this.patternsDir = options.patternsDir || './data/patterns';
    this.maxInstincts = options.maxInstincts || 1000;
    this.similarityThreshold = options.similarityThreshold || 0.85;
    
    this.instincts = new Map();
    this.patterns = new Map();
    this.interactionHistory = [];
    this.maxHistory = options.maxHistory || 1000;
    
    this.ensureDirectories();
    this.loadInstincts();
    this.loadPatterns();
  }
  
  ensureDirectories() {
    [this.instinctsDir, this.patternsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * Process a new interaction for learning
   */
  async learnFromInteraction(interaction) {
    if (!this.enabled) return;
    
    // Store in history
    this.interactionHistory.push({
      timestamp: new Date().toISOString(),
      input: interaction.input,
      response: interaction.response,
      toolsUsed: interaction.toolsUsed || [],
      success: interaction.success !== false,
      duration: interaction.duration,
      context: interaction.context
    });
    
    // Trim history
    if (this.interactionHistory.length > this.maxHistory) {
      this.interactionHistory = this.interactionHistory.slice(-this.maxHistory);
    }
    
    // Extract patterns
    await this.extractPatterns(interaction);
    
    // Generate instincts from successful interactions
    if (interaction.success) {
      await this.generateInstinct(interaction);
    }
    
    // Periodic consolidation
    if (this.interactionHistory.length % 100 === 0) {
      await this.consolidateKnowledge();
    }
    
    this.saveInstincts();
    this.savePatterns();
  }
  
  /**
   * Extract patterns from interaction
   */
  async extractPatterns(interaction) {
    // Pattern 1: Tool usage sequences
    if (interaction.toolsUsed && interaction.toolsUsed.length > 1) {
      const toolSequence = interaction.toolsUsed.map(t => t.tool).join(' -> ');
      this.addPattern('tool_sequence', toolSequence, {
        frequency: 1,
        success: interaction.success,
        avgDuration: interaction.duration
      });
    }
    
    // Pattern 2: Input categories
    const category = this.categorizeInput(interaction.input);
    this.addPattern('input_category', category, {
      frequency: 1,
      responseLength: interaction.response?.length || 0
    });
    
    // Pattern 3: Successful approaches
    if (interaction.success && interaction.toolsUsed) {
      for (const tool of interaction.toolsUsed) {
        this.addPattern('successful_tool', tool.tool, {
          frequency: 1,
          forCategory: category
        });
      }
    }
    
    // Pattern 4: Response templates
    if (interaction.response && interaction.response.length > 50) {
      const template = this.extractTemplate(interaction.response);
      if (template) {
        this.addPattern('response_template', template, {
          frequency: 1,
          category
        });
      }
    }
  }
  
  /**
   * Generate instinct from successful interaction
   */
  async generateInstinct(interaction) {
    const input = interaction.input.toLowerCase();
    const category = this.categorizeInput(input);
    
    // Check if we already have a similar instinct
    const similar = this.findSimilarInstinct(input);
    if (similar && similar.confidence > 0.9) {
      // Update existing instinct
      similar.instinct.frequency = (similar.instinct.frequency || 1) + 1;
      similar.instinct.lastUsed = new Date().toISOString();
      return;
    }
    
    // Create new instinct
    const instinct = {
      id: `instinct-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: this.determineInstinctType(input),
      pattern: this.extractPatternSignature(input),
      response: this.extractResponseStrategy(interaction),
      tools: interaction.toolsUsed?.map(t => t.tool) || [],
      category,
      confidence: 0.5,
      frequency: 1,
      created: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      successRate: 1.0
    };
    
    // Only keep high-quality instincts
    if (this.instincts.size < this.maxInstincts) {
      this.instincts.set(instinct.id, instinct);
    } else {
      // Replace lowest confidence instinct
      const lowest = this.findLowestConfidenceInstinct();
      if (lowest && lowest.confidence < instinct.confidence) {
        this.instincts.delete(lowest.id);
        this.instincts.set(instinct.id, instinct);
      }
    }
  }
  
  /**
   * Find similar existing instinct
   */
  findSimilarInstinct(input) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const instinct of this.instincts.values()) {
      const score = this.calculateSimilarity(input, instinct.pattern);
      if (score > bestScore && score > this.similarityThreshold) {
        bestScore = score;
        bestMatch = instinct;
      }
    }
    
    return bestMatch ? { instinct: bestMatch, confidence: bestScore } : null;
  }
  
  /**
   * Calculate similarity between strings (simple Jaccard)
   */
  calculateSimilarity(str1, str2) {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Categorize input by intent
   */
  categorizeInput(input) {
    const categories = [
      { name: 'file_operation', keywords: ['read', 'write', 'edit', 'file', 'folder', 'directory'] },
      { name: 'code_generation', keywords: ['create', 'generate', 'write code', 'function', 'class'] },
      { name: 'web_search', keywords: ['search', 'find', 'lookup', 'google', 'web'] },
      { name: 'analysis', keywords: ['analyze', 'review', 'check', 'evaluate', 'assess'] },
      { name: 'debugging', keywords: ['fix', 'debug', 'error', 'bug', 'issue', 'broken'] },
      { name: 'git_operation', keywords: ['commit', 'push', 'pull', 'branch', 'merge', 'git'] },
      { name: 'scheduling', keywords: ['schedule', 'cron', 'timer', 'remind', 'every'] },
      { name: 'system_info', keywords: ['status', 'info', 'check', 'show', 'list'] }
    ];
    
    const inputLower = input.toLowerCase();
    let bestCategory = 'general';
    let bestScore = 0;
    
    for (const cat of categories) {
      const score = cat.keywords.filter(k => inputLower.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = cat.name;
      }
    }
    
    return bestCategory;
  }
  
  /**
   * Determine instinct type
   */
  determineInstinctType(input) {
    if (input.includes('how to') || input.includes('how do')) return 'procedure';
    if (input.includes('what is') || input.includes('explain')) return 'explanation';
    if (input.includes('create') || input.includes('make')) return 'creation';
    if (input.includes('fix') || input.includes('solve')) return 'problem_solving';
    return 'general';
  }
  
  /**
   * Extract pattern signature from input
   */
  extractPatternSignature(input) {
    // Remove specific details, keep structure
    return input
      .replace(/\b\d+\b/g, '{NUM}')
      .replace(/\b[a-f0-9]{7,}\b/g, '{HASH}')
      .replace(/'[^']*'/g, "'{STR}'")
      .replace(/"[^"]*"/g, '"{STR}"')
      .toLowerCase();
  }
  
  /**
   * Extract response strategy
   */
  extractResponseStrategy(interaction) {
    const response = interaction.response || '';
    
    // Detect response structure
    const hasSteps = response.match(/\d+\./g);
    const hasCode = response.includes('```');
    const hasList = response.match(/^[*-] /m);
    
    return {
      structure: hasSteps ? 'numbered_steps' : hasList ? 'bullet_list' : hasCode ? 'code_example' : 'paragraph',
      length: response.length,
      toolsRequired: interaction.toolsUsed?.map(t => t.tool) || []
    };
  }
  
  /**
   * Extract template from response
   */
  extractTemplate(response) {
    // Look for repeated structures
    const lines = response.split('\n');
    if (lines.length < 3) return null;
    
    // Extract common patterns
    const template = lines
      .map(line => {
        if (line.match(/^\d+\./)) return '{NUM}. {STEP}';
        if (line.match(/^[*-] /)) return '* {ITEM}';
        if (line.includes('```')) return '```{CODE}';
        return line.substring(0, 30) + (line.length > 30 ? '...' : '');
      })
      .join('\n');
    
    return template;
  }
  
  /**
   * Add pattern to collection
   */
  addPattern(type, value, metadata) {
    const key = `${type}:${value}`;
    const existing = this.patterns.get(key);
    
    if (existing) {
      existing.frequency = (existing.frequency || 0) + (metadata.frequency || 1);
      existing.lastSeen = new Date().toISOString();
      
      // Update success rate
      if (metadata.success !== undefined) {
        const total = existing.frequency;
        const successes = (existing.successRate || 1) * (total - 1) + (metadata.success ? 1 : 0);
        existing.successRate = successes / total;
      }
    } else {
      this.patterns.set(key, {
        type,
        value,
        frequency: metadata.frequency || 1,
        created: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        ...metadata
      });
    }
  }
  
  /**
   * Consolidate and clean up knowledge
   */
  async consolidateKnowledge() {
    // Remove old low-frequency patterns
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    for (const [key, pattern] of this.patterns) {
      if (pattern.lastSeen < cutoff && pattern.frequency < 3) {
        this.patterns.delete(key);
      }
    }
    
    // Update instinct confidences based on usage
    for (const instinct of this.instincts.values()) {
      const age = Date.now() - new Date(instinct.created).getTime();
      const days = age / (24 * 60 * 60 * 1000);
      
      // Decay confidence for old unused instincts
      if (days > 7 && instinct.frequency < 3) {
        instinct.confidence *= 0.95;
      }
      
      // Boost confidence for frequently used instincts
      if (instinct.frequency > 10) {
        instinct.confidence = Math.min(0.99, instinct.confidence + 0.01);
      }
    }
  }
  
  /**
   * Find lowest confidence instinct for replacement
   */
  findLowestConfidenceInstinct() {
    let lowest = null;
    
    for (const instinct of this.instincts.values()) {
      if (!lowest || instinct.confidence < lowest.confidence) {
        lowest = instinct;
      }
    }
    
    return lowest;
  }
  
  /**
   * Apply learned instincts to new input
   */
  applyInstincts(input) {
    if (!this.enabled) return null;
    
    const similar = this.findSimilarInstinct(input);
    if (!similar || similar.confidence < 0.8) return null;
    
    const instinct = similar.instinct;
    instinct.lastUsed = new Date().toISOString();
    
    return {
      matched: true,
      confidence: similar.confidence,
      suggestedTools: instinct.tools,
      responseStrategy: instinct.response,
      category: instinct.category
    };
  }
  
  /**
   * Get learning statistics
   */
  getStats() {
    const categoryCounts = {};
    for (const instinct of this.instincts.values()) {
      categoryCounts[instinct.category] = (categoryCounts[instinct.category] || 0) + 1;
    }
    
    const typeCounts = {};
    for (const instinct of this.instincts.values()) {
      typeCounts[instinct.type] = (typeCounts[instinct.type] || 0) + 1;
    }
    
    return {
      totalInstincts: this.instincts.size,
      totalPatterns: this.patterns.size,
      interactionHistory: this.interactionHistory.length,
      categories: categoryCounts,
      types: typeCounts,
      avgConfidence: this.instincts.size > 0 
        ? Array.from(this.instincts.values()).reduce((sum, i) => sum + i.confidence, 0) / this.instincts.size 
        : 0
    };
  }
  
  /**
   * Get top instincts
   */
  getTopInstincts(limit = 10) {
    return Array.from(this.instincts.values())
      .sort((a, b) => (b.confidence * b.frequency) - (a.confidence * a.frequency))
      .slice(0, limit);
  }
  
  /**
   * Get patterns by type
   */
  getPatternsByType(type) {
    return Array.from(this.patterns.values())
      .filter(p => p.type === type)
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Save instincts to disk
   */
  saveInstincts() {
    const data = {
      instincts: Array.from(this.instincts.entries()),
      saved: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(this.instinctsDir, 'instincts.json'),
      JSON.stringify(data, null, 2)
    );
  }
  
  /**
   * Load instincts from disk
   */
  loadInstincts() {
    const file = path.join(this.instinctsDir, 'instincts.json');
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        this.instincts = new Map(data.instincts || []);
      } catch (e) {
        console.warn('Failed to load instincts:', e.message);
      }
    }
  }
  
  /**
   * Save patterns to disk
   */
  savePatterns() {
    const data = {
      patterns: Array.from(this.patterns.entries()),
      saved: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(this.patternsDir, 'patterns.json'),
      JSON.stringify(data, null, 2)
    );
  }
  
  /**
   * Load patterns from disk
   */
  loadPatterns() {
    const file = path.join(this.patternsDir, 'patterns.json');
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        this.patterns = new Map(data.patterns || []);
      } catch (e) {
        console.warn('Failed to load patterns:', e.message);
      }
    }
  }
  
  /**
   * Export all knowledge
   */
  exportKnowledge(exportPath) {
    const data = {
      instincts: Array.from(this.instincts.values()),
      patterns: Array.from(this.patterns.values()),
      stats: this.getStats(),
      exported: new Date().toISOString()
    };
    
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    return exportPath;
  }
  
  /**
   * Import knowledge
   */
  importKnowledge(importPath, merge = false) {
    const data = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    
    if (!merge) {
      this.instincts.clear();
      this.patterns.clear();
    }
    
    for (const instinct of data.instincts || []) {
      if (!this.instincts.has(instinct.id)) {
        this.instincts.set(instinct.id, instinct);
      }
    }
    
    for (const pattern of data.patterns || []) {
      const key = `${pattern.type}:${pattern.value}`;
      if (!this.patterns.has(key)) {
        this.patterns.set(key, pattern);
      }
    }
    
    this.saveInstincts();
    this.savePatterns();
    
    return { imported: data.instincts?.length || 0 };
  }
}

module.exports = { ContinuousLearningV3 };