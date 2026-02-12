# FORTRESS ZAG STANDALONE v4.0

**A fully autonomous, security-hardened AI assistant with Git-backed memory and cloud compute capability.**

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)]()
[![Security](https://img.shields.io/badge/security-hardened-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)]()

## 🚀 What's New in v4.0

### ✅ Git-Backed Memory System
- **Repository as state** - Memory stored in git commits
- **Fork = clone agent** - Clone by forking the repo
- **Full audit trail** - Every change tracked in git history
- **Rollback capability** - Revert to any previous state
- **Sync across instances** - Pull/push memory between deployments

### ✅ Two-Tier Secrets Manager
- **SECRETS** - Filtered from LLM (API keys, tokens)
- **LLM_SECRETS** - Accessible to LLM (browser logins, skill keys)
- **Automatic filtering** - Protected keys never exposed to bash
- **Base64 encoding** - Secure storage in environment variables
- **Runtime validation** - Check required secrets on startup

### ✅ GitHub Actions Cloud Compute
- **Free tier compute** - Run on GitHub Actions runners
- **Automatic commits** - Changes committed back to repo
- **Workflow dispatch** - Trigger jobs via API or UI
- **Branch-based jobs** - Create `job/` branches for tasks
- **Scalable execution** - Parallel job support

### ✅ Enhanced Browser Automation
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
- **Git history** viewer
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
- `exec` - Command execution (sandboxed, filtered env)
- `web_fetch` - Fetch web content
- `web_search` - Search the web
- `browser_navigate` - Browse websites
- `browser_click` / `browser_type` - Web automation
- `list` / `search` - Directory operations
- `schedule` - Create scheduled tasks
- **v4.0:** `memory_read` / `memory_append` / `memory_history` / `memory_rollback`
- **v4.0:** `git_commit` / `git_status`

### 🔒 Security (3-Layer Defense)
1. **Perimeter** - Input sanitization, prompt injection detection
2. **Validator** - Command validation, path traversal prevention
3. **Sandbox** - Docker/Firejail/Process isolation
4. **v4.0:** Two-tier secrets - Protected keys filtered from LLM bash

### 💬 Interfaces
- **CLI** - Interactive terminal
- **Telegram** - Bot integration
- **Discord** - Bot integration
- **Web UI** - Browser interface
- **REST API** - Programmatic access
- **v4.0:** GitHub Actions - Cloud compute integration

### 🧠 Intelligence
- **Continuous Learning v2** - Auto-pattern extraction
- **Context Compaction** - Smart memory management
- **Multi-Agent** - PM2-style orchestration
- **MCP Integration** - External tool protocol
- **v4.0:** Git-backed Memory - Full history, rollback, sync

## 📦 Installation

### Prerequisites
- Node.js 18+
- Git repository (for git-backed memory)
- (Optional) Playwright for browser automation: `npx playwright install chromium`

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd fortress-zag-standalone

# Install dependencies
npm install

# Initialize git-backed memory
npm run git:init

# Configure
cp config.example.json config.json
# Edit config.json with your API keys

# Run
npm start
```

### v4.0: Secrets Setup

Create a `.env` file or set environment variables:

```bash
# Base64-encoded JSON with protected secrets
export SECRETS=$(echo '{"GITHUB_TOKEN":"ghp_...","OPENAI_API_KEY":"sk-..."}' | base64)

# Base64-encoded JSON with LLM-accessible secrets
export LLM_SECRETS=$(echo '{"WEATHER_API_KEY":"...","NOTION_TOKEN":"..."}' | base64)
```

Or use the setup script:
```bash
npm run setup
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
    },
    "githubActions": {
      "enabled": true
    }
  },
  
  "security": {
    "level": "hardened",
    "twoTierSecrets": true
  },
  
  "memory": {
    "gitBacked": true,
    "memoryPath": "operating_system/MEMORY.md",
    "autoCommit": true
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

### v4.0: Git-Backed Memory
```bash
# View memory history
Zag> Show me my memory history
Zag: Here are the last 10 commits to your memory...

# Rollback to previous state
Zag> Rollback memory to commit abc123
Zag: Memory rolled back successfully. Current state restored from abc123.

# Sync with remote
Zag> Sync memory
Zag: Memory synced. Pulled 3 new commits from origin.
```

### Web UI
Open browser to `http://localhost:3000`

Features:
- Chat interface with real-time responses
- View agent status and git memory stats
- Browse memory logs and git history
- Monitor security status
- View two-tier secrets configuration

### Telegram Bot
1. Create bot with [@BotFather](https://t.me/botfather)
2. Add token to config
3. Start with `npm start`

### Discord Bot
1. Create bot at [discord.com/developers](https://discord.com/developers)
2. Add token to config
3. Invite bot to server
4. Start with `npm start`

### v4.0: GitHub Actions Cloud Compute

#### Trigger via Web UI
```bash
# Go to your repo on GitHub
# Navigate to Actions → Run Fortress Zag v4.0 Job
# Enter job description and click Run
```

#### Trigger via API
```bash
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/run-job.yml/dispatches \
  -d '{"ref":"main","inputs":{"job_description":"Analyze the codebase and suggest improvements"}}'
```

#### Branch-Based Jobs
```bash
# Create a job branch
git checkout -b job/analyze-codebase

# Push to trigger GitHub Actions
git push origin job/analyze-codebase

# Agent will run and commit results back to the branch
```

## 🔧 Advanced Features

### v4.0: Git-Backed Memory Operations

```javascript
// Read current memory
const memory = agent.gitMemory.read();

// Append to memory and auto-commit
agent.gitMemory.append("New insight: ...", { 
  description: "Added insight about project" 
});

// View history
const history = agent.gitMemory.history({ limit: 20 });

// Get memory at specific commit
const oldMemory = agent.gitMemory.getAtCommit("abc123");

// Rollback to previous state
agent.gitMemory.rollback("abc123", "Reverting bad change");

// Export state (for forking/cloning)
const state = agent.exportState();

// Import state (from fork/clone)
agent.importState(state);
```

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

const agent = new FortressZag({ 
  workdir: './data',
  repoRoot: process.cwd()
});

await agent.initialize();

const response = await agent.processMessage({
  text: "What's the weather?",
  source: 'api'
});

console.log(response.text);

// Check git memory stats
console.log(agent.gitMemory.stats());

// Check secrets status
console.log('LLM Secrets:', Object.keys(agent.secrets.getAllLLMSecrets()));
```

## 🐳 Docker Deployment

```bash
# Build
docker build -t fortress-zag .

# Run with environment variables
docker run -d \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.git:/app/.git \
  -p 3000:3000 \
  -e SECRETS="$(echo '{...}' | base64)" \
  -e LLM_SECRETS="$(echo '{...}' | base64)" \
  fortress-zag
```

## ☁️ GitHub Actions Deployment

### Setup
1. Fork this repository
2. Add secrets in GitHub Settings → Secrets:
   - `SECRETS` - Base64-encoded protected secrets
   - `LLM_SECRETS` - Base64-encoded LLM secrets
   - `GITHUB_TOKEN` - Automatically provided

3. Enable GitHub Actions

### Usage
- Create `job/` branches to trigger automatic execution
- Use workflow dispatch for manual jobs
- Results committed back to repository

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
| **v4.0:** Git-Backed Memory | ❌ | ✅ Full history |
| **v4.0:** Two-Tier Secrets | ❌ | ✅ Protected keys |
| **v4.0:** Cloud Compute | ❌ | ✅ GitHub Actions |
| **v4.0:** Fork = Clone | ❌ | ✅ By design |

## 🔐 Security Features

- **Input Sanitization** - Removes zero-width chars, detects injection
- **Command Validation** - Blocks dangerous commands
- **Path Restrictions** - Sandboxed to workspace only
- **Network Controls** - Whitelist-based outbound
- **Audit Logging** - All actions logged
- **Sandbox Execution** - Isolated process/container
- **v4.0:** Two-Tier Secrets - Protected keys filtered from LLM bash
- **v4.0:** Git Audit Trail - Every change tracked in commits

## 📝 Project Structure

```
fortress-zag-standalone/
├── .github/
│   └── workflows/
│       └── run-job.yml       # GitHub Actions cloud compute
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
│   │   ├── sandbox.js        # Layer 3 sandbox
│   │   └── secrets-manager.js # v4.0: Two-tier secrets
│   ├── memory/
│   │   └── git-backed.js     # v4.0: Git-backed memory
│   └── index.js              # Main entry
├── skills/                    # Enhancement skills
├── data/                      # Runtime data (created)
├── operating_system/          # v4.0: Memory, SOUL, SKILLS
│   ├── MEMORY.md             # Git-backed memory file
│   └── SOUL.md               # Agent identity
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

### v4.0: Adding Memory Tools
Edit `src/core/agent.js` in the `executeTool` method:

```javascript
if (toolName === 'my_memory_tool') {
  // Implementation using this.gitMemory
  return { success: true, result };
}
```

## 📄 License

MIT - Use freely, modify as needed.

---

**Built by Zag for Zak. 🦇**

*"The unbound familiar, now fortress-hardened, git-backed, and cloud-ready."*