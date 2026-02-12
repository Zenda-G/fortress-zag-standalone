/**
 * P2 Enhancements Test Suite
 * 
 * Tests for:
 * - Verification System
 * - Checkpoint System  
 * - Continuous Evaluation
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  FORTRESS ZAG v4.3 - P2 Enhancements Test Suite');
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

// Test Verification System
test('Verification System file exists', () => {
  const filePath = path.join(__dirname, 'src/verification/verification-system.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('verification-system.js not found');
  }
});

test('Verification System exports VerificationSystem class', () => {
  const { VerificationSystem } = require('./src/verification/verification-system.js');
  if (!VerificationSystem) {
    throw new Error('VerificationSystem not exported');
  }
});

test('Verification System has required methods', () => {
  const { VerificationSystem } = require('./src/verification/verification-system.js');
  const required = ['verify', 'quickVerify', 'verifyBeforeCommit', 'getStats', 'generateReport'];
  
  for (const method of required) {
    if (typeof VerificationSystem.prototype[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

test('Verification System has default checks', () => {
  const { VerificationSystem } = require('./src/verification/verification-system.js');
  const verifier = new VerificationSystem();
  
  if (verifier.checks.size === 0) {
    throw new Error('No default checks registered');
  }
});

// Test Checkpoint System
test('Checkpoint System file exists', () => {
  const filePath = path.join(__dirname, 'src/checkpoint/checkpoint-system.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('checkpoint-system.js not found');
  }
});

test('Checkpoint System exports CheckpointSystem class', () => {
  const { CheckpointSystem } = require('./src/checkpoint/checkpoint-system.js');
  if (!CheckpointSystem) {
    throw new Error('CheckpointSystem not exported');
  }
});

test('Checkpoint System has required methods', () => {
  const { CheckpointSystem } = require('./src/checkpoint/checkpoint-system.js');
  const required = ['createCheckpoint', 'restoreCheckpoint', 'listCheckpoints', 'getCheckpoint', 'deleteCheckpoint', 'getStats'];
  
  for (const method of required) {
    if (typeof CheckpointSystem.prototype[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

// Test Continuous Evaluation
test('Continuous Evaluation file exists', () => {
  const filePath = path.join(__dirname, 'src/evaluation/continuous-evaluation.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('continuous-evaluation.js not found');
  }
});

test('Continuous Evaluation exports ContinuousEvaluation class', () => {
  const { ContinuousEvaluation } = require('./src/evaluation/continuous-evaluation.js');
  if (!ContinuousEvaluation) {
    throw new Error('ContinuousEvaluation not exported');
  }
});

test('Continuous Evaluation has required methods', () => {
  const { ContinuousEvaluation } = require('./src/evaluation/continuous-evaluation.js');
  const required = ['recordInteraction', 'evaluateInteraction', 'getStats', 'getTrends', 'start', 'stop'];
  
  for (const method of required) {
    if (typeof ContinuousEvaluation.prototype[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

test('Continuous Evaluation has EventEmitter functionality', () => {
  const { ContinuousEvaluation } = require('./src/evaluation/continuous-evaluation.js');
  const eval = new ContinuousEvaluation();
  
  if (typeof eval.on !== 'function' || typeof eval.emit !== 'function') {
    throw new Error('Missing EventEmitter methods');
  }
});

// Test Agent v4.3 Integration
test('Agent v4.3 has P2 enhancements', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  
  const requiredFeatures = [
    'v4.3',
    'VerificationSystem',
    'CheckpointSystem',
    'ContinuousEvaluation',
    'verification',
    'checkpoints',
    'evaluation'
  ];
  
  for (const feature of requiredFeatures) {
    if (!agentContent.includes(feature)) {
      throw new Error(`Missing v4.3 feature: ${feature}`);
    }
  }
});

test('Agent imports Verification System', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  if (!agentContent.includes("require('../verification/verification-system.js')")) {
    throw new Error('Verification System not imported');
  }
});

test('Agent imports Checkpoint System', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  if (!agentContent.includes("require('../checkpoint/checkpoint-system.js')")) {
    throw new Error('Checkpoint System not imported');
  }
});

test('Agent imports Continuous Evaluation', () => {
  const agentContent = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf8');
  if (!agentContent.includes("require('../evaluation/continuous-evaluation.js')")) {
    throw new Error('Continuous Evaluation not imported');
  }
});

// Test package.json
test('Package version is 4.3.0', () => {
  const pkg = require('./package.json');
  if (pkg.version !== '4.3.0') {
    throw new Error(`Expected version 4.3.0, got ${pkg.version}`);
  }
});

test('Package includes test:p2 script', () => {
  const pkg = require('./package.json');
  if (!pkg.scripts['test:p2']) {
    throw new Error('test:p2 script not found');
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
  console.log('✅ All P2 enhancement tests passed!');
  console.log('\nP2 Enhancements Ready:');
  console.log('  - Verification System: Self-check before committing');
  console.log('  - Checkpoint System: Save/restore agent state');
  console.log('  - Continuous Evaluation: Automated quality checks');
  console.log('\nUsage:');
  console.log('  npm run test:p2  # Run this test suite');
  console.log('  npm start        # Start with P2 systems enabled');
  process.exit(0);
}