/**
 * FORTRESS ZAG - Complete Tool Suite
 * 
 * All tools needed for autonomous operation.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const Tools = {
  /**
   * Read a file
   */
  async read({ file_path, path: p, offset, limit }) {
    const targetPath = file_path || p;
    
    if (!fs.existsSync(targetPath)) {
      return { error: `File not found: ${targetPath}` };
    }
    
    try {
      let content = fs.readFileSync(targetPath, 'utf8');
      
      // Handle line offset/limit
      if (offset || limit) {
        const lines = content.split('\n');
        const start = (offset || 1) - 1;
        const end = limit ? start + limit : lines.length;
        content = lines.slice(start, end).join('\n');
      }
      
      return { content };
    } catch (error) {
      return { error: error.message };
    }
  },
  
  /**
   * Write to a file
   */
  async write({ file_path, path: p, content }) {
    const targetPath = file_path || p;
    
    try {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, content, 'utf8');
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  },
  
  /**
   * Edit a file (replace text)
   */
  async edit({ file_path, path: p, old_string, new_string, oldText, newText }) {
    const targetPath = file_path || p;
    const oldStr = old_string || oldText;
    const newStr = new_string || newText;
    
    try {
      let content = fs.readFileSync(targetPath, 'utf8');
      
      if (!content.includes(oldStr)) {
        return { error: 'Old text not found in file' };
      }
      
      content = content.replace(oldStr, newStr);
      fs.writeFileSync(targetPath, content, 'utf8');
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  },
  
  /**
   * Execute a command
   */
  async exec({ command, workdir, cwd, timeout = 30000 }) {
    const workingDir = workdir || cwd || process.cwd();
    
    try {
      const result = await execPromise(command, {
        cwd: workingDir,
        timeout: timeout,
        maxBuffer: 1024 * 1024 // 1MB output limit
      });
      
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: 0
      };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        error: error.message
      };
    }
  },
  
  /**
   * Fetch web content
   */
  async web_fetch({ url, maxChars = 50000 }) {
    const axios = require('axios');
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        maxContentLength: 10 * 1024 * 1024, // 10MB
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // Extract text content (basic HTML stripping)
      let content = response.data;
      
      if (typeof content === 'string' && content.includes('<')) {
        // Basic HTML to text conversion
        content = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // Truncate if too long
      if (content.length > maxChars) {
        content = content.substring(0, maxChars) + '\n\n... (truncated)';
      }
      
      return {
        content: content,
        url: response.config.url,
        status: response.status,
        contentType: response.headers['content-type']
      };
    } catch (error) {
      return {
        error: error.message,
        url: url
      };
    }
  },
  
  /**
   * Search the web (placeholder - requires API key)
   */
  async web_search({ query, count = 5 }) {
    // This is a placeholder - real implementation needs Brave/Google API
    return {
      error: 'Web search not configured. Set BRAVE_API_KEY or GOOGLE_API_KEY.',
      query,
      results: []
    };
  },
  
  /**
   * List directory contents
   */
  async list({ path: dirPath = '.' }) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      const files = entries
        .filter(e => e.isFile())
        .map(e => e.name);
      
      const directories = entries
        .filter(e => e.isDirectory())
        .map(e => e.name);
      
      return {
        path: dirPath,
        files,
        directories
      };
    } catch (error) {
      return { error: error.message };
    }
  },
  
  /**
   * Search in files
   */
  async search({ path: searchPath = '.', pattern, outputFormat = 'text' }) {
    try {
      const results = [];
      
      function searchDir(dir, regex) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            searchDir(fullPath, regex);
          } else if (entry.isFile()) {
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              const lines = content.split('\n');
              
              lines.forEach((line, index) => {
                if (regex.test(line)) {
                  results.push({
                    path: fullPath,
                    line: index + 1,
                    content: line.trim()
                  });
                }
              });
            } catch {
              // Skip binary or unreadable files
            }
          }
        }
      }
      
      const regex = new RegExp(pattern, 'i');
      searchDir(searchPath, regex);
      
      return {
        results: results.slice(0, 50), // Limit results
        total: results.length
      };
    } catch (error) {
      return { error: error.message };
    }
  }
};

/**
 * Execute a tool by name
 */
async function executeTool(toolName, params) {
  const tool = Tools[toolName];
  
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }
  
  try {
    return await tool(params);
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = { Tools, executeTool };
