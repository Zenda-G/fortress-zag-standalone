/**
 * Context-Aware Compaction
 * 
 * Smart context window management with proactive compaction.
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = getWorkspaceRoot();
const METRICS_FILE = path.join(WORKSPACE_ROOT, 'memory', 'context-metrics.json');
const COMPACTION_LOG = path.join(WORKSPACE_ROOT, 'memory', 'compaction-log.jsonl');

// Context limits (based on OpenClaw's 262k default)
const CONTEXT_LIMIT = 262000;
const THRESHOLDS = {
  GREEN: 0.50,
  YELLOW: 0.70,
  ORANGE: 0.80,
  RED: 0.90
};

function getWorkspaceRoot() {
  const cwd = process.cwd();
  if (cwd.includes('skills' + path.sep + 'context-compaction')) {
    return path.resolve(cwd, '..', '..');
  }
  return cwd;
}

// Load or init metrics
function loadMetrics() {
  if (!fs.existsSync(METRICS_FILE)) {
    const metrics = {
      version: '1.0',
      created: new Date().toISOString(),
      measurements: [],
      compactionCount: 0,
      lastCompaction: null
    };
    saveMetrics(metrics);
    return metrics;
  }
  return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
}

function saveMetrics(metrics) {
  fs.mkdirSync(path.dirname(METRICS_FILE), { recursive: true });
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
}

function logCompaction(event) {
  fs.appendFileSync(COMPACTION_LOG, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event
  }) + '\n');
}

/**
 * Record a context measurement
 */
function recordMeasurement(used, total = CONTEXT_LIMIT) {
  const metrics = loadMetrics();
  const usage = used / total;
  
  const measurement = {
    timestamp: new Date().toISOString(),
    used,
    total,
    usage,
    threshold: getThresholdLevel(usage)
  };
  
  metrics.measurements.push(measurement);
  
  // Keep last 100 measurements
  if (metrics.measurements.length > 100) {
    metrics.measurements = metrics.measurements.slice(-100);
  }
  
  saveMetrics(metrics);
  return measurement;
}

/**
 * Get threshold level from usage
 */
function getThresholdLevel(usage) {
  if (usage >= THRESHOLDS.RED) return 'CRITICAL';
  if (usage >= THRESHOLDS.ORANGE) return 'RED';
  if (usage >= THRESHOLDS.YELLOW) return 'ORANGE';
  if (usage >= THRESHOLDS.GREEN) return 'YELLOW';
  return 'GREEN';
}

/**
 * Get current context status
 */
function getContextStatus(currentUsed, currentTotal = CONTEXT_LIMIT) {
  const metrics = loadMetrics();
  const usage = currentUsed / currentTotal;
  const threshold = getThresholdLevel(usage);
  
  // Calculate burn rate (tokens per measurement)
  let burnRate = 0;
  let timeToOverflow = null;
  
  if (metrics.measurements.length >= 2) {
    const recent = metrics.measurements.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const timeDiff = new Date(last.timestamp) - new Date(first.timestamp);
    const tokenDiff = last.used - first.used;
    
    if (timeDiff > 0) {
      burnRate = tokenDiff / (timeDiff / 1000 / 60); // tokens per minute
      
      if (burnRate > 0) {
        const remaining = currentTotal - currentUsed;
        timeToOverflow = remaining / burnRate; // minutes
      }
    }
  }
  
  return {
    current: {
      used: currentUsed,
      total: currentTotal,
      usage,
      percentage: (usage * 100).toFixed(1) + '%'
    },
    threshold,
    burnRate: burnRate.toFixed(0),
    timeToOverflow: timeToOverflow ? timeToOverflow.toFixed(1) + ' min' : 'N/A',
    recommendation: getRecommendation(threshold, timeToOverflow),
    compactionCount: metrics.compactionCount,
    lastCompaction: metrics.lastCompaction
  };
}

/**
 * Get recommendation based on status
 */
function getRecommendation(threshold, timeToOverflow) {
  switch (threshold) {
    case 'CRITICAL':
      return {
        action: 'FORCE_COMPACT',
        urgency: 'immediate',
        message: 'Context critical! Compaction required NOW.'
      };
    case 'RED':
      return {
        action: 'COMPACT_NOW',
        urgency: 'high',
        message: 'Context high. Strongly recommend compaction.'
      };
    case 'ORANGE':
      return {
        action: 'SUGGEST_COMPACT',
        urgency: 'medium',
        message: 'Context elevated. Consider compaction soon.'
      };
    case 'YELLOW':
      return {
        action: 'MONITOR',
        urgency: 'low',
        message: 'Context rising. Monitor usage.'
      };
    default:
      return {
        action: 'NONE',
        urgency: 'none',
        message: 'Context healthy.'
      };
  }
}

/**
 * Analyze what can be compacted
 */
function analyzeCompaction(contextText) {
  const analysis = {
    totalLength: contextText.length,
    sections: [],
    suggestions: []
  };
  
  // Find file operations with large outputs
  const fileOpPattern = /<functions\.(read|write|edit)[\s\S]*?<\/functions\.(read|write|edit)>/g;
  const fileOps = contextText.match(fileOpPattern) || [];
  
  analysis.sections.push({
    type: 'file-operations',
    count: fileOps.length,
    estimatedSize: fileOps.reduce((sum, op) => sum + op.length, 0)
  });
  
  // Find web fetch results
  const webFetchPattern = /<functions\.web_fetch[\s\S]*?<\/functions\.web_fetch>/g;
  const webFetches = contextText.match(webFetchPattern) || [];
  
  analysis.sections.push({
    type: 'web-fetches',
    count: webFetches.length,
    estimatedSize: webFetches.reduce((sum, fetch) => sum + fetch.length, 0)
  });
  
  // Find code blocks
  const codeBlockPattern = /```[\s\S]*?```/g;
  const codeBlocks = contextText.match(codeBlockPattern) || [];
  
  analysis.sections.push({
    type: 'code-blocks',
    count: codeBlocks.length,
    estimatedSize: codeBlocks.reduce((sum, block) => sum + block.length, 0)
  });
  
  // Generate suggestions
  if (webFetches.length > 3) {
    analysis.suggestions.push({
      priority: 'high',
      action: 'Summarize web fetch results',
      potentialSavings: '20-40%'
    });
  }
  
  if (fileOps.length > 5) {
    analysis.suggestions.push({
      priority: 'medium',
      action: 'Archive file contents to memory files',
      potentialSavings: '15-25%'
    });
  }
  
  if (codeBlocks.length > 3) {
    analysis.suggestions.push({
      priority: 'low',
      action: 'Reference code files instead of inline blocks',
      potentialSavings: '10-20%'
    });
  }
  
  return analysis;
}

/**
 * Perform compaction (simulated - would integrate with OpenClaw's actual compaction)
 */
function compactContext(strategy = 'smart') {
  const metrics = loadMetrics();
  
  const compaction = {
    id: Date.now().toString(36),
    timestamp: new Date().toISOString(),
    strategy,
    results: {
      beforeSize: 0,
      afterSize: 0,
      savings: 0
    }
  };
  
  // Update metrics
  metrics.compactionCount++;
  metrics.lastCompaction = compaction.timestamp;
  saveMetrics(metrics);
  
  logCompaction({
    type: 'compaction-performed',
    strategy,
    compactionId: compaction.id
  });
  
  return compaction;
}

/**
 * Get compaction suggestions
 */
function getCompactionSuggestions(contextText) {
  const status = getContextStatus(contextText.length);
  const analysis = analyzeCompaction(contextText);
  
  return {
    status,
    analysis,
    actionable: status.threshold !== 'GREEN',
    suggestions: analysis.suggestions
  };
}

// Export API
module.exports = {
  recordMeasurement,
  getContextStatus,
  analyzeCompaction,
  compactContext,
  getCompactionSuggestions,
  getThresholdLevel,
  THRESHOLDS,
  CONTEXT_LIMIT,
  // Direct paths
  METRICS_FILE,
  COMPACTION_LOG
};

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  
  switch (cmd) {
    case 'status':
      console.log(JSON.stringify(getContextStatus(parseInt(args[1]) || 50000), null, 2));
      break;
    case 'record':
      console.log(recordMeasurement(parseInt(args[1]) || 50000));
      break;
    default:
      console.log('Usage: node context-compaction.js [status|record] <used-tokens>');
  }
}
