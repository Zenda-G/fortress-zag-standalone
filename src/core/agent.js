/**
 * FORTRESS ZAG STANDALONE - Core Agent (Full Version)
 * 
 * Complete autonomous agent with all capabilities.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Core components
const { ModelRouter } = require('../models/index.js');
const { executeTool, Tools } = require('./tools.js');
const browser = require('./browser.js');
const scheduler = require('./scheduler.js');

// Security layers
const perimeter = require('../security/perimeter.js');
const validator = require('../security/validator.js');
const sandbox = require('../security/sandbox.js');

// Skills
const continuousLearning = require('../../skills/continuous-learning/continuous-learning.js');
const contextCompaction = require('../../skills/context-compaction/context-compaction.js');

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
    
    // Load identity
    this.identity = this.loadIdentity();
    
    // Initialize model router
    this.models = new ModelRouter(this.config.models || {});
    
    // System prompt
    this.systemPrompt = this.buildSystemPrompt();
  }
  
  /**
   * Initialize the agent
   */
  async initialize() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  FORTRESS ZAG STANDALONE v2.0                          ║');
    console.log('║  Fully Autonomous AI Agent                             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Load memory
    this.loadMemory();
    
    // Security check
    const securityStatus = this.checkSecurity();
    console.log('Security Status:', JSON.stringify(securityStatus, null, 2));
    
    // Model status
    console.log('\nModel Providers:');
    console.log('  - OpenAI:', this.config.models?.openai?.apiKey ? '✅' : '❌');
    console.log('  - Anthropic:', this.config.models?.anthropic?.apiKey ? '✅' : '❌');
    console.log('  - Moonshot:', this.config.models?.moonshot?.apiKey ? '✅' : '❌');
    console.log('  - Ollama:', this.config.models?.ollama?.baseUrl ? '✅' : '❌');
    
    // Tools status
    console.log('\nTools Available:');
    console.log('  - read, write, edit, exec, web_fetch, web_search, list, search');
    
    this.initialized = true;
    
    console.log(`\n✅ Agent initialized: ${this.sessionId}`);
    console.log(`   Identity: ${this.identity.name}`);
    console.log(`   Vibe: ${this.identity.vibe?.substring(0, 50)}...`);
    
    this.emit('ready');
    return this;
  }
  
  /**
   * Build system prompt from identity
   */
  buildSystemPrompt() {
    return `You are ${this.identity.name}.
${this.identity.vibe}

You have access to tools to help the user. Use them when appropriate.
Available tools: read, write, edit, exec, web_fetch, web_search, list, search

When using tools:
1. Always validate inputs for safety
2. Prefer read-only operations when possible
3. Confirm before destructive operations
4. Report errors clearly

Current time: ${new Date().toISOString()}
Session: ${this.sessionId}`;
  }
  
  /**
   * Process an incoming message
   */
  async processMessage(message) {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }
    
    // Security Layer 1: Perimeter defense
    const sanitized = perimeter.sanitizeInput(message.text, message.source);
    if (sanitized.blocked) {
      return {
        text: "⚠️ Message blocked for security reasons.",
        blocked: true,
        threats: sanitized.threats
      };
    }
    
    // Add user message to context
    this.context.push({
      role: 'user',
      content: sanitized.sanitized,
      timestamp: new Date().toISOString(),
      source: message.source
    });
    
    // Check context size
    const contextSize = JSON.stringify(this.context).length;
    const compactionStatus = contextCompaction.getContextStatus(contextSize, 100000);
    
    if (compactionStatus.threshold === 'CRITICAL') {
      this.compactContext();
    }
    
    // Generate AI response with tool use
    const response = await this.generateAIResponse();
    
    // Add response to context
    this.context.push({
      role: 'assistant',
      content: response.text,
      timestamp: new Date().toISOString(),
      toolCalls: response.toolCalls
    });
    
    // Learn from interaction
    continuousLearning.learnFromContext(
      `User: ${sanitized.sanitized}\nZag: ${response.text}`
    );
    
    // Save memory
    this.saveMemory();
    
    return {
      text: response.text,
      toolCalls: response.toolCalls,
      contextStatus: compactionStatus.threshold,
      blocked: false
    };
  }
  
  /**
   * Generate AI response with tool integration
   */
  async generateAIResponse() {
    // Prepare messages for model
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.context.slice(-10).map(m => ({ role: m.role, content: m.content }))
    ];
    
    // Get AI response
    try {
      const result = await this.models.completeWithFallback(messages, {
        maxTokens: 2000
      });
      
      const text = result.text;
      
      // Check for tool use patterns
      const toolCalls = this.parseToolCalls(text);
      
      // Execute tools if found
      if (toolCalls.length > 0) {
        const toolResults = await this.executeTools(toolCalls);
        
        // Append tool results to response
        const toolSummary = toolResults.map(r => 
          `[Tool: ${r.tool}] ${r.result.success ? 'Success' : 'Error: ' + r.result.error}`
        ).join('\n');
        
        return {
          text: text + '\n\n' + toolSummary,
          toolCalls: toolResults
        };
      }
      
      return { text, toolCalls: [] };
    } catch (error) {
      console.error('Model error:', error);
      return {
        text: "I apologize, but I'm having trouble connecting to my language model. Please check the configuration.",
        toolCalls: [],
        error: error.message
      };
    }
  }
  
  /**
   * Parse tool calls from AI response
   */
  parseToolCalls(text) {
    const toolCalls = [];
    
    // Pattern: <tool_name param="value" ... />
    const toolPattern = /<(\w+)\s+([^>]+)\/>/g;
    let match;
    
    while ((match = toolPattern.exec(text)) !== null) {
      const toolName = match[1];
      const paramString = match[2];
      
      // Parse params
      const params = {};
      const paramPattern = /(\w+)=["']([^"']+)["']/g;
      let paramMatch;
      
      while ((paramMatch = paramPattern.exec(paramString)) !== null) {
        params[paramMatch[1]] = paramMatch[2];
      }
      
      toolCalls.push({ tool: toolName, params });
    }
    
    return toolCalls;
  }
  
  /**
   * Execute tools with security validation
   */
  async executeTools(toolCalls) {
    const results = [];
    
    for (const call of toolCalls) {
      const result = await this.executeTool(call.tool, call.params);
      results.push({ tool: call.tool, params: call.params, result });
    }
    
    return results;
  }
  
  /**
   * Execute a tool with full security
   */
  async executeTool(toolName, params) {
    // Security validation for dangerous tools
    if (toolName === 'exec') {
      const validation = validator.validateCommand(params.command);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Command blocked: ' + validation.issues.map(i => i.message).join(', ')
        };
      }
      
      // Use sandbox
      const sandboxResult = await sandbox.sandboxExecute(params.command, {
        workspace: params.workdir,
        timeout: params.timeout || 30000
      });
      
      return sandboxResult.result;
    }
    
    // File operations
    if (['read', 'write', 'edit'].includes(toolName)) {
      const filePath = params.file_path || params.path;
      const pathValidation = validator.validateFilePath(filePath);
      
      if (!pathValidation.valid) {
        return {
          success: false,
          error: 'Path blocked: ' + pathValidation.issues.map(i => i.message).join(', ')
        };
      }
    }
    
    // Browser automation
    if (toolName === 'browser_navigate') {
      return await browser.browserNavigate(params);
    }
    if (toolName === 'browser_click') {
      return await browser.browserClick(params);
    }
    if (toolName === 'browser_type') {
      return await browser.browserType(params);
    }
    if (toolName === 'browser_extract') {
      return await browser.browserExtract(params);
    }
    
    // Scheduler
    if (toolName === 'schedule') {
      const job = scheduler.scheduleJob(params.id, params.expression, params.task, params.options);
      return { success: true, job };
    }
    if (toolName === 'unschedule') {
      scheduler.removeJob(params.id);
      return { success: true };
    }
    if (toolName === 'list_schedules') {
      const jobs = scheduler.getJobs();
      return { success: true, jobs };
    }
    
    // Execute via tools module
    return await executeTool(toolName, params);
  }
  
  /**
   * Load agent identity
   */
  loadIdentity() {
    const identityPath = path.join(__dirname, '..', '..', 'SOUL.md');
    if (fs.existsSync(identityPath)) {
      const content = fs.readFileSync(identityPath, 'utf8');
      
      const nameMatch = content.match(/You're ([^,]+)/);
      const vibeMatch = content.match(/Vibe\n\n?([^\n#]+)/);
      
      return {
        name: nameMatch ? nameMatch[1].trim() : 'Zag',
        vibe: vibeMatch ? vibeMatch[1].trim() : 'Competent assistant',
        source: 'SOUL.md'
      };
    }
    
    return {
      name: 'Zag',
      vibe: 'Digital familiar',
      source: 'default'
    };
  }
  
  /**
   * Load memory from files
   */
  loadMemory() {
    const today = new Date().toISOString().split('T')[0];
    const memoryFile = path.join(this.memoryDir, `${today}.md`);
    
    if (fs.existsSync(memoryFile)) {
      console.log(`Loading memory: ${today}.md`);
    }
    
    const instincts = continuousLearning.viewInstincts();
    console.log(`Loaded ${instincts.total} instincts`);
  }
  
  /**
   * Save memory to files
   */
  saveMemory() {
    const today = new Date().toISOString().split('T')[0];
    const memoryFile = path.join(this.memoryDir, `${today}.md`);
    
    const entry = `\n## ${new Date().toLocaleTimeString()}\n\n${JSON.stringify(this.context.slice(-2), null, 2)}\n`;
    
    fs.appendFileSync(memoryFile, entry);
  }
  
  /**
   * Compact context when needed
   */
  compactContext() {
    console.log('Compacting context...');
    
    const toSummarize = this.context.slice(0, -10);
    const summary = `Previous context: ${toSummarize.length} messages summarized.`;
    
    this.context = [
      { role: 'system', content: summary },
      ...this.context.slice(-10)
    ];
    
    console.log('Context compacted');
  }
  
  /**
   * Check security status
   */
  checkSecurity() {
    return {
      level: 'hardened',
      layers: {
        perimeter: true,
        validator: true,
        sandbox: sandbox.detectSandboxMode()
      }
    };
  }
  
  ensureDirectories() {
    const dirs = [this.workdir, this.memoryDir, path.join(this.workdir, 'logs')];
    dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
  }
  
  generateId() {
    return `zag-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
  
  getStatus() {
    return {
      initialized: this.initialized,
      sessionId: this.sessionId,
      identity: this.identity,
      contextLength: this.context.length,
      workdir: this.workdir
    };
  }
}

module.exports = { FortressZag };
