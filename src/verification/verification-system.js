/**
 * Verification System
 * 
 * Self-check mechanisms for validating agent outputs
 * before committing changes or finalizing actions.
 */

class VerificationSystem {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.strictMode = options.strictMode || false;
    this.checks = new Map();
    this.history = [];
    this.maxHistory = options.maxHistory || 100;
    
    // Register default checks
    this.registerDefaultChecks();
  }
  
  registerDefaultChecks() {
    // Code quality check
    this.registerCheck('code_quality', async (content, context) => {
      const issues = [];
      
      // Check for common code issues
      if (content.includes('console.log') && !context.allowConsole) {
        issues.push({
          severity: 'warning',
          message: 'Contains console.log statements',
          suggestion: 'Remove debug logging or use proper logger'
        });
      }
      
      if (content.includes('TODO') || content.includes('FIXME')) {
        issues.push({
          severity: 'info',
          message: 'Contains TODO/FIXME comments',
          suggestion: 'Address before committing or create issues'
        });
      }
      
      // Check for potential security issues
      if (content.includes('eval(') || content.includes('Function(')) {
        issues.push({
          severity: 'critical',
          message: 'Contains eval() or Function() constructor',
          suggestion: 'Use safer alternatives - major security risk'
        });
      }
      
      return {
        passed: !issues.some(i => i.severity === 'critical'),
        issues,
        score: Math.max(0, 100 - issues.length * 10)
      };
    });
    
    // Documentation check
    this.registerCheck('documentation', async (content, context) => {
      const issues = [];
      
      // Check for function/class documentation
      const hasJSDoc = content.includes('/**') && content.includes('*/');
      const hasComments = content.includes('//') || hasJSDoc;
      
      if (!hasComments && context.requiresDocs) {
        issues.push({
          severity: 'warning',
          message: 'Missing documentation',
          suggestion: 'Add JSDoc comments for public APIs'
        });
      }
      
      return {
        passed: true,
        issues,
        score: hasJSDoc ? 100 : hasComments ? 80 : 60
      };
    });
    
    // Security check
    this.registerCheck('security', async (content, context) => {
      const issues = [];
      const dangerousPatterns = [
        { pattern: /rm\s+-rf\s+\//, message: 'Dangerous rm -rf / detected' },
        { pattern: /DROP\s+TABLE/i, message: 'SQL DROP TABLE detected' },
        { pattern: /DELETE\s+FROM/i, message: 'SQL DELETE without WHERE check' },
        { pattern: /password\s*=\s*['"][^'"]+['"]/i, message: 'Hardcoded password detected' },
        { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/i, message: 'Hardcoded API key detected' }
      ];
      
      for (const { pattern, message } of dangerousPatterns) {
        if (pattern.test(content)) {
          issues.push({
            severity: 'critical',
            message,
            suggestion: 'Remove hardcoded secrets, use environment variables'
          });
        }
      }
      
      return {
        passed: issues.filter(i => i.severity === 'critical').length === 0,
        issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25)
      };
    });
    
    // Consistency check
    this.registerCheck('consistency', async (content, context) => {
      const issues = [];
      
      // Check for mixed quotes
      const hasSingleQuotes = content.includes("'");
      const hasDoubleQuotes = content.includes('"');
      const hasBackticks = content.includes('`');
      
      if ((hasSingleQuotes && hasDoubleQuotes) || 
          (hasSingleQuotes && hasBackticks) || 
          (hasDoubleQuotes && hasBackticks)) {
        issues.push({
          severity: 'info',
          message: 'Mixed quote styles detected',
          suggestion: 'Use consistent quote style (prefer single quotes)'
        });
      }
      
      // Check indentation consistency
      const lines = content.split('\n');
      const indentations = lines
        .filter(l => l.trim().length > 0)
        .map(l => l.match(/^(\s*)/)[1].length);
      
      const hasMixedIndent = indentations.some(i => i % 2 !== 0) && 
                            indentations.some(i => i % 4 !== 0) &&
                            indentations.some(i => i > 0);
      
      if (hasMixedIndent) {
        issues.push({
          severity: 'warning',
          message: 'Inconsistent indentation detected',
          suggestion: 'Use 2 or 4 spaces consistently'
        });
      }
      
      return {
        passed: true,
        issues,
        score: issues.length === 0 ? 100 : 85
      };
    });
  }
  
  /**
   * Register a custom verification check
   */
  registerCheck(name, checkFn) {
    this.checks.set(name, checkFn);
  }
  
  /**
   * Verify content against all enabled checks
   */
  async verify(content, options = {}) {
    if (!this.enabled) {
      return { passed: true, skipped: true, results: {} };
    }
    
    const checksToRun = options.checks || Array.from(this.checks.keys());
    const results = {};
    let allPassed = true;
    let totalScore = 0;
    
    for (const checkName of checksToRun) {
      const checkFn = this.checks.get(checkName);
      if (!checkFn) continue;
      
      try {
        const result = await checkFn(content, options.context || {});
        results[checkName] = result;
        
        if (!result.passed) {
          allPassed = false;
        }
        
        totalScore += result.score || 0;
      } catch (error) {
        results[checkName] = {
          passed: false,
          error: error.message,
          score: 0
        };
        allPassed = false;
      }
    }
    
    const avgScore = totalScore / checksToRun.length;
    const criticalIssues = Object.values(results)
      .flatMap(r => r.issues || [])
      .filter(i => i.severity === 'critical');
    
    const verification = {
      timestamp: new Date().toISOString(),
      passed: allPassed && criticalIssues.length === 0,
      score: Math.round(avgScore),
      totalChecks: checksToRun.length,
      criticalIssues: criticalIssues.length,
      results,
      duration: options.duration
    };
    
    this.recordHistory(verification);
    
    return verification;
  }
  
  /**
   * Quick verification with default settings
   */
  async quickVerify(content, type = 'code') {
    const checkMap = {
      code: ['code_quality', 'security', 'documentation'],
      config: ['security', 'consistency'],
      docs: ['documentation', 'consistency'],
      all: Array.from(this.checks.keys())
    };
    
    return await this.verify(content, { checks: checkMap[type] || checkMap.all });
  }
  
  /**
   * Verify before commit
   */
  async verifyBeforeCommit(changes, options = {}) {
    const verifications = [];
    
    for (const change of changes) {
      const type = this.detectContentType(change.content);
      const result = await this.quickVerify(change.content, type);
      
      verifications.push({
        file: change.file,
        type,
        ...result
      });
    }
    
    const allPassed = verifications.every(v => v.passed);
    const hasCritical = verifications.some(v => v.criticalIssues > 0);
    
    return {
      timestamp: new Date().toISOString(),
      canCommit: !this.strictMode || (allPassed && !hasCritical),
      verifications,
      summary: {
        total: verifications.length,
        passed: verifications.filter(v => v.passed).length,
        failed: verifications.filter(v => !v.passed).length,
        criticalIssues: verifications.reduce((sum, v) => sum + v.criticalIssues, 0)
      }
    };
  }
  
  /**
   * Detect content type for appropriate checks
   */
  detectContentType(content) {
    if (content.includes('function') || content.includes('class') || 
        content.includes('const') || content.includes('let')) {
      return 'code';
    }
    if (content.includes('{') && content.includes('}')) {
      return 'config';
    }
    return 'docs';
  }
  
  /**
   * Record verification history
   */
  recordHistory(verification) {
    this.history.unshift(verification);
    
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
  }
  
  /**
   * Get verification statistics
   */
  getStats() {
    const total = this.history.length;
    if (total === 0) return { total: 0 };
    
    const passed = this.history.filter(h => h.passed).length;
    const avgScore = this.history.reduce((sum, h) => sum + h.score, 0) / total;
    
    return {
      total,
      passed,
      failed: total - passed,
      passRate: Math.round((passed / total) * 100),
      averageScore: Math.round(avgScore),
      criticalIssues: this.history.reduce((sum, h) => sum + h.criticalIssues, 0)
    };
  }
  
  /**
   * Generate verification report
   */
  generateReport(verification) {
    const lines = [
      '# Verification Report',
      '',
      `**Status:** ${verification.passed ? '✅ PASSED' : '❌ FAILED'}`,
      `**Score:** ${verification.score}/100`,
      `**Timestamp:** ${verification.timestamp}`,
      `**Checks Run:** ${verification.totalChecks}`,
      `**Critical Issues:** ${verification.criticalIssues}`,
      ''
    ];
    
    for (const [checkName, result] of Object.entries(verification.results)) {
      lines.push(`## ${checkName}`);
      lines.push(`**Status:** ${result.passed ? '✅' : '❌'} | **Score:** ${result.score}/100`);
      
      if (result.issues && result.issues.length > 0) {
        lines.push('');
        lines.push('### Issues');
        for (const issue of result.issues) {
          const icon = issue.severity === 'critical' ? '🔴' : 
                      issue.severity === 'warning' ? '🟡' : '🔵';
          lines.push(`${icon} **${issue.severity.toUpperCase()}:** ${issue.message}`);
          lines.push(`   💡 ${issue.suggestion}`);
        }
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }
}

module.exports = { VerificationSystem };