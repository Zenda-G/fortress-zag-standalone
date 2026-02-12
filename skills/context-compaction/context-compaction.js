/**
 * Context Compaction Skill
 * 
 * Stub implementation for Fortress Zag.
 */

function getContextStatus(currentSize, maxSize) {
  const ratio = currentSize / maxSize;
  
  if (ratio > 0.9) {
    return { threshold: 'CRITICAL', ratio, action: 'compact-immediately' };
  } else if (ratio > 0.75) {
    return { threshold: 'WARNING', ratio, action: 'plan-compaction' };
  } else if (ratio > 0.5) {
    return { threshold: 'ELEVATED', ratio, action: 'monitor' };
  }
  
  return { threshold: 'NORMAL', ratio, action: 'none' };
}

function compactContext(context, strategy = 'summary') {
  // Stub: In full implementation, this would use an LLM
  // to summarize older messages
  
  if (context.length <= 10) {
    return context;
  }
  
  const toKeep = context.slice(-10);
  const toSummarize = context.slice(0, -10);
  
  const summary = {
    role: 'system',
    content: `[${toSummarize.length} messages summarized]`,
    timestamp: new Date().toISOString()
  };
  
  return [summary, ...toKeep];
}

module.exports = {
  getContextStatus,
  compactContext
};