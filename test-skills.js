/**
 * SKILL.md System Test
 * 
 * Tests the skill loader and registry functionality
 */

const { SkillLoader } = require('./src/skills/skill-loader');
const { SkillRegistry } = require('./src/skills/skill-registry');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  SKILL.md SYSTEM TEST                                  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function testSkillLoader() {
  console.log('🧪 Testing SkillLoader...\n');
  
  const loader = new SkillLoader({
    skillsDir: path.join(__dirname, 'skills')
  });

  // Test 1: Load all skills
  console.log('Test 1: Load all skills');
  const skills = loader.loadAllSkills();
  console.log(`  ✅ Loaded ${skills.length} skills`);
  
  if (skills.length === 0) {
    console.error('  ❌ No skills found!');
    return false;
  }

  // Test 2: Check skill structure
  console.log('\nTest 2: Validate skill structure');
  for (const skill of skills) {
    const hasName = skill.metadata.name;
    const hasDescription = skill.metadata.description;
    const hasContent = skill.content;
    
    if (hasName && hasDescription && hasContent) {
      console.log(`  ✅ ${skill.name}: Valid structure`);
    } else {
      console.log(`  ❌ ${skill.name}: Invalid structure`);
      return false;
    }
  }

  // Test 3: Get skill prompt
  console.log('\nTest 3: Generate skill prompt');
  const firstSkill = skills[0];
  const prompt = loader.getSkillPrompt(firstSkill.name);
  if (prompt && prompt.includes(firstSkill.metadata.name)) {
    console.log(`  ✅ Prompt generation works`);
  } else {
    console.log(`  ❌ Prompt generation failed`);
    return false;
  }

  // Test 4: Find by tag
  console.log('\nTest 4: Find skills by tag');
  const webSkills = loader.findByTag('web');
  console.log(`  ✅ Found ${webSkills.length} web-related skills`);

  return true;
}

async function testSkillRegistry() {
  console.log('\n\n🧪 Testing SkillRegistry...\n');
  
  const registry = new SkillRegistry({
    skillsDir: path.join(__dirname, 'skills'),
    availableTools: ['read', 'write', 'edit', 'exec', 'browser_navigate', 'browser_extract', 'browser_click']
  });

  // Test 1: Initialize
  console.log('Test 1: Initialize registry');
  const activeSkills = registry.initialize();
  console.log(`  ✅ Initialized with ${activeSkills.length} active skills`);

  // Test 2: Get system prompt additions
  console.log('\nTest 2: Generate system prompt');
  const promptAddition = registry.getSystemPromptAdditions();
  if (promptAddition && promptAddition.includes('Active Skills')) {
    console.log(`  ✅ System prompt generation works`);
    console.log(`  📄 Prompt length: ${promptAddition.length} chars`);
  } else {
    console.log(`  ⚠️  No active skills to add to prompt`);
  }

  // Test 3: Find skill for task
  console.log('\nTest 3: Match skill to task');
  const task = "Scrape data from a website";
  const matchedSkill = registry.findSkillForTask(task);
  if (matchedSkill) {
    console.log(`  ✅ Matched skill: ${matchedSkill.metadata.name}`);
  } else {
    console.log(`  ⚠️  No skill matched (may be expected)`);
  }

  // Test 4: List all skills
  console.log('\nTest 4: List all skills');
  const allSkills = registry.listAllSkills();
  console.log(`  ✅ Found ${allSkills.length} total skills`);
  for (const skill of allSkills) {
    console.log(`     - ${skill.name} (${skill.active ? 'active' : 'inactive'})`);
  }

  // Test 5: Get status
  console.log('\nTest 5: Registry status');
  const status = registry.getStatus();
  console.log(`  ✅ Status: ${status.active}/${status.totalLoaded} skills active`);

  return true;
}

async function runTests() {
  try {
    const loaderTest = await testSkillLoader();
    const registryTest = await testSkillRegistry();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  TEST RESULTS                                          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    if (loaderTest && registryTest) {
      console.log('\n✅ ALL TESTS PASSED');
      console.log('\nSKILL.md system is working correctly!');
      return 0;
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      return 1;
    }
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    return 1;
  }
}

runTests().then(code => process.exit(code));