# FORTRESS ZAG STANDALONE v3.0

**A fully autonomous, security-hardened AI assistant that runs without OpenClaw.**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)]()
[![Security](https://img.shields.io/badge/security-hardened-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)]()

## 🚀 What's New in v3.0

### ✅ Browser Automation
- **Web browsing** with Playwright/Chromium
- **Screenshot capture** of any webpage
- **Click and type** automation
- **Data extraction** from web pages
- **Sandboxed execution** for safety

### ✅ Scheduled Tasks (Cron)
- **Automated jobs** with natural language scheduling
- **"Every 5 minutes"**, **"Daily at 9am"**, **"Every hour"**
- **Persistent storage** of schedules
- **Execution logging** and monitoring
- **Web-triggered** or **time-based** tasks

### ✅ Web UI
- **Beautiful dark interface** (mobile-friendly)
- **Real-time chat** with the agent
- **Status monitoring** dashboard
- **Memory browser** to view logs
- **Secure** with optional password protection

## ✨ All Features

### 🤖 AI Models
- **OpenAI** - GPT-4, GPT-3.5
- **Anthropic** - Claude 3 (Sonnet, Opus, Haiku)
- **Moonshot** - Kimi K2.5
- **Ollama** - Local models (Llama, Mistral, etc.)
- **Automatic fallback** between providers

### 🛠️ Complete Tool Suite
- `read` / `write` / `edit` - File operations
- `exec` - Command execution (sandboxed)
- `web_fetch` - Fetch web content
- `web_search` - Search the web
- `browser_navigate` - Browse websites
- `browser_click` / `browser_type` - Web automation
- `list` / `search` - Directory operations
- `schedule` - Create scheduled tasks

### 🔒 Security (3-Layer Defense)
1. **Perimeter** - Input sanitization, prompt injection detection
2. **Validator** - Command validation, path traversal prevention
3. **Sandbox** - Docker/Firejail/Process isolation

### 💬 Interfaces
- **CLI** - Interactive terminal
- **Telegram** - Bot integration
- **Discord** - Bot integration
- **Web UI** - Browser interface (NEW!)
- **REST API** - Programmatic access

### 🧠 Intelligence
- **Continuous Learning v2** - Auto-pattern extraction
- **Context Compaction** - Smart memory management
- **Multi-Agent** - PM2-style orchestration
- **MCP Integration** - External tool protocol

## 📦 Installation

### Prerequisites
- Node.js 18+
- (Optional) Playwright for browser automation: `npx playwright install chromium`

### Quick Start

```bash
# Clone/copy the fortress-zag-standalone directory
cd fortress-zag-standalone

# Install dependencies
npm install

# Configure
cp config.example.json config.json
# Edit config.json with your API keys

# Run
npm start
```

### Configuration

Create `config.json`:

```json
{
  "models": {
    "defaultProvider": "openai",
    "openai": {
      "apiKey": "sk-your-key-here",
      "model": "gpt-4"
    },
    "anthropic": {
      "apiKey": "sk-ant-your-key-here",
      "model": "claude-3-sonnet-20240229"
    },
    "moonshot": {
      "apiKey": "sk-your-key-here",
      "model": "moonshot-v1-8k"
    },
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "model": "llama2"
    }
  },
  
  "interfaces": {
    "cli": { "enabled": true },
    "telegram": {
      "enabled": false,
      "token": "your-telegram-bot-token"
    },
    "discord": {
      "enabled": false,
      "token": "your-discord-bot-token"
    },
    "web": {
      "enabled": true,
      "port": 3000,
      "password": null
    }
  },
  
  "security": {
    "level": "hardened"
  }
}
```

## 🖥️ Usage

### CLI Mode
```bash
npm run cli

Zag> Check my email
Zag: I don't have access to your email, but I can help you with...
```

### Web UI
Open browser to `http://localhost:3000`

Features:
- Chat interface with real-time responses
- View agent status
- Browse memory logs
- Monitor security status

### Telegram Bot
1. Create bot with [@BotFather](https://t.me/botfather)
2. Add token to config
3. Start with `npm start`

### Discord Bot
1. Create bot at [discord.com/developers](https://discord.com/developers)
2. Add token to config
3. Invite bot to server
4. Start with `npm start`

## 🔧 Advanced Features

### Browser Automation
```javascript
// Navigate and screenshot
await agent.executeTool('browser_navigate', {
  url: 'https://example.com',
  screenshot: true
});

// Click element
await agent.executeTool('browser_click', {
  url: 'https://example.com',
  selector: 'button.submit'
});

// Extract data
await agent.executeTool('browser_extract', {
  url: 'https://example.com',
  selector: 'h1'
});
```

### Scheduled Tasks
```javascript
// Schedule a task
await agent.executeTool('schedule', {
  id: 'daily-backup',
  expression: 'daily at 9am',
  task: 'tar -czf backup.tar.gz ./workspace'
});

// List all schedules
await agent.executeTool('list_schedules', {});

// Remove schedule
await agent.executeTool('unschedule', { id: 'daily-backup' });
```

### Programmatic API
```javascript
const { FortressZag } = require('./src/core/agent');

const agent = new FortressZag({ workdir: './data' });
await agent.initialize();

const response = await agent.processMessage({
  text: "What's the weather?",
  source: 'api'
});

console.log(response.text);
```

## 🐳 Docker Deployment

```bash
# Build
docker build -t fortress-zag .

# Run with environment variables
docker run -d \
  -v $(pwd)/data:/app/data \
  -p 3000:3000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  fortress-zag
```

## 📊 Comparison with OpenClaw

| Feature | OpenClaw | Fortress Standalone |
|---------|----------|---------------------|
| **Framework** | Required | ❌ None |
| **Security** | Basic | ✅ 3-layer hardened |
| **Browser** | ✅ Native | ✅ Playwright |
| **Scheduler** | ✅ Native | ✅ Built-in |
| **Web UI** | ✅ Native | ✅ Built-in |
| **Portability** | Limited | ✅ Universal |
| **Control** | Framework | ✅ Full source |

## 🔐 Security Features

- **Input Sanitization** - Removes zero-width chars, detects injection
- **Command Validation** - Blocks dangerous commands
- **Path Restrictions** - Sandboxed to workspace only
- **Network Controls** - Whitelist-based outbound
- **Audit Logging** - All actions logged
- **Sandbox Execution** - Isolated process/container

## 📝 Project Structure

```
fortress-zag-standalone/
├── src/
│   ├── core/
│   │   ├── agent.js          # Main agent with all features
│   │   ├── tools.js          # Complete tool suite
│   │   ├── browser.js        # Browser automation
│   │   └── scheduler.js      # Cron-like scheduling
│   ├── models/
│   │   └── index.js          # Multi-provider LLM support
│   ├── interfaces/
│   │   ├── cli.js            # Terminal interface
│   │   ├── telegram.js       # Telegram bot
│   │   ├── discord.js        # Discord bot
│   │   └── web.js            # Web UI (Express)
│   ├── security/
│   │   ├── perimeter.js      # Layer 1 defense
│   │   ├── validator.js      # Layer 2 validation
│   │   └── sandbox.js        # Layer 3 sandbox
│   └── index.js              # Main entry
├── skills/                    # Enhancement skills
├── data/                      # Runtime data (created)
├── config.json               # Your configuration
└── README.md                 # This file
```

## 🛠️ Development

### Adding New Tools
Edit `src/core/tools.js`:

```javascript
async myNewTool({ param1, param2 }) {
  // Implementation
  return { success: true, result };
}
```

### Adding Model Providers
Edit `src/models/index.js`:

```javascript
class MyProviderConnector {
  async complete(messages, options) {
    // Implementation
  }
}
```

## 📄 License

MIT - Use freely, modify as needed.

---

**Built by Zag for Zak. 🦇**

*"The unbound familiar, now fortress-hardened and fully autonomous."*
