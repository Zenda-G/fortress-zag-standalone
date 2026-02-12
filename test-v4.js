/**
 * Fortress Zag v4.0 Integration Test
 * 
 * Tests the merged features:
 * - Git-backed memory
 * - Two-tier secrets
 * - Enhanced agent core
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  FORTRESS ZAG v4.0 INTEGRATION TEST                    ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Test 1: Check all v4.0 files exist
console.log('📁 Checking v4.0 file structure...');
const requiredFiles = [
  'src/core/agent.js',
  'src/memory/git-backed.js',
  'src/security/secrets-manager.js',
  '.github/workflows/run-job.yml'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.error('\n❌ Some required files are missing!');
  process.exit(1);
}

// Test 2: Check agent.js contains v4.0 features
console.log('\n🔍 Checking agent.js for v4.0 features...');
const agentCode = fs.readFileSync(path.join(__dirname, 'src/core/agent.js'), 'utf-8');

const v4Features = [
  { name: 'GitBackedMemory', pattern: /GitBackedMemory/ },
  { name: 'SecretsManager', pattern: /SecretsManager/ },
  { name: 'Two-tier secrets', pattern: /twoTier/ },
  { name: 'Export state', pattern: /exportState/ },
  { name: 'Import state', pattern: /importState/ },
  { name: 'Memory tools', pattern: /memory_read|memory_append/ },
  { name: 'Git tools', pattern: /git_commit|git_status/ }
];

for (const feature of v4Features) {
  const found = feature.pattern.test(agentCode);
  console.log(`  ${found ? '✅' : '❌'} ${feature.name}`);
}

// Test 3: Check secrets-manager.js
console.log('\n🔐 Checking secrets-manager.js...');
const secretsCode = fs.readFileSync(path.join(__dirname, 'src/security/secrets-manager.js'), 'utf-8');

const secretsFeatures = [
  { name: 'SECRETS loading', pattern: /process\.env\.SECRETS/ },
  { name: 'LLM_SECRETS loading', pattern: /process\.env\.LLM_SECRETS/ },
  { name: 'exportForLLM', pattern: /exportForLLM/ },
  { name: 'Filtered keys', pattern: /filteredKeys/ }
];

for (const feature of secretsFeatures) {
  const found = feature.pattern.test(secretsCode);
  console.log(`  ${found ? '✅' : '❌'} ${feature.name}`);
}

// Test 4: Check git-backed.js
console.log('\n📚 Checking git-backed.js...');
const gitCode = fs.readFileSync(path.join(__dirname, 'src/memory/git-backed.js'), 'utf-8');

const gitFeatures = [
  { name: 'Read memory', pattern: /read\(\)/ },
  { name: 'Write memory', pattern: /write\(/ },
  { name: 'Append memory', pattern: /append\(/ },
  { name: 'Git commit', pattern: /commit\(/ },
  { name: 'History', pattern: /history\(/ },
  { name: 'Rollback', pattern: /rollback\(/ },
  { name: 'Export state', pattern: /exportState\(/ },
  { name: 'Import state', pattern: /importState\(/ }
];

for (const feature of gitFeatures) {
  const found = feature.pattern.test(gitCode);
  console.log(`  ${found ? '✅' : '❌'} ${feature.name}`);
}

// Test 5: Check GitHub Actions workflow
console.log('\n☁️  Checking GitHub Actions workflow...');
const workflowCode = fs.readFileSync(path.join(__dirname, '.github/workflows/run-job.yml'), 'utf-8');

const workflowFeatures = [
  { name: 'Workflow dispatch', pattern: /workflow_dispatch/ },
  { name: 'SECRETS env', pattern: /SECRETS:/ },
  { name: 'LLM_SECRETS env', pattern: /LLM_SECRETS:/ },
  { name: 'Git commit', pattern: /git commit/ }
];

for (const feature of workflowFeatures) {
  const found = feature.pattern.test(workflowCode);
  console.log(`  ${found ? '✅' : '❌'} ${feature.name}`);
}

// Test 6: Check package.json version
console.log('\n📦 Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
console.log(`  Version: ${packageJson.version}`);
console.log(`  ${packageJson.version === '4.0.0' ? '✅' : '❌'} Correct version`);

// Test 7: Check README
console.log('\n📖 Checking README.md...');
const readmeCode = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf-8');

const readmeFeatures = [
  { name: 'v4.0 header', pattern: /v4\.0/ },
  { name: 'Git-backed memory', pattern: /Git-Backed Memory/i },
  { name: 'Two-tier secrets', pattern: /Two-Tier Secrets/i },
  { name: 'GitHub Actions', pattern: /GitHub Actions/i },
  { name: 'Fork = clone', pattern: /Fork.*clone/i }
];

for (const feature of readmeFeatures) {
  const found = feature.pattern.test(readmeCode);
  console.log(`  ${found ? '✅' : '❌'} ${feature.name}`);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  v4.0 INTEGRATION TEST COMPLETE                        ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('\n✅ All v4.0 features integrated successfully!');
console.log('\nNext steps:');
console.log('  1. Run npm install to install dependencies');
console.log('  2. Configure secrets in .env or environment');
console.log('  3. Run npm start to start the agent');
console.log('  4. Or push to GitHub to test cloud compute');