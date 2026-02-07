/**
 * Test Web Interface
 */

const { FortressZag } = require('./src/core/agent.js');
const { WebInterface } = require('./src/interfaces/web.js');

async function testWeb() {
  console.log('\n🧪 Testing Web UI...\n');
  
  const agent = new FortressZag({ workdir: './data' });
  await agent.initialize();
  
  console.log('Agent initialized');
  
  // Create web interface
  const web = new WebInterface(agent, { port: 3456 });
  await web.start();
  
  console.log('\n✅ Web UI test complete!');
  console.log('   URL: http://localhost:3456');
  console.log('   (Press Ctrl+C to stop)');
  
  // Keep running for manual testing
  setTimeout(() => {
    web.stop();
    process.exit(0);
  }, 10000); // Auto-stop after 10 seconds
}

testWeb().catch(console.error);
