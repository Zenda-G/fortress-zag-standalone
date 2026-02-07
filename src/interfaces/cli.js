/**
 * FORTRESS ZAG STANDALONE - CLI Interface
 * 
 * Command-line interface for the standalone agent.
 */

const readline = require('readline');
const { FortressZag } = require('./core/agent.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Zag> '
});

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  FORTRESS ZAG STANDALONE - CLI                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Initialize agent
  const agent = new FortressZag({
    workdir: './data'
  });
  
  await agent.initialize();
  
  console.log('\nType your messages below. Type "exit" to quit.\n');
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (input.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    }
    
    if (input.toLowerCase() === 'status') {
      console.log('\nAgent Status:');
      console.log(JSON.stringify(agent.getStatus(), null, 2));
      console.log();
      rl.prompt();
      return;
    }
    
    if (input.toLowerCase() === 'help') {
      console.log('\nCommands:');
      console.log('  status - Show agent status');
      console.log('  help   - Show this help');
      console.log('  exit   - Quit the agent');
      console.log('  <any other text> - Send message to agent');
      console.log();
      rl.prompt();
      return;
    }
    
    // Process message
    try {
      const response = await agent.processMessage({
        text: input,
        source: 'cli',
        user: 'user'
      });
      
      if (response.blocked) {
        console.log('\n⚠️  ' + response.text);
        if (response.threats) {
          console.log('Threats detected:', response.threats.length);
        }
      } else {
        console.log('\nZag: ' + response.text);
        if (response.contextStatus && response.contextStatus !== 'GREEN') {
          console.log(`[Context: ${response.contextStatus}]`);
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
    
    console.log();
    rl.prompt();
  });
  
  rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
