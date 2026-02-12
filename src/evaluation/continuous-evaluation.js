/**
 * Continuous Evaluation System
 * 
 * Automated quality checks on agent outputs.
 * Monitors performance and triggers alerts on degradation.
 */

const EventEmitter = require('events');

class ContinuousEvaluation extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.enabled = options.enabled !== false;
    this.evaluationInterval = options.evaluationInterval || 60000; // 1 minute
    this.metricsWindow = options.metricsWindow || 100; // Keep last 100 metrics
    
    this.metrics = [];
    this.thresholds = {
      minSuccessRate: options.minSuccessRate || 0.95,
      maxAvgLatency: options.maxAvgLatency || 5000, // 5 seconds
      minQualityScore: options.minQualityScore || 70,
      maxErrorRate: options.maxErrorRate || 0.05
    };
    
    this.evaluators = new Map();
    this.registerDefaultEvaluators();
    
    this.intervalId = null;
  }
  
  registerDefaultEvaluators() {
    // Response quality evaluator
    this.registerEvaluator('response_quality', (interaction) => {
      const scores = {
        length: Math.min(100, interaction.response?.length / 10),
        hasStructure: interaction.response?.includes('\n') ? 20 : 0,
        hasCode: interaction.response?.includes('```') ? 15 : 0,
        hasExplanation: interaction.response?.length > 100 ? 15 : 0
      };
      
      return {
        score: Object.values(scores).reduce((a, b) => a + b, 0),
        details: scores
      };
    });
    
    // Tool usage evaluator
    this.registerEvaluator('tool_usage', (interaction) => {
      const toolCalls = interaction.toolCalls || [];
      
      const scores = {
        appropriate: toolCalls.length > 0 && toolCalls.every(t => t.result?.success) ? 40 : 0,
        efficient: toolCalls.length <= 3 ? 30 : toolCalls.length <= 5 ? 20 : 10,
        noErrors: toolCalls.every(t => !t.result?.error) ? 30 : 0
      };
      
      return {
        score: Object.values(scores).reduce((a, b) => a + b, 0),
        details: scores,
        toolCount: toolCalls.length
      };
    });
    
    // Latency evaluator
    this.registerEvaluator('latency', (interaction) => {
      const latency = interaction.duration || 0;
      
      let score = 100;
      if (latency > 10000) score = 40;
      else if (latency > 5000) score = 60;
      else if (latency > 2000) score = 80;
      
      return {
        score,
        details: { latency, threshold: 5000 }
      };
    });
    
    // Context efficiency evaluator
    this.registerEvaluator('context_efficiency', (interaction) => {
      const contextSize = interaction.contextSize || 0;
      const maxSize = interaction.maxContextSize || 100000;
      
      const usagePercent = (contextSize / maxSize) * 100;
      
      let score = 100;
      if (usagePercent > 90) score = 50;
      else if (usagePercent > 75) score = 70;
      else if (usagePercent > 50) score = 85;
      
      return {
        score,
        details: { usagePercent, contextSize, maxSize }
      };
    });
    
    // Error rate evaluator
    this.registerEvaluator('error_rate', (interaction, history) => {
      const recent = history.slice(-10);
      const errors = recent.filter(i => i.error || i.blocked).length;
      const errorRate = errors / recent.length;
      
      return {
        score: (1 - errorRate) * 100,
        details: { errorRate, recentErrors: errors }
      };
    });
  }
  
  registerEvaluator(name, evaluatorFn) {
    this.evaluators.set(name, evaluatorFn);
  }
  
  /**
   * Record an interaction for evaluation
   */
  recordInteraction(interaction) {
    if (!this.enabled) return;
    
    const metric = {
      timestamp: new Date().toISOString(),
      sessionId: interaction.sessionId,
      duration: interaction.duration,
      response: interaction.response,
      toolCalls: interaction.toolCalls,
      contextSize: interaction.contextSize,
      maxContextSize: interaction.maxContextSize,
      error: interaction.error,
      blocked: interaction.blocked,
      
      // Evaluation results
      evaluations: this.evaluateInteraction(interaction),
      
      // Overall quality score
      qualityScore: 0
    };
    
    // Calculate overall quality score
    const evalScores = Object.values(metric.evaluations).map(e => e.score);
    metric.qualityScore = evalScores.reduce((a, b) => a + b, 0) / evalScores.length;
    
    this.metrics.push(metric);
    
    // Trim metrics window
    if (this.metrics.length > this.metricsWindow) {
      this.metrics = this.metrics.slice(-this.metricsWindow);
    }
    
    // Check thresholds
    this.checkThresholds(metric);
    
    return metric;
  }
  
  /**
   * Evaluate a single interaction
   */
  evaluateInteraction(interaction) {
    const results = {};
    
    for (const [name, evaluator] of this.evaluators) {
      try {
        results[name] = evaluator(interaction, this.metrics);
      } catch (error) {
        results[name] = {
          score: 0,
          error: error.message
        };
      }
    }
    
    return results;
  }
  
  /**
   * Check if metrics exceed thresholds
   */
  checkThresholds(metric) {
    const alerts = [];
    
    if (metric.qualityScore < this.thresholds.minQualityScore) {
      alerts.push({
        type: 'quality',
        severity: 'warning',
        message: `Quality score ${metric.qualityScore.toFixed(1)} below threshold ${this.thresholds.minQualityScore}`,
        metric
      });
    }
    
    if (metric.duration > this.thresholds.maxAvgLatency) {
      alerts.push({
        type: 'latency',
        severity: 'warning',
        message: `Latency ${metric.duration}ms exceeds threshold ${this.thresholds.maxAvgLatency}ms`,
        metric
      });
    }
    
    if (metric.error) {
      alerts.push({
        type: 'error',
        severity: 'critical',
        message: `Interaction error: ${metric.error}`,
        metric
      });
    }
    
    if (metric.blocked) {
      alerts.push({
        type: 'blocked',
        severity: 'warning',
        message: 'Interaction was blocked by security',
        metric
      });
    }
    
    // Emit alerts
    for (const alert of alerts) {
      this.emit('alert', alert);
    }
    
    return alerts;
  }
  
  /**
   * Get performance statistics
   */
  getStats(timeWindow = null) {
    let metrics = this.metrics;
    
    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow).toISOString();
      metrics = metrics.filter(m => m.timestamp > cutoff);
    }
    
    if (metrics.length === 0) {
      return { total: 0 };
    }
    
    const total = metrics.length;
    const successful = metrics.filter(m => !m.error && !m.blocked).length;
    const errors = metrics.filter(m => m.error).length;
    const blocked = metrics.filter(m => m.blocked).length;
    
    const avgQuality = metrics.reduce((sum, m) => sum + m.qualityScore, 0) / total;
    const avgDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / total;
    
    const contextUsage = metrics.map(m => ({
      timestamp: m.timestamp,
      size: m.contextSize,
      percent: m.maxContextSize ? (m.contextSize / m.maxContextSize) * 100 : 0
    }));
    
    // Evaluation breakdown
    const evaluationStats = {};
    for (const name of this.evaluators.keys()) {
      const scores = metrics
        .filter(m => m.evaluations[name])
        .map(m => m.evaluations[name].score);
      
      if (scores.length > 0) {
        evaluationStats[name] = {
          avg: scores.reduce((a, b) => a + b, 0) / scores.length,
          min: Math.min(...scores),
          max: Math.max(...scores)
        };
      }
    }
    
    return {
      total,
      successful,
      errors,
      blocked,
      successRate: (successful / total) * 100,
      errorRate: (errors / total) * 100,
      blockRate: (blocked / total) * 100,
      avgQualityScore: avgQuality,
      avgDuration,
      contextUsage,
      evaluationStats
    };
  }
  
  /**
   * Get trend analysis
   */
  getTrends(window1 = 300000, window2 = 600000) { // 5 min vs 10 min
    const now = Date.now();
    const recent = this.getStats(window1);
    const older = this.getStats(window2);
    
    return {
      quality: {
        recent: recent.avgQualityScore,
        older: older.avgQualityScore,
        trend: recent.avgQualityScore - older.avgQualityScore
      },
      latency: {
        recent: recent.avgDuration,
        older: older.avgDuration,
        trend: recent.avgDuration - older.avgDuration
      },
      successRate: {
        recent: recent.successRate,
        older: older.successRate,
        trend: recent.successRate - older.successRate
      }
    };
  }
  
  /**
   * Start continuous monitoring
   */
  start() {
    if (!this.enabled || this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      const stats = this.getStats(300000); // Last 5 minutes
      this.emit('periodic_report', stats);
      
      // Check for degrading trends
      const trends = this.getTrends();
      
      if (trends.quality.trend < -10) {
        this.emit('alert', {
          type: 'degrading_quality',
          severity: 'warning',
          message: 'Quality score degrading over time',
          trend: trends.quality
        });
      }
      
      if (trends.latency.trend > 1000) {
        this.emit('alert', {
          type: 'increasing_latency',
          severity: 'warning',
          message: 'Response latency increasing over time',
          trend: trends.latency
        });
      }
    }, this.evaluationInterval);
  }
  
  /**
   * Stop continuous monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Generate evaluation report
   */
  generateReport(timeWindow = null) {
    const stats = this.getStats(timeWindow);
    const trends = this.getTrends();
    
    const lines = [
      '# Continuous Evaluation Report',
      '',
      `**Period:** ${timeWindow ? `${timeWindow / 1000}s` : 'All time'}`,
      `**Generated:** ${new Date().toISOString()}`,
      '',
      '## Overview',
      '',
      `- **Total Interactions:** ${stats.total}`,
      `- **Success Rate:** ${stats.successRate?.toFixed(1)}%`,
      `- **Error Rate:** ${stats.errorRate?.toFixed(1)}%`,
      `- **Avg Quality Score:** ${stats.avgQualityScore?.toFixed(1)}/100`,
      `- **Avg Duration:** ${stats.avgDuration?.toFixed(0)}ms`,
      '',
      '## Trends (Last 5min vs 10min)',
      '',
      `| Metric | Recent | Older | Trend |`,
      `|--------|--------|-------|-------|`,
      `| Quality | ${trends.quality.recent?.toFixed(1)} | ${trends.quality.older?.toFixed(1)} | ${trends.quality.trend > 0 ? '↗️' : trends.quality.trend < 0 ? '↘️' : '➡️'} ${trends.quality.trend.toFixed(1)} |`,
      `| Latency | ${trends.latency.recent?.toFixed(0)}ms | ${trends.latency.older?.toFixed(0)}ms | ${trends.latency.trend > 0 ? '↗️' : trends.latency.trend < 0 ? '↘️' : '➡️'} ${trends.latency.trend.toFixed(0)}ms |`,
      `| Success | ${trends.successRate.recent?.toFixed(1)}% | ${trends.successRate.older?.toFixed(1)}% | ${trends.successRate.trend > 0 ? '↗️' : trends.successRate.trend < 0 ? '↘️' : '➡️'} ${trends.successRate.trend.toFixed(1)}% |`,
      '',
      '## Evaluation Breakdown',
      ''
    ];
    
    for (const [name, stat] of Object.entries(stats.evaluationStats || {})) {
      lines.push(`### ${name}`);
      lines.push(`- Average: ${stat.avg.toFixed(1)}`);
      lines.push(`- Range: ${stat.min.toFixed(1)} - ${stat.max.toFixed(1)}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Export metrics to file
   */
  exportMetrics(filePath) {
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(this.metrics, null, 2));
    return filePath;
  }
}

module.exports = { ContinuousEvaluation };