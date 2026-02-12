/**
 * Checkpoint System
 * 
 * Save and restore agent state at milestones.
 * Enables rollback to known good states.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CheckpointSystem {
  constructor(options = {}) {
    this.checkpointsDir = options.checkpointsDir || './data/checkpoints';
    this.maxCheckpoints = options.maxCheckpoints || 50;
    this.autoCleanup = options.autoCleanup !== false;
    this.compression = options.compression || false;
    
    this.ensureDirectory();
  }
  
  ensureDirectory() {
    if (!fs.existsSync(this.checkpointsDir)) {
      fs.mkdirSync(this.checkpointsDir, { recursive: true });
    }
  }
  
  /**
   * Create a checkpoint of current agent state
   */
  async createCheckpoint(agent, options = {}) {
    const timestamp = new Date().toISOString();
    const id = this.generateId();
    
    // Gather state from agent
    const state = {
      id,
      timestamp,
      message: options.message || 'Manual checkpoint',
      tags: options.tags || [],
      
      // Core state
      sessionId: agent.sessionId,
      identity: agent.identity,
      context: agent.context,
      
      // Git memory state
      gitMemory: agent.gitMemory ? {
        memoryPath: agent.gitMemory.memoryPath,
        lastCommit: agent.gitMemory.getLastCommit ? agent.gitMemory.getLastCommit() : null,
        stats: agent.gitMemory.stats()
      } : null,
      
      // Secrets state (metadata only, not actual values)
      secrets: agent.secrets ? {
        hasSECRETS: !!agent.secrets.secrets,
        hasLLM_SECRETS: !!agent.secrets.llmSecrets,
        filteredKeysCount: agent.secrets.filteredKeys?.length || 0,
        llmSecretsCount: Object.keys(agent.secrets.getAllLLMSeccrets?.() || {}).length
      } : null,
      
      // Scheduler state
      scheduler: agent.schedulerV2 ? {
        totalJobs: agent.schedulerV2.getStats().totalJobs,
        activeJobs: agent.schedulerV2.getStats().activeJobs
      } : null,
      
      // Bat-Gadgets state
      batGadgets: agent.batGadgetRegistry ? {
        equippedCount: agent.batGadgetRegistry.getStatus().equipped,
        gadgets: agent.batGadgetRegistry.getStatus().gadgets
      } : null,
      
      // Custom state from options
      customState: options.customState || {}
    };
    
    // Calculate hash for integrity
    state.hash = this.calculateHash(state);
    
    // Save checkpoint
    const checkpointPath = path.join(this.checkpointsDir, `${id}.json`);
    fs.writeFileSync(checkpointPath, JSON.stringify(state, null, 2));
    
    // Cleanup old checkpoints if needed
    if (this.autoCleanup) {
      this.cleanupOldCheckpoints();
    }
    
    return {
      id,
      timestamp,
      path: checkpointPath,
      size: fs.statSync(checkpointPath).size,
      state
    };
  }
  
  /**
   * Restore agent from checkpoint
   */
  async restoreCheckpoint(checkpointId, agent, options = {}) {
    const checkpointPath = path.join(this.checkpointsDir, `${checkpointId}.json`);
    
    if (!fs.existsSync(checkpointPath)) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }
    
    const state = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
    
    // Verify integrity
    const currentHash = this.calculateHash(state);
    if (currentHash !== state.hash) {
      throw new Error('Checkpoint integrity check failed - may be corrupted');
    }
    
    // Restore state to agent
    if (options.restoreContext !== false) {
      agent.context = state.context || [];
    }
    
    if (options.restoreIdentity !== false && state.identity) {
      agent.identity = state.identity;
    }
    
    if (options.restoreSession !== false && state.sessionId) {
      agent.sessionId = state.sessionId;
    }
    
    // Restore custom state if provided
    if (options.onRestore && typeof options.onRestore === 'function') {
      await options.onRestore(state.customState);
    }
    
    return {
      restored: true,
      checkpointId,
      timestamp: state.timestamp,
      message: state.message,
      tags: state.tags
    };
  }
  
  /**
   * List all available checkpoints
   */
  listCheckpoints(options = {}) {
    const files = fs.readdirSync(this.checkpointsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(this.checkpointsDir, f);
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const stats = fs.statSync(fullPath);
        
        return {
          id: content.id,
          timestamp: content.timestamp,
          message: content.message,
          tags: content.tags,
          size: stats.size,
          created: stats.birthtime
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (options.tag) {
      return files.filter(f => f.tags.includes(options.tag));
    }
    
    if (options.limit) {
      return files.slice(0, options.limit);
    }
    
    return files;
  }
  
  /**
   * Get checkpoint details
   */
  getCheckpoint(checkpointId) {
    const checkpointPath = path.join(this.checkpointsDir, `${checkpointId}.json`);
    
    if (!fs.existsSync(checkpointPath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
  }
  
  /**
   * Delete a checkpoint
   */
  deleteCheckpoint(checkpointId) {
    const checkpointPath = path.join(this.checkpointsDir, `${checkpointId}.json`);
    
    if (fs.existsSync(checkpointPath)) {
      fs.unlinkSync(checkpointPath);
      return true;
    }
    
    return false;
  }
  
  /**
   * Delete checkpoints by tag
   */
  deleteCheckpointsByTag(tag) {
    const checkpoints = this.listCheckpoints({ tag });
    let deleted = 0;
    
    for (const cp of checkpoints) {
      if (this.deleteCheckpoint(cp.id)) {
        deleted++;
      }
    }
    
    return deleted;
  }
  
  /**
   * Compare two checkpoints
   */
  compareCheckpoints(checkpointId1, checkpointId2) {
    const cp1 = this.getCheckpoint(checkpointId1);
    const cp2 = this.getCheckpoint(checkpointId2);
    
    if (!cp1 || !cp2) {
      throw new Error('One or both checkpoints not found');
    }
    
    return {
      timestamp1: cp1.timestamp,
      timestamp2: cp2.timestamp,
      contextDiff: {
        messages1: cp1.context?.length || 0,
        messages2: cp2.context?.length || 0,
        diff: (cp2.context?.length || 0) - (cp1.context?.length || 0)
      },
      gitMemoryDiff: {
        commits1: cp1.gitMemory?.stats?.totalCommits || 0,
        commits2: cp2.gitMemory?.stats?.totalCommits || 0,
        diff: (cp2.gitMemory?.stats?.totalCommits || 0) - 
              (cp1.gitMemory?.stats?.totalCommits || 0)
      },
      schedulerDiff: {
        jobs1: cp1.scheduler?.totalJobs || 0,
        jobs2: cp2.scheduler?.totalJobs || 0,
        diff: (cp2.scheduler?.totalJobs || 0) - (cp1.scheduler?.totalJobs || 0)
      }
    };
  }
  
  /**
   * Export checkpoint to file
   */
  exportCheckpoint(checkpointId, exportPath) {
    const checkpoint = this.getCheckpoint(checkpointId);
    
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }
    
    fs.writeFileSync(exportPath, JSON.stringify(checkpoint, null, 2));
    return exportPath;
  }
  
  /**
   * Import checkpoint from file
   */
  importCheckpoint(importPath, options = {}) {
    const checkpoint = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    
    if (!checkpoint.id || !checkpoint.timestamp) {
      throw new Error('Invalid checkpoint file');
    }
    
    // Generate new ID to avoid collisions
    if (options.newId) {
      checkpoint.id = this.generateId();
    }
    
    const checkpointPath = path.join(this.checkpointsDir, `${checkpoint.id}.json`);
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
    
    return checkpoint.id;
  }
  
  /**
   * Get checkpoint statistics
   */
  getStats() {
    const checkpoints = this.listCheckpoints();
    const totalSize = checkpoints.reduce((sum, cp) => sum + cp.size, 0);
    
    return {
      total: checkpoints.length,
      totalSize,
      averageSize: checkpoints.length > 0 ? Math.round(totalSize / checkpoints.length) : 0,
      oldest: checkpoints[checkpoints.length - 1]?.timestamp,
      newest: checkpoints[0]?.timestamp,
      tags: [...new Set(checkpoints.flatMap(cp => cp.tags))]
    };
  }
  
  /**
   * Cleanup old checkpoints
   */
  cleanupOldCheckpoints() {
    const checkpoints = this.listCheckpoints();
    
    if (checkpoints.length <= this.maxCheckpoints) {
      return 0;
    }
    
    const toDelete = checkpoints.slice(this.maxCheckpoints);
    let deleted = 0;
    
    for (const cp of toDelete) {
      if (this.deleteCheckpoint(cp.id)) {
        deleted++;
      }
    }
    
    return deleted;
  }
  
  /**
   * Auto-create checkpoint before risky operations
   */
  async autoCheckpoint(agent, operation, options = {}) {
    return await this.createCheckpoint(agent, {
      message: `Auto-checkpoint before: ${operation}`,
      tags: ['auto', operation, ...(options.tags || [])],
      ...options
    });
  }
  
  /**
   * Generate unique checkpoint ID
   */
  generateId() {
    return `cp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * Calculate hash for integrity checking
   */
  calculateHash(state) {
    const stateWithoutHash = { ...state };
    delete stateWithoutHash.hash;
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(stateWithoutHash))
      .digest('hex')
      .substring(0, 16);
  }
}

module.exports = { CheckpointSystem };