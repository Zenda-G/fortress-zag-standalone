/**
 * FORTRESS ZAG v4.1 - Memory-Optimized Agent
 * 
 * PicoClaw-inspired efficiency improvements:
 * - Lazy loading of heavy modules
 * - On-demand browser initialization
 * - Conditional skill loading
 * - Memory pressure detection
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Core components (always loaded)
const { ModelRouter } = require('../models/index.js');
const { executeTool } = require('./tools.js');

// v4.1: Lazy loader
const { lazyLoader } = require('./lazy-loader.js');

// v4.0 Additions (lazy loaded)
const GitBackedMemory = null; // Lazy loaded
const SecretsManager = null; // Lazy loaded

class FortressZag extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = options.config || {};
    this.workdir = options.workdir || './data';
    this.memoryDir = path.join(this.workdir, 'memory');
    
    // Initialize state
    this.initialized = false;
    this.context = [];
    this.sessionId = this.generateId();
    
    // Load identity (lightweight)
    this.identity = this.loadIdentity();
    
    // Initialize model router (required)
    this.models = new ModelRouter(this.config.models || {});
    
    // v4.1: Lazy loaded components (not initialized yet)
    this._gitMemory = null;
    this._secrets = null;
    this._browser = null;
    this._scheduler = null;
    
    // Memory pressure monitoring
    this.memoryThreshold = options.memoryThreshold || 100 * 1024 * 1024; // 100MB
    this.lastMemoryCheck = Date.now();
    
    // System prompt (built on demand)
    this._systemPrompt = null;
  }
  
  /**
   * Initialize the agent (fast path)
   */
  async initialize() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  FORTRESS ZAG v4.1 - Memory-Optimized                  ║');
    console.log('║  Lazy Loading • On-Demand Browser • Pressure Aware     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    const startTime = Date.now();
    
    // Ensure directories exist (lightweight)
    this.ensureDirectories();
    
    // Lazy load secrets only if configured
    if (this.config.security?.twoTierSecrets !== false) {
      await this.getSecrets();
    }
    
    // Lazy load git memory only if enabled
    if (this.config.memory?.gitBacked) {
      await this.getGitMemory();
    }
    
    // Model status (quick check)
    console.log('\nModel Providers:');
    console.log('  - OpenAI:', this.config.models?.openai?.apiKey ? '✅' : '❌');
    console.log('  - Anthropic:', this.config.models?.anthropic?.apiKey ? '✅' : '❌');
    console.log('  - Moonshot:', this.config.models?.moonshot?.apiKey ? '✅' : '❌');
    console.log('  - Ollama:', this.config.models?.ollama?.baseUrl ? '✅' : '❌');
    
    console.log('\nTools (loaded on-demand):');
    console.log('  - Browser: lazy');
    console.log('  - Scheduler: lazy');
    console.log('  - Skills: lazy');
    
    this.initialized = true;
    
    const bootTime = Date.now() - startTime;
    console.log(`\n✅ Agent initialized in ${bootTime}ms: ${this.sessionId}`);
    console.log(`   Identity: ${this.identity.name}`);
    console.log(`   Memory: ${this.getMemoryUsage()}MB`);
    
    this.emit('ready');
    return this;
  }
  
  /**
   * v4.1: Lazy load git-backed memory
   */
  async getGitMemory() {
    if (!this._gitMemory) {
      const { GitBackedMemory } = await lazyLoader.load('git-memory', async () => {
        const mod = require('../memory/git-backed.js');
        return new mod.GitBackedMemory({
          memoryPath: this.config.memory?.memoryPath || 'operating_system/MEMORY.md',
          repoRoot: process.cwd()
        });
      });
      this._gitMemory = GitBackedMemory;
    }
    return this._gitMemory;
  }
  
  /**
   * v4.1: Lazy load secrets manager
   */
  async getSecrets() {
    if (!this._secrets) {
      const { SecretsManager } = await lazyLoader.load('secrets', async () => {
        const mod = require('../security/secrets-manager.js');
        const sm = new mod.SecretsManager();
        sm.loadFromEnv();
        return sm;
      });
      this._secrets = SecretsManager;
    }
    return this._secrets;
  }
  
  /**
   * v4.1: Lazy load browser (only when needed)
   */
  async getBrowser() {
    if (!this._browser) {
      this._browser = await lazyLoader.load('browser', async () => {
        const browser = require('./browser.js');
        return browser;
      });
    }
    return this._browser;
  }
  
  /**
   * v4.1: Lazy load scheduler
   */
  async getScheduler() {
    if (!this._scheduler) {
      this._scheduler = await lazyLoader.load('scheduler', async () => {
        const scheduler = require('./scheduler.js');
        return scheduler;
      });
    }
    return this._scheduler;
  }
  
  /**
   * v4.1: Build system prompt on demand (cached)
   */
  async buildSystemPrompt() {
    if (this._systemPrompt) {
      return this._systemPrompt;
    }
    
    const parts = [];
    parts.push(`You are ${this.identity.name}.`);
    parts.push(this.identity.vibe);
    
    // Lazy load memory content only if available
    if (this._gitMemory) {
      const memoryContent = this._gitMemory.read();
      if (memoryContent) {
        parts.push('\n# Memory\n\n' + memoryContent.substring(0, 5000)); // Limit size
      }
    }
    
    // Lazy load secrets only if available
    if (this._secrets) {
      const llmSecrets = this._secrets.getAllLLMSecrets();
      if (Object.keys(llmSecrets).length > 0) {
        parts.push('\n# Available Credentials\n');
        for (const [key, value] of Object.entries(llmSecrets).slice(0, 5)) {
          parts.push(`- ${key}: ${value.substring(0, 10)}...`);
        }
      }
    }
    
    parts.push(`
You have access to tools. Available: read, write, edit, exec, web_fetch, web_search, list, search
Current time: ${new Date().toISOString()}
Session: ${this.sessionId}`);
    
    this._systemPrompt = parts.join('\n');
    return this._systemPrompt;
  }
  
  /**
   * v4.1: Check memory pressure
   */
  checkMemoryPressure() {
    const now = Date.now();
    // Check every 30 seconds
    if (now - this.lastMemoryCheck < 30000) {
      return { pressure: false };
    }
    
    this.lastMemoryCheck = now;
    const usage = process.memoryUsage();
    const heapUsed = usage.heapUsed;
    
    if (heapUsed > this.memoryThreshold) {
      console.warn(`[Memory] Pressure detected: ${Math.round(heapUsed / 1024 / 1024)}MB`);
      this.handleMemoryPressure();
      return { pressure: true, heapUsed };
    }
    
    return { pressure: false, heapUsed };
  }
  
  /**
   * v4.1: Handle memory pressure
   */
  handleMemoryPressure() {
    // Unload non-critical modules
    if (this._browser && !this.browserInUse) {
      lazyLoader.unload('browser');
      this._browser = null;
    }
    
    // Clear caches
    this._systemPrompt = null;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    console.log('[Memory] Pressure handled, cleaned up unused modules');
  }
  
  /**
   * Get current memory usage in MB
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024);
  }
  
  /**
   * Process message with memory awareness
   */
  async processMessage(message) {
    // Check memory pressure
    this.checkMemoryPressure();
    
    // Standard processing
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }
    
    // Add user message to context
    this.context.push({
      role: 'user',
      content: message.text,
      timestamp: new Date().toISOString(),
      source: message.source
    });
    
    // Generate response
    const response = await this.generateAIResponse();
    
    // Add response to context
    this.context.push({
      role: 'assistant',
      content: response.text,
      timestamp: new Date().toISOString()
    });
    
    // Update memory (lazy)
    if (this._gitMemory) {
      this.updateGitMemory(message.text, response);
    }
    
    return response;
  }
  
  /**
   * Generate AI response
   */
  async generateAIResponse() {
    const messages = [
      { role: 'system', content: await this.buildSystemPrompt() },
      ...this.context.slice(-10).map(m => ({ role: m.role, content: m.content }))
    ];
    
    try {
      const result = await this.models.completeWithFallback(messages, {
        maxTokens: 2000
      });
      
      return { text: result.text, toolCalls: [] };
    } catch (error) {
      return {
        text: "Model connection error. Please check configuration.",
        error: error.message
      };
    }
  }
  
  /**
   * Update git-backed memory
   */
  updateGitMemory(input, response) {
    if (!this._gitMemory) return;
    
    const entry = `
## ${new Date().toISOString()}
**Input:** ${input.substring(0, 100)}...
**Response:** ${response.text?.substring(0, 200) || 'Completed'}...
---
`;
    this._gitMemory.append(entry, { description: 'Session interaction' });
  }
  
  /**
   * Load identity
   */
  loadIdentity() {
    const identityPath = path.join(__dirname, '..', '..', 'SOUL.md');
    if (fs.existsSync(identityPath)) {
      const content = fs.readFileSync(identityPath, 'utf8');
      const nameMatch = content.match(/You're ([^,]+)/);
      const vibeMatch = content.match(/Vibe\n\n?([^\n#]+)/);
      return {
        name: nameMatch ? nameMatch[1].trim() : 'Zag',
        vibe: vibeMatch ? vibeMatch[1].trim() : 'Competent assistant'
      };
    }
    return { name: 'Zag', vibe: 'Digital familiar' };
  }
  
  ensureDirectories() {
    const dirs = [this.workdir, this.memoryDir];
    dirs.forEach(d => { 
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); 
    });
  }
  
  generateId() {
    return `zag-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
  
  getStatus() {
    return {
      initialized: this.initialized,
      sessionId: this.sessionId,
      memory: this.getMemoryUsage(),
      lazyLoaded: lazyLoader.getStats(),
      contextLength: this.context.length
    };
  }
}

module.exports = { FortressZag };