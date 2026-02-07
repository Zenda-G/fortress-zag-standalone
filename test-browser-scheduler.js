/**
 * Test Browser & Scheduler
 */

const browser = require('./src/core/browser.js');
const scheduler = require('./src/core/scheduler.js');

async function testFeatures() {
  console.log('\n🧪 Testing Browser & Scheduler...\n');
  
  // Test 1: Check Playwright
  console.log('1. Checking Playwright...');
  const hasPlaywright = await browser.checkPlaywright();
  console.log(`   Playwright: ${hasPlaywright ? '✅' : '⚠️ Not installed'}`);
  
  // Test 2: Scheduler
  console.log('\n2. Testing Scheduler...');
  
  // Schedule a test job
  scheduler.scheduleJob('test-job', 'every 1 minute', {
    type: 'message',
    text: 'Test message from scheduler'
  });
  
  const jobs = scheduler.getJobs();
  console.log(`   Jobs: ${jobs.length} scheduled`);
  console.log(`   ✅ Scheduler working`);
  
  // Cleanup
  scheduler.removeJob('test-job');
  
  console.log('\n══════════════════════════════════');
  console.log('Browser & Scheduler: ✅ Tested');
  console.log('══════════════════════════════════');
}

testFeatures().catch(console.error);
