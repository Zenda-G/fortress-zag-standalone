/**
 * Git-Backed Memory System
 * 
 * Memory stored in git commits. Fork = clone agent.
 * Full history, rollback capability, audit trail.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitBackedMemory {
  constructor(options = {}) {
    this.memoryPath = options.memoryPath || 'operating_system/MEMORY.md';
    this.skillsPath = options.skillsPath || 'operating_system/SKILLS';
    this.cronsPath = options.cronsPath || 'operating_system/CRONS.json';
    this.soulPath = options.soulPath || 'operating_system/SOUL.md';
    this.logsDir = options.logsDir || 'logs';
    this.repoRoot = options.repoRoot || process.cwd();
  }

  /**
   * Read current memory
   */
  read() {
    const fullPath = path.join(this.repoRoot, this.memoryPath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return '';
  }

  /**
   * Write memory and commit
   */
  write(content, jobInfo = {}) {
    const fullPath = path.join(this.repoRoot, this.memoryPath);
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write content
    fs.writeFileSync(fullPath, content, 'utf-8');
    
    // Commit
    this.commit(`memory: ${jobInfo.description || 'updated memory'}`, jobInfo);
    
    return true;
  }

  /**
   * Append to memory and commit
   */
  append(content, jobInfo = {}) {
    const current = this.read();
    const updated = current + '\n\n' + content;
    return this.write(updated, jobInfo);
  }

  /**
   * Commit changes to git
   */
  commit(message, jobInfo = {}) {
    try {
      execSync('git add -A', { cwd: this.repoRoot, stdio: 'pipe' });
      
      const fullMessage = jobInfo.jobId 
        ? `${message}\n\nJob-ID: ${jobInfo.jobId}\nTimestamp: ${new Date().toISOString()}`
        : message;
      
      execSync(`git commit -m "${fullMessage.replace(/"/g, '\\"')}"`, { 
        cwd: this.repoRoot, 
        stdio: 'pipe' 
      });
      
      execSync('git push', { cwd: this.repoRoot, stdio: 'pipe' });
      
      return true;
    } catch (error) {
      // Might fail if nothing to commit
      console.log('Git commit note:', error.message);
      return false;
    }
  }

  /**
   * Get memory history
   */
  history(options = {}) {
    const limit = options.limit || 50;
    try {
      const log = execSync(
        `git log --oneline -n ${limit} -- "${this.memoryPath}"`,
        { cwd: this.repoRoot, encoding: 'utf-8' }
      );
      return log.trim().split('\n').map(line => {
        const [hash, ...msgParts] = line.split(' ');
        return { hash, message: msgParts.join(' ') };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get memory at specific commit
   */
  getAtCommit(hash) {
    try {
      return execSync(
        `git show ${hash}:"${this.memoryPath}"`,
        { cwd: this.repoRoot, encoding: 'utf-8' }
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Rollback memory to specific commit
   */
  rollback(hash, reason = '') {
    try {
      const content = this.getAtCommit(hash);
      if (content) {
        this.write(content, { 
          description: `Rollback to ${hash}. ${reason}` 
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Rollback failed:', error.message);
      return false;
    }
  }

  /**
   * Diff memory between two commits
   */
  diff(hash1, hash2) {
    try {
      return execSync(
        `git diff ${hash1} ${hash2} -- "${this.memoryPath}"`,
        { cwd: this.repoRoot, encoding: 'utf-8' }
      );
    } catch (error) {
      return '';
    }
  }

  /**
   * Get memory stats
   */
  stats() {
    const history = this.history({ limit: 100 });
    const content = this.read();
    
    return {
      totalCommits: history.length,
      lastCommit: history[0] || null,
      memorySize: content.length,
      memoryLines: content.split('\n').length,
      memoryPath: this.memoryPath
    };
  }

  /**
   * Sync memory from remote
   */
  sync() {
    try {
      execSync('git pull --rebase', { cwd: this.repoRoot, stdio: 'pipe' });
      return { success: true, message: 'Synced from remote' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Export agent state (for forking)
   */
  exportState() {
    return {
      memory: this.read(),
      soul: this.readFile(this.soulPath),
      crons: this.readJSON(this.cronsPath),
      stats: this.stats()
    };
  }

  /**
   * Import agent state (from fork)
   */
  importState(state) {
    if (state.memory) {
      this.write(state.memory, { description: 'Imported from fork' });
    }
    if (state.soul) {
      this.writeFile(this.soulPath, state.soul);
    }
    if (state.crons) {
      this.writeJSON(this.cronsPath, state.crons);
    }
  }

  // Helper methods
  readFile(relativePath) {
    const fullPath = path.join(this.repoRoot, relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return null;
  }

  writeFile(relativePath, content) {
    const fullPath = path.join(this.repoRoot, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  readJSON(relativePath) {
    const content = this.readFile(relativePath);
    if (content) {
      try {
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  writeJSON(relativePath, data) {
    this.writeFile(relativePath, JSON.stringify(data, null, 2));
  }
}

module.exports = { GitBackedMemory };