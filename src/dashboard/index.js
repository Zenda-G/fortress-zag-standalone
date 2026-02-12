const express = require('express');
const path = require('path');
const { GitBackedMemory } = require('../memory/git-backed.js');

class MemoryDashboard {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.memory = new GitBackedMemory({
      memoryPath: options.memoryPath || 'operating_system/MEMORY.md',
      repoRoot: options.repoRoot || process.cwd()
    });
    
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // API routes
    this.app.get('/api/memory', this.getMemory.bind(this));
    this.app.get('/api/memory/history', this.getMemoryHistory.bind(this));
    this.app.get('/api/memory/stats', this.getMemoryStats.bind(this));
    this.app.post('/api/memory/append', this.appendMemory.bind(this));
    this.app.post('/api/memory/rollback', this.rollbackMemory.bind(this));
  }

  async getMemory(req, res) {
    try {
      const memoryContent = await this.memory.read();
      res.json({
        success: true,
        content: memoryContent,
        size: memoryContent ? memoryContent.length : 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMemoryHistory(req, res) {
    try {
      const history = await this.memory.history({
        limit: req.query.limit || 20,
        skip: req.query.skip || 0
      });
      
      res.json({
        success: true,
        history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMemoryStats(req, res) {
    try {
      const stats = this.memory.stats();
      const totalMemorySize = await this.getTotalMemorySize();
      
      res.json({
        success: true,
        stats: {
          ...stats,
          totalMemorySize,
          memoryFiles: await this.getMemoryFiles()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async appendMemory(req, res) {
    try {
      const { content, description } = req.body;
      await this.memory.append(content, { description });
      
      res.json({
        success: true,
        message: 'Memory appended successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async rollbackMemory(req, res) {
    try {
      const { commitHash, reason } = req.body;
      const success = await this.memory.rollback(commitHash, reason);
      
      res.json({
        success: true,
        message: success ? 'Memory rolled back successfully' : 'Rollback failed'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTotalMemorySize() {
    const memoryDir = this.memory.memoryPath.split('/').slice(0, -1).join('/');
    const files = await this.getMemoryFiles();
    let totalSize = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(memoryDir, file);
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
      } catch (error) {
        console.warn(`Could not read file ${file}:`, error.message);
      }
    }
    
    return totalSize;
  }

  async getMemoryFiles() {
    const memoryDir = this.memory.memoryPath.split('/').slice(0, -1).join('/');
    try {
      const files = await fs.promises.readdir(memoryDir);
      return files.filter(file => file.endsWith('.md'));
    } catch (error) {
      console.warn(`Could not read memory directory ${memoryDir}:`, error.message);
      return [];
    }
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Memory Dashboard running on http://localhost:${this.port}`);
        resolve();
      }).on('error', reject);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

module.exports = { MemoryDashboard };