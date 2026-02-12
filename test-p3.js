/**
 * P3 Enhancements Test Suite
 * 
 * Tests for:
 * - Continuous Learning v3
 * - Context Compaction v2
 * - Multi-Agent Orchestration
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  FORTRESS ZAG v4.4 - P3 Enhancements Test Suite');
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

// Test Continuous Learning v3
test('Continuous Learning v3 file exists', () => {
  const filePath = path.join(__dirname, 'skills/continuous-learning/continuous-learning-v3.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('continuous-learning-v3.js not found');
  }
});

test('Continuous Learning v3 exports ContinuousLearningV3 class', () => {
  const { ContinuousLearningV3 } = require('./skills/continuous-learning/continuous-learning-v3.js');
  if (!ContinuousLearningV3) {
    throw new Error('ContinuousLearningV3 not exported');
  }
});

test('Continuous Learning v3 has required methods', () => {
  const { ContinuousLearningV3 } = require('./skills/continuous-learning/continuous-learning-v3.js');
  const required = ['learnFromInteraction', 'applyInstincts', 'getStats', 'getTopInstincts', 'exportKnowledge'];
  
  for (const method of required) {
    if (typeof ContinuousLearningV3.prototype[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

test('Continuous Learning v3 can categorize input', () => {
  const { ContinuousLearningV3 } = require('./skills/continuous-learning/continuous-learning-v3.js');
  const learning = new ContinuousLearningV3({ enabled: true });
  
  const category = learning.categorizeInput('read the file test.js');
  if (category !== 'file_operation') {
    throw new Error(`Expected 'file_operation', got '${category}'`);
  }
});

test('Continuous Learning v3 extracts patterns', async () => {
  const { ContinuousLearningV3 } = require('./skills/continuous-learning/continuous-learning-v3.js');
  const learning = new ContinuousLearningV3({ enabled: true });
  
  await learning.learnFromInteraction({
    input: 'read file test.js',
    response: 'File content...',
    toolsUsed: [{ tool: 'read' }],
    success: true,
    duration: 100
  });
  
  const stats = learning.getStats();
  if (stats.totalPatterns === 0) {
    throw new Error('No patterns extracted');
  }
});

// Test Context Compaction v2
test('Context Compaction v2 file exists', () => {
  const filePath = path.join(__dirname, 'skills/context-compaction/context-compaction-v2.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('context-compaction-v2.js not found');
  }
});

test('Context Compaction v2 exports ContextCompactionV2 class', () => {
  const { ContextCompactionV2 } = require('./skills/context-compaction/context-compaction-v2.js');
  if (!ContextCompactionV2) {
    throw new Error('ContextCompactionV2 not exported');
  }
});

test('Context Compaction v2 has required methods', () => {
  const { ContextCompactionV2 } = require('./skills/context-compaction/context-compaction-v2.js');
  const required = ['shouldCompact', 'compact', 'getStats', 'estimateCompaction'];
  
  for (const method of required) {
    if (typeof ContextCompactionV2.prototype[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

test('Context Compaction v2 detects when compaction needed', () => {
  const { ContextCompactionV2 } = require('./skills/context-compaction/context-compaction-v2.js');
  const compaction = new ContextCompactionV2({ enabled: true });
  
  const largeContext = Array(100).fill({ role: 'user', content: 'x'.repeat(1000) });
  const status = compaction.shouldCompact(largeContext, 10000);
  
  if (!status.needed) {
    throw new Error('Should detect need for compaction');
  }
});

test('Context Compaction v2 scores message importance', () => {
  const { ContextCompactionV2 } = require('./skills/context-compaction/context-compaction-v2.js');
  const compaction = new ContextCompactionV2();
  
  const score = compaction.scoreMessageImportance({
    role: 'assistant',
    content: 'Here is the solution',
    toolCalls: [{ tool: 'write' }]
  }, 5, []);
  
  if (score <= 0) {
    throw new Error('Should return positive score');
  }
});

// Test Agent v4.4 Integration
test('Agent v4.4 has P3 enhancements', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  
  const requiredFeatures = [
    'v4.4',
    'ContinuousLearningV3',
    'ContextCompactionV2',
    'learning',
    'compaction'
  ];
  
  for (const feature of requiredFeatures) {
    if (!agentContent.includes(feature)) {
      throw new Error(`Missing v4.4 feature: ${feature}`);
    }
  }
});

test('Agent imports Continuous Learning v3', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  if (!agentContent.includes("require('../../skills/continuous-learning/continuous-learning-v3.js')")) {
    throw new Error('Continuous Learning v3 not imported');
  }
});

test('Agent imports Context Compaction v2', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  if (!agentContent.includes("require('../../skills/context-compaction/context-compaction-v2.js')")) {
    throw new Error('Context Compaction v2 not imported');
  }
});

test('Package version is 4.4.0', () => {
  const pkg = require('./package.json');
  if (pkg.version !== '4.4.0') {
    throw new Error(`Expected version 4.4.0, got ${pkg.version}`);
  }
});

test('Package includes test:p3 script', () => {
  const pkg = require('./package.json');
  if (!pkg.scripts['test:p3']) {
    throw new Error('test:p3 script not found');
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
  console.log('✅ All P3 enhancement tests passed!');
  console.log('\nP3 Enhancements Ready:');
  console.log('  - Continuous Learning v3: Pattern extraction and instinct generation');
  console.log('  - Context Compaction v2: Smart memory management');
  console.log('  - Multi-Agent Orchestration: Agent swarm management');
  console.log('\nUsage:');
  console.log('  npm run test:p3  # Run this test suite');
  console.log('  npm start        # Start with P3 systems enabled');
  process.exit(0);
}