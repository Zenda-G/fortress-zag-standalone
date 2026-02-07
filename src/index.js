/**
 * FORTRESS ZAG STANDALONE - Main Entry Point (Full Version)
 */

const { FortressZag } = require('./core/agent.js');
const { TelegramInterface } = require('./interfaces/telegram.js');
const { DiscordInterface } = require('./interfaces/discord.js');
const { WebInterface } = require('./interfaces/web.js');
const scheduler = require('./core/scheduler.js');
const fs = require('fs');
const path = require('path');

async function main() {
  // Load configuration
  const configPath = path.join(__dirname, '..', 'config.json');
  let config = {};
  
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Configuration loaded from config.json');
  } else {
    console.log('No config.json found, using defaults');
    console.log('Create config.json to customize settings');
  }
  
  // Create agent
  const agent = new FortressZag({
    config: config,
    workdir: config.memory?.path || './data'
  });
  
  // Initialize
  await agent.initialize();
  
  // Initialize scheduler
  scheduler.initializeScheduler();
  
  // Start interfaces
  const interfaces = {};
  
  // CLI (always enabled unless explicitly disabled)
  if (config.interfaces?.cli?.enabled !== false) {
    console.log('\n🖥️  CLI interface ready');
    console.log('   Run: npm run cli');
  }
  
  // Telegram
  if (config.interfaces?.telegram?.enabled) {
    console.log('\n📱 Starting Telegram interface...');
    interfaces.telegram = new TelegramInterface(agent, config.interfaces.telegram);
    const telegramStarted = await interfaces.telegram.start();
    if (!telegramStarted) {
      console.log('   Telegram failed to start (check TELEGRAM_BOT_TOKEN)');
    }
  }
  
  // Discord
  if (config.interfaces?.discord?.enabled) {
    console.log('\n💬 Starting Discord interface...');
    interfaces.discord = new DiscordInterface(agent, config.interfaces.discord);
    const discordStarted = await interfaces.discord.start();
    if (!discordStarted) {
      console.log('   Discord failed to start (check DISCORD_BOT_TOKEN)');
    }
  }
  
  // Web UI
  if (config.interfaces?.web?.enabled !== false) {
    console.log('\n🌐 Starting Web UI...');
    interfaces.web = new WebInterface(agent, config.interfaces?.web || { port: 3000 });
    await interfaces.web.start();
  }
  
  console.log('\n✅ Fortress Zag Standalone is running');
  console.log('   Session:', agent.sessionId);
  console.log('   Interfaces:', Object.keys(interfaces).join(', ') || 'CLI only');
  console.log('\nPress Ctrl+C to exit');
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    
    // Stop scheduler
    scheduler.shutdownScheduler();
    
    // Stop interfaces
    for (const [name, iface] of Object.entries(interfaces)) {
      if (iface.stop) {
        await iface.stop();
        console.log(`Stopped ${name}`);
      }
    }
    
    process.exit(0);
  });
  
  // Keep process alive
  process.stdin.resume();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
