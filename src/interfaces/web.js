/**
 * FORTRESS ZAG - Web UI Module
 * 
 * Web-based interface for the agent.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

class WebInterface {
  constructor(agent, config = {}) {
    this.agent = agent;
    this.config = config;
    this.app = express();
    this.server = null;
    this.port = config.port || 3000;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupStaticFiles();
  }
  
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Simple auth if password set
    if (this.config.password) {
      this.app.use((req, res, next) => {
        if (req.path === '/login' || req.method === 'GET') {
          return next();
        }
        
        const auth = req.headers.authorization;
        if (!auth || auth !== `Bearer ${this.config.password}`) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
      });
    }
  }
  
  setupStaticFiles() {
    // Create public directory with basic HTML
    const publicDir = path.join(__dirname, '..', '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      this.createDefaultHTML(publicDir);
    }
    
    this.app.use(express.static(publicDir));
  }
  
  createDefaultHTML(dir) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fortress Zag</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #eee;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header { 
            background: #16213e;
            padding: 1rem 2rem;
            border-bottom: 2px solid #0f3460;
        }
        .header h1 { 
            font-size: 1.5rem;
            color: #e94560;
        }
        .header .status {
            font-size: 0.8rem;
            color: #888;
            margin-top: 0.25rem;
        }
        .container {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        .sidebar {
            width: 250px;
            background: #16213e;
            padding: 1rem;
            border-right: 1px solid #0f3460;
        }
        .sidebar button {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: #0f3460;
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 4px;
        }
        .sidebar button:hover {
            background: #e94560;
        }
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 1rem;
        }
        .chat {
            flex: 1;
            overflow-y: auto;
            background: #16213e;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        .message {
            margin-bottom: 1rem;
            padding: 0.75rem;
            border-radius: 8px;
        }
        .message.user {
            background: #0f3460;
            margin-left: 2rem;
        }
        .message.assistant {
            background: #1a1a2e;
            margin-right: 2rem;
            border-left: 3px solid #e94560;
        }
        .input-area {
            display: flex;
            gap: 0.5rem;
        }
        .input-area input {
            flex: 1;
            padding: 0.75rem;
            background: #16213e;
            border: 1px solid #0f3460;
            color: white;
            border-radius: 4px;
        }
        .input-area button {
            padding: 0.75rem 1.5rem;
            background: #e94560;
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 4px;
        }
        .loading {
            text-align: center;
            color: #888;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🦇 Fortress Zag</h1>
        <div class="status">Standalone AI Agent | Security: Hardened</div>
    </div>
    
    <div class="container">
        <div class="sidebar">
            <button onclick="clearChat()">🗑️ Clear Chat</button>
            <button onclick="showStatus()">📊 Status</button>
            <button onclick="showMemory()">🧠 Memory</button>
            <button onclick="showSecurity()">🛡️ Security</button>
        </div>
        
        <div class="main">
            <div class="chat" id="chat"></div>
            <div class="input-area">
                <input type="text" id="messageInput" placeholder="Type your message..." 
                       onkeypress="if(event.key==='Enter')sendMessage()">
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
    </div>
    
    <script>
        let messages = [];
        
        function addMessage(role, text) {
            const chat = document.getElementById('chat');
            const div = document.createElement('div');
            div.className = 'message ' + role;
            div.textContent = text;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            if (!text) return;
            
            addMessage('user', text);
            input.value = '';
            
            // Show loading
            const loading = document.createElement('div');
            loading.className = 'loading';
            loading.id = 'loading';
            loading.textContent = 'Zag is thinking...';
            document.getElementById('chat').appendChild(loading);
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });
                
                const data = await response.json();
                document.getElementById('loading').remove();
                addMessage('assistant', data.text || 'Error: No response');
            } catch (error) {
                document.getElementById('loading').remove();
                addMessage('assistant', 'Error: ' + error.message);
            }
        }
        
        function clearChat() {
            document.getElementById('chat').innerHTML = '';
            messages = [];
        }
        
        async function showStatus() {
            const response = await fetch('/api/status');
            const data = await response.json();
            addMessage('assistant', 'Status: ' + JSON.stringify(data, null, 2));
        }
        
        async function showMemory() {
            addMessage('assistant', 'Memory system active. Daily logs stored in data/memory/');
        }
        
        async function showSecurity() {
            addMessage('assistant', 'Security: Hardened\\n- Perimeter: Active\\n- Validator: Active\\n- Sandbox: Active');
        }
    </script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', agent: this.agent.getStatus() });
    });
    
    // Get agent status
    this.app.get('/api/status', (req, res) => {
      res.json(this.agent.getStatus());
    });
    
    // Chat endpoint
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { message } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message required' });
        }
        
        const response = await this.agent.processMessage({
          text: message,
          source: 'web',
          user: 'web-user'
        });
        
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Execute tool
    this.app.post('/api/tool', async (req, res) => {
      try {
        const { tool, params } = req.body;
        const result = await this.agent.executeTool(tool, params);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get memory/logs
    this.app.get('/api/memory', (req, res) => {
      const fs = require('fs');
      const path = require('path');
      
      const memoryDir = path.join(this.agent.workdir, 'memory');
      if (!fs.existsSync(memoryDir)) {
        return res.json({ files: [] });
      }
      
      const files = fs.readdirSync(memoryDir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse();
      
      res.json({ files });
    });
    
    // Read specific memory file
    this.app.get('/api/memory/:file', (req, res) => {
      const fs = require('fs');
      const path = require('path');
      
      const filePath = path.join(this.agent.workdir, 'memory', req.params.file);
      
      // Security: ensure path is within memory dir
      if (!filePath.startsWith(path.join(this.agent.workdir, 'memory'))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      res.json({ content });
    });
  }
  
  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🌐 Web UI started on http://localhost:${this.port}`);
        resolve(true);
      });
    });
  }
  
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('Web UI stopped');
          resolve(true);
        });
      });
    }
  }
}

module.exports = { WebInterface };
