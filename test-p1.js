/**
 * P1 Enhancements Test Suite
 * 
 * Tests for:
 * - Memory Dashboard
 * - Task Scheduler V2
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  FORTRESS ZAG v4.2 - P1 Enhancements Test Suite');
console.log('═══════════════════════════════════════════════════════════════\n');

const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

function test(name, fn) {
  tests.total++;
  try {
    fn();
    console.log(`✅ ${name}`);
    tests.passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error.message}`);
    tests.failed++;
  }
}

// Test Memory Dashboard
test('Memory Dashboard files exist', () => {
  const files = [
    'src/dashboard/index.js',
    'src/dashboard/public/index.html',
    'src/dashboard/public/styles.css',
    'src/dashboard/public/dashboard.js'
  ];
  
  for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing: ${file}`);
    }
  }
});

test('Memory Dashboard exports MemoryDashboard class', () => {
  const { MemoryDashboard } = require('./src/dashboard/index.js');
  if (!MemoryDashboard) {
    throw new Error('MemoryDashboard not exported');
  }
});

test('Memory Dashboard has required methods', () => {
  const { MemoryDashboard } = require('./src/dashboard/index.js');
  const required = ['start', 'stop', 'getMemory', 'getMemoryHistory', 'getMemoryStats'];
  
  for (const method of required) {
    if (typeof MemoryDashboard.prototype[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

test('Memory Dashboard HTML structure is valid', () => {
  const html = fs.readFileSync(path.join(__dirname, 'src/dashboard/public/index.html'), 'utf8');
  
  const requiredElements = [
    'memoryContent',
    'historyTable',
    'totalSize',
    'memoryFiles',
    'gitCommits',
    'contextUsage'
  ];
  
  for (const id of requiredElements) {
    if (!html.includes(`id='${id}'`)) {
      throw new Error(`Missing element: ${id}`);
    }
  }
});

// Test Task Scheduler V2
test('Task Scheduler V2 file exists', () => {
  const filePath = path.join(__dirname, 'src/scheduler/scheduler-v2.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('scheduler-v2.js not found');
  }
});

test('Task Scheduler V2 exports TaskSchedulerV2 class', () => {
  const { TaskSchedulerV2 } = require('./src/scheduler/scheduler-v2.js');
  if (!TaskSchedulerV2) {
    throw new Error('TaskSchedulerV2 not exported');
  }
});

test('Task Scheduler V2 has required methods', () => {
  const { TaskSchedulerV2 } = require('./src/scheduler/scheduler-v2.js');
  const required = [
    'scheduleJob',
    'unscheduleJob',
    'enableJob',
    'disableJob',
    'getJob',
    'getAllJobs',
    'getHistory',
    'getStats',
    'saveJobs',
    'loadJobs'
  ];
  
  for (const method of required) {
    if (typeof TaskSchedulerV2.prototype[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

test('Task Scheduler V2 has event emitter functionality', () => {
  const { TaskSchedulerV2 } = require('./src/scheduler/scheduler-v2.js');
  const scheduler = new TaskSchedulerV2({ persistencePath: '/tmp/test-scheduler.json' });
  
  if (typeof scheduler.on !== 'function') {
    throw new Error('Missing EventEmitter methods');
  }
  if (typeof scheduler.emit !== 'function') {
    throw new Error('Missing EventEmitter methods');
  }
});

test('Task Scheduler V2 implements dependency checking', () => {
  const { TaskSchedulerV2 } = require('./src/scheduler/scheduler-v2.js');
  
  if (typeof TaskSchedulerV2.prototype.checkDependencies !== 'function') {
    throw new Error('Missing checkDependencies method');
  }
});

test('Task Scheduler V2 implements retry logic', () => {
  const { TaskSchedulerV2 } = require('./src/scheduler/scheduler-v2.js');
  
  if (typeof TaskSchedulerV2.prototype.calculateRetryDelay !== 'function') {
    throw new Error('Missing calculateRetryDelay method');
  }
});

test('Agent v4.2 has P1 enhancements', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  
  const requiredFeatures = [
    'v4.2',
    'MemoryDashboard',
    'TaskSchedulerV2',
    'memoryDashboard',
    'schedulerV2'
  ];
  
  for (const feature of requiredFeatures) {
    if (!agentContent.includes(feature)) {
      throw new Error(`Missing v4.2 feature: ${feature}`);
    }
  }
});

// Test integration
test('Agent imports Memory Dashboard', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  if (!agentContent.includes("require('../dashboard/index.js')")) {
    throw new Error('Memory Dashboard not imported');
  }
});

test('Agent imports Task Scheduler V2', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  if (!agentContent.includes("require('../scheduler/scheduler-v2.js')")) {
    throw new Error('Task Scheduler V2 not imported');
  }
});

// Test package.json
test('Package version is 4.2.0', () => {
  const pkg = require('./package.json');
  if (pkg.version !== '4.2.0') {
    throw new Error(`Expected version 4.2.0, got ${pkg.version}`);
  }
});

test('Package includes test:p1 script', () => {
  const pkg = require('./package.json');
  if (!pkg.scripts['test:p1']) {
    throw new Error('test:p1 script not found');
  }
});

// Summary
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  Results: ${tests.passed}/${tests.total} passed`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (tests.failed > 0) {
  console.log(`❌ ${tests.failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('✅ All P1 enhancement tests passed!');
  console.log('\nP1 Enhancements Ready:');
  console.log('  - Memory Dashboard: Web UI for memory management');
  console.log('  - Task Scheduler V2: Enhanced scheduling with persistence');
  console.log('\nUsage:');
  console.log('  npm run test:p1  # Run this test suite');
  console.log('  npm start        # Start with dashboard enabled');
  process.exit(0);
}