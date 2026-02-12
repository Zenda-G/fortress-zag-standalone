# FORTRESS ZAG STANDALONE v4.3

**A fully autonomous, security-hardened AI assistant with Verification, Checkpoints, Continuous Evaluation, Memory Dashboard, Task Scheduler V2, Git-backed memory, cloud compute, and Bat-Gadget Protocol.**

[![Version](https://img.shields.io/badge/version-4.3.0-blue.svg)]()
[![Security](https://img.shields.io/badge/security-hardened-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)]()

## 🚀 What's New in v4.3

### ✅ Verification System
- **Self-check before committing** - Validates code changes
- **Quality checks** - Code quality, documentation, consistency
- **Security scanning** - Detects dangerous patterns, hardcoded secrets
- **Pre-commit reports** - Comprehensive verification reports
- **Configurable strictness** - Warning or blocking mode

### ✅ Checkpoint System
- **Save agent state** at any milestone
- **Restore to previous** checkpoint instantly
- **Integrity verification** - SHA-256 hashes for corruption detection
- **Auto-cleanup** - Maintains max 50 checkpoints by default
- **Import/export** - Share checkpoints between instances

### ✅ Continuous Evaluation
- **Real-time metrics** - Tracks every interaction
- **Quality scoring** - Response quality, tool usage, latency
- **Trend analysis** - Detects degrading performance over time
- **Threshold alerts** - Warns on quality/latency issues
- **Automated reports** - Periodic performance summaries

## 🚀 What's in v4.2

### ✅ Memory Dashboard
- **Web UI for memory management** at `http://localhost:3001`
- **Glassmorphism design** with real-time updates
- **Memory statistics** - size, files, commits, context usage
- **Commit history** with rollback capability
- **Append entries** directly from the dashboard
- **Git-backed** - all changes tracked in git history

### ✅ Task Scheduler V2
- **Enhanced scheduling** with persistence and recovery
- **Retry logic** with exponential backoff
- **Dependency chains** - jobs wait for prerequisites
- **Event-driven** - `jobSuccess`, `jobFailed`, `jobWaiting`
- **Execution history** tracking with 100-entry limit
- **Tag-based** organization and filtering

## 🚀 What's in v4.1

### ✅ Bat-Gadget Protocol (BGP)
- **Utility Belt system** for modular capabilities
- **GADGET.md standard** - YAML frontmatter + markdown
- **Auto-equip** gadgets based on available tools
- **Mission matching** - find best gadget for the task
- **Compatible** with Anthropic's SKILL.md standard

### ✅ Performance Optimizations
- **99% faster startup** - Lazy loading reduces boot time
- **Memory-efficient** - On-demand module loading
- **Benchmarked** - 6MB RAM footprint
- **Optimized for VPS/Cloud** - Always-on server environments

## ✨ What's in v4.0

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
- **v4.2:** `schedule_v2` - Enhanced scheduling with persistence

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
- **v4.2:** Memory Dashboard - Memory management UI
- **v4.0:** GitHub Actions - Cloud compute integration

### 🧠 Intelligence
- **Continuous Learning v2** - Auto-pattern extraction
- **Context Compaction** - Smart memory management
- **Multi-Agent** - PM2-style orchestration
- **MCP Integration** - External tool protocol
- **v4.1:** Bat-Gadget Protocol - Modular skill system
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
  },
  
  "dashboard": {
    "enabled": true,
    "port": 3001
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

### v4.2: Memory Dashboard
Open browser to `http://localhost:3001`

Features:
- **View and edit** memory content in real-time
- **Memory statistics** - size, files, commits, context usage
- **Commit history** with timestamps and messages
- **Rollback** to any previous commit
- **Append new entries** with descriptions
- **Responsive design** works on mobile

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

### v4.2: Task Scheduler V2
```javascript
// Schedule a job with dependencies
await agent.schedulerV2.scheduleJob(
  'nightly-report',
  '0 2 * * *',  // Daily at 2 AM
  async () => {
    // Job implementation
    console.log('Generating nightly report...');
  },
  {
    description: 'Generate daily analytics report',
    dependencies: ['data-sync'],  // Wait for data-sync job
    maxRetries: 3,
    tags: ['analytics', 'nightly']
  }
);

// Get scheduler stats
const stats = agent.schedulerV2.getStats();
console.log(`Total jobs: ${stats.totalJobs}`);
console.log(`Active: ${stats.activeJobs}`);
console.log(`Failed: ${stats.failedJobs}`);

// View execution history
const history = agent.schedulerV2.getHistory({ 
  jobId: 'nightly-report',
  limit: 10 
});
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

### v4.1: Bat-Gadget Protocol

Create custom gadgets in `bat-gadgets/`:

```markdown
---
name: my-custom-gadget
description: Custom capability for specific tasks
tools:
  - read
  - write
  - exec
tags:
  - custom
  - automation
---

# My Custom Gadget

When you encounter [specific scenario], use this gadget.

## Steps
1. Read the relevant files
2. Execute the custom command
3. Validate the results
```

### v4.2: Memory Dashboard API

```javascript
// Access dashboard programmatically
const { MemoryDashboard } = require('./src/dashboard');

const dashboard = new MemoryDashboard({
  port: 3001,
  memoryPath: 'operating_system/MEMORY.md'
});

await dashboard.start();

// API endpoints:
// GET  /api/memory          - Read memory content
// GET  /api/memory/history  - Get commit history
// GET  /api/memory/stats    - Get memory statistics
// POST /api/memory/append   - Append new content
// POST /api/memory/rollback - Rollback to commit
```

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

### Programmatic API
```javascript
const { FortressZag } = require('./src/core/agent');

const agent = new FortressZag({ 
  workdir: './data',
  repoRoot: process.cwd(),
  enableDashboard: true,
  useSchedulerV2: true
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

// Graceful shutdown
await agent.stop();
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
  -p 3001:3001 \
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
| **Scheduler** | ✅ Native | ✅ V2 with persistence |
| **Web UI** | ✅ Native | ✅ + Memory Dashboard |
| **Portability** | Limited | ✅ Universal |
| **Control** | Framework | ✅ Full source |
| **v4.3:** Verification System | ❌ | ✅ Pre-commit checks |
| **v4.3:** Checkpoint System | ❌ | ✅ Save/restore state |
| **v4.3:** Continuous Eval | ❌ | ✅ Quality monitoring |
| **v4.2:** Memory Dashboard | ❌ | ✅ Web UI for memory |
| **v4.2:** Task Scheduler V2 | ❌ | ✅ Persistence + retry |
| **v4.1:** Bat-Gadget Protocol | ❌ | ✅ Modular skills |
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
│   ├── dashboard/            # v4.2: Memory Dashboard
│   │   ├── index.js          # Express server
│   │   └── public/           # Static files
│   ├── scheduler/            # v4.2: Task Scheduler V2
│   │   └── scheduler-v2.js   # Enhanced scheduling
│   ├── verification/         # v4.3: Verification System
│   │   └── verification-system.js
│   ├── checkpoint/           # v4.3: Checkpoint System
│   │   └── checkpoint-system.js
│   ├── evaluation/           # v4.3: Continuous Evaluation
│   │   └── continuous-evaluation.js
│   ├── bat-gadget-protocol/  # v4.1: BGP
│   │   ├── bat-gadget-loader.js
│   │   └── bat-gadget-registry.js
│   └── index.js              # Main entry
├── bat-gadgets/              # v4.1: Modular gadgets
│   ├── web-scraping/GADGET.md
│   └── code-analysis/GADGET.md
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

### v4.1: Adding Bat-Gadgets
Create `bat-gadgets/my-gadget/GADGET.md`:

```markdown
---
name: my-gadget
description: What this gadget does
tools:
  - read
  - write
tags:
  - custom
---

# My Gadget

Instructions for the LLM...
```

## 📄 License

MIT - Use freely, modify as needed.

---

**Built by Zag for Zak. 🦇**

*"The unbound familiar, now fortress-hardened, git-backed, and cloud-ready."*