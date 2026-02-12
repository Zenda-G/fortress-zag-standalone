/**
 * Context Compaction v2
 * 
 * Smart memory management when context fills.
 * Uses LLM to summarize and compress conversation history.
 */

class ContextCompactionV2 {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.strategy = options.strategy || 'smart'; // 'smart', 'summary', 'truncation', 'hybrid'
    this.compressionRatio = options.compressionRatio || 0.5;
    this.minMessagesToKeep = options.minMessagesToKeep || 5;
    this.maxSummaryLength = options.maxSummaryLength || 500;
    
    this.compactionHistory = [];
    this.maxHistory = 100;
  }
  
  /**
   * Check if compaction is needed
   */
  shouldCompact(context, maxSize = 100000) {
    if (!this.enabled) return false;
    
    const currentSize = JSON.stringify(context).length;
    const ratio = currentSize / maxSize;
    
    return {
      needed: ratio > 0.75,
      ratio,
      currentSize,
      maxSize,
      urgency: ratio > 0.9 ? 'critical' : ratio > 0.75 ? 'high' : 'normal'
    };
  }
  
  /**
   * Compact context using selected strategy
   */
  async compact(context, options = {}) {
    if (!this.enabled) return context;
    
    const strategy = options.strategy || this.strategy;
    const maxSize = options.maxSize || 100000;
    
    const status = this.shouldCompact(context, maxSize);
    if (!status.needed && !options.force) {
      return context;
    }
    
    const beforeCount = context.length;
    const beforeSize = JSON.stringify(context).length;
    
    let compacted;
    switch (strategy) {
      case 'smart':
        compacted = await this.smartCompact(context, options);
        break;
      case 'summary':
        compacted = await this.summaryCompact(context, options);
        break;
      case 'truncation':
        compacted = this.truncationCompact(context, options);
        break;
      case 'hybrid':
        compacted = await this.hybridCompact(context, options);
        break;
      default:
        compacted = this.truncationCompact(context, options);
    }
    
    const afterCount = compacted.length;
    const afterSize = JSON.stringify(compacted).length;
    
    const record = {
      timestamp: new Date().toISOString(),
      strategy,
      beforeCount,
      afterCount,
      beforeSize,
      afterSize,
      compressionRatio: afterSize / beforeSize
    };
    
    this.compactionHistory.unshift(record);
    if (this.compactionHistory.length > this.maxHistory) {
      this.compactionHistory = this.compactionHistory.slice(0, this.maxHistory);
    }
    
    return compacted;
  }
  
  /**
   * Smart compaction - preserve important messages
   */
  async smartCompact(context, options = {}) {
    const messagesToKeep = options.keepLast || this.minMessagesToKeep;
    const preserveSystem = options.preserveSystem !== false;
    
    // Always keep system messages and recent messages
    const systemMessages = preserveSystem 
      ? context.filter(m => m.role === 'system')
      : [];
    const recentMessages = context.slice(-messagesToKeep);
    
    // Middle section to compact
    const middleStart = systemMessages.length;
    const middleEnd = context.length - messagesToKeep;
    const middleSection = context.slice(middleStart, middleEnd);
    
    if (middleSection.length === 0) {
      return context;
    }
    
    // Score each message for importance
    const scored = middleSection.map((msg, idx) => ({
      message: msg,
      score: this.scoreMessageImportance(msg, idx, middleSection),
      index: idx
    }));
    
    // Keep top 50% by importance
    scored.sort((a, b) => b.score - a.score);
    const keepCount = Math.max(3, Math.floor(middleSection.length * this.compressionRatio));
    const topMessages = scored.slice(0, keepCount).sort((a, b) => a.index - b.index);
    
    // Summarize removed messages
    const removedMessages = middleSection.filter((_, idx) => 
      !topMessages.some(t => t.index === idx)
    );
    
    const summary = this.generateLocalSummary(removedMessages);
    
    // Reconstruct context
    const result = [
      ...systemMessages,
      ...(summary ? [{
        role: 'system',
        content: `[${removedMessages.length} messages summarized]: ${summary}`,
        compacted: true,
        originalCount: removedMessages.length
      }] : []),
      ...topMessages.map(t => t.message),
      ...recentMessages
    ];
    
    return result;
  }
  
  /**
   * Score message importance
   */
  scoreMessageImportance(message, index, allMessages) {
    let score = 0;
    
    // Recent messages more important
    score += (index / allMessages.length) * 20;
    
    // Longer messages may have more substance
    score += Math.min(20, (message.content?.length || 0) / 100);
    
    // Messages with tool calls are important
    if (message.toolCalls && message.toolCalls.length > 0) {
      score += 30;
    }
    
    // Messages with errors are important
    if (message.error || message.blocked) {
      score += 25;
    }
    
    // User questions are important
    if (message.role === 'user' && message.content?.includes('?')) {
      score += 15;
    }
    
    // Messages with key terms
    const keyTerms = ['decision', 'agreed', 'conclusion', 'final', 'important'];
    if (keyTerms.some(term => message.content?.toLowerCase().includes(term))) {
      score += 20;
    }
    
    return score;
  }
  
  /**
   * Generate local summary without LLM
   */
  generateLocalSummary(messages) {
    const topics = new Set();
    const tools = new Set();
    let hasError = false;
    
    for (const msg of messages) {
      // Extract topics (capitalized phrases)
      const matches = msg.content?.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
      if (matches) {
        matches.slice(0, 3).forEach(t => topics.add(t));
      }
      
      // Collect tools used
      if (msg.toolCalls) {
        msg.toolCalls.forEach(t => tools.add(t.tool));
      }
      
      // Check for errors
      if (msg.error || msg.blocked) hasError = true;
    }
    
    const parts = [];
    if (topics.size > 0) {
      parts.push(`Discussed: ${Array.from(topics).slice(0, 5).join(', ')}`);
    }
    if (tools.size > 0) {
      parts.push(`Used: ${Array.from(tools).join(', ')}`);
    }
    if (hasError) {
      parts.push('(some errors encountered)');
    }
    
    return parts.join('. ') || 'General conversation';
  }
  
  /**
   * Summary compaction - uses LLM to summarize
   */
  async summaryCompact(context, options = {}) {
    const messagesToKeep = options.keepLast || this.minMessagesToKeep;
    const preserveSystem = options.preserveSystem !== false;
    
    const systemMessages = preserveSystem 
      ? context.filter(m => m.role === 'system')
      : [];
    const recentMessages = context.slice(-messagesToKeep);
    
    const middleStart = systemMessages.length;
    const middleEnd = context.length - messagesToKeep;
    const toSummarize = context.slice(middleStart, middleEnd);
    
    if (toSummarize.length === 0) {
      return context;
    }
    
    // Generate summary (placeholder - would use LLM in practice)
    const summary = await this.summarizeWithLLM(toSummarize);
    
    return [
      ...systemMessages,
      {
        role: 'system',
        content: `[${toSummarize.length} previous messages summarized]: ${summary}`,
        compacted: true,
        originalCount: toSummarize.length
      },
      ...recentMessages
    ];
  }
  
  /**
   * Truncation compaction - simple cutoff
   */
  truncationCompact(context, options = {}) {
    const messagesToKeep = options.keepLast || this.minMessagesToKeep;
    const preserveSystem = options.preserveSystem !== false;
    
    const systemMessages = preserveSystem 
      ? context.filter(m => m.role === 'system')
      : [];
    const recentMessages = context.slice(-messagesToKeep);
    
    return [
      ...systemMessages,
      {
        role: 'system',
        content: `[${context.length - systemMessages.length - messagesToKeep} earlier messages truncated]`,
        compacted: true
      },
      ...recentMessages
    ];
  }
  
  /**
   * Hybrid compaction - combines multiple strategies
   */
  async hybridCompact(context, options = {}) {
    // First pass: smart compact
    let compacted = await this.smartCompact(context, options);
    
    // If still too large, truncate
    const status = this.shouldCompact(compacted, options.maxSize || 100000);
    if (status.needed) {
      compacted = this.truncationCompact(compacted, options);
    }
    
    return compacted;
  }
  
  /**
   * Summarize messages using LLM (placeholder)
   */
  async summarizeWithLLM(messages) {
    // In practice, this would call the LLM to summarize
    // For now, return a placeholder based on local analysis
    return this.generateLocalSummary(messages);
  }
  
  /**
   * Get compaction statistics
   */
  getStats() {
    if (this.compactionHistory.length === 0) {
      return { totalCompactions: 0 };
    }
    
    const total = this.compactionHistory.length;
    const avgRatio = this.compactionHistory.reduce((sum, h) => sum + h.compressionRatio, 0) / total;
    const avgMessagesRemoved = this.compactionHistory.reduce((sum, h) => 
      sum + (h.beforeCount - h.afterCount), 0) / total;
    
    const strategies = {};
    for (const h of this.compactionHistory) {
      strategies[h.strategy] = (strategies[h.strategy] || 0) + 1;
    }
    
    return {
      totalCompactions: total,
      averageCompressionRatio: avgRatio,
      averageMessagesRemoved: Math.round(avgMessagesRemoved),
      strategies,
      lastCompaction: this.compactionHistory[0]?.timestamp
    };
  }
  
  /**
   * Get compaction history
   */
  getHistory(limit = 20) {
    return this.compactionHistory.slice(0, limit);
  }
  
  /**
   * Estimate compaction effect
   */
  estimateCompaction(context, strategy = 'smart') {
    const beforeSize = JSON.stringify(context).length;
    const beforeCount = context.length;
    
    // Rough estimates based on strategy
    const ratios = {
      smart: 0.5,
      summary: 0.3,
      truncation: 0.2,
      hybrid: 0.35
    };
    
    const estimatedRatio = ratios[strategy] || 0.5;
    const estimatedSize = beforeSize * estimatedRatio;
    const estimatedCount = Math.max(this.minMessagesToKeep, beforeCount * estimatedRatio);
    
    return {
      beforeSize,
      estimatedSize,
      beforeCount,
      estimatedCount,
      estimatedReduction: beforeSize - estimatedSize
    };
  }
}

module.exports = { ContextCompactionV2 };