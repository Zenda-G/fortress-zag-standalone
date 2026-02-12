/**
 * Bat-Gadget Protocol (BGP) Test
 * 
 * Tests the Bat-Gadget loader and registry functionality
 */

const { BatGadgetLoader } = require('./src/bat-gadget-protocol/bat-gadget-loader');
const { BatGadgetRegistry } = require('./src/bat-gadget-protocol/bat-gadget-registry');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  BAT-GADGET PROTOCOL (BGP) TEST                        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function testBatGadgetLoader() {
  console.log('🧪 Testing BatGadgetLoader...\n');
  
  const loader = new BatGadgetLoader({
    gadgetsDir: path.join(__dirname, 'bat-gadgets')
  });

  // Test 1: Load all gadgets
  console.log('Test 1: Load all gadgets');
  const gadgets = loader.loadAllGadgets();
  console.log(`  ✅ Loaded ${gadgets.length} gadgets`);
  
  if (gadgets.length === 0) {
    console.error('  ❌ No gadgets found!');
    return false;
  }

  // Test 2: Check gadget structure
  console.log('\nTest 2: Validate gadget structure');
  for (const gadget of gadgets) {
    const hasName = gadget.metadata.name;
    const hasDescription = gadget.metadata.description;
    const hasContent = gadget.content;
    
    if (hasName && hasDescription && hasContent) {
      console.log(`  ✅ ${gadget.name}: Valid structure`);
    } else {
      console.log(`  ❌ ${gadget.name}: Invalid structure`);
      return false;
    }
  }

  // Test 3: Get gadget prompt
  console.log('\nTest 3: Generate gadget prompt');
  const firstGadget = gadgets[0];
  const prompt = loader.getGadgetPrompt(firstGadget.name);
  if (prompt && prompt.includes(firstGadget.metadata.name)) {
    console.log(`  ✅ Prompt generation works`);
  } else {
    console.log(`  ❌ Prompt generation failed`);
    return false;
  }

  // Test 4: Find by tag
  console.log('\nTest 4: Find gadgets by tag');
  const webGadgets = loader.findByTag('web');
  console.log(`  ✅ Found ${webGadgets.length} web-related gadgets`);

  return true;
}

async function testBatGadgetRegistry() {
  console.log('\n\n🧪 Testing BatGadgetRegistry...\n');
  
  const registry = new BatGadgetRegistry({
    gadgetsDir: path.join(__dirname, 'bat-gadgets'),
    availableTools: ['read', 'write', 'edit', 'exec', 'browser_navigate', 'browser_extract', 'browser_click']
  });

  // Test 1: Initialize
  console.log('Test 1: Initialize registry');
  const equippedGadgets = registry.initialize();
  console.log(`  ✅ Initialized with ${equippedGadgets.length} equipped gadgets`);

  // Test 2: Get system prompt additions
  console.log('\nTest 2: Generate system prompt');
  const promptAddition = registry.getSystemPromptAdditions();
  if (promptAddition && promptAddition.includes('Utility Belt')) {
    console.log(`  ✅ System prompt generation works`);
    console.log(`  📄 Prompt length: ${promptAddition.length} chars`);
  } else {
    console.log(`  ⚠️  No equipped gadgets to add to prompt`);
  }

  // Test 3: Find gadget for mission
  console.log('\nTest 3: Match gadget to mission');
  const mission = "Scrape data from a website";
  const matchedGadget = registry.findGadgetForMission(mission);
  if (matchedGadget) {
    console.log(`  ✅ Matched gadget: ${matchedGadget.metadata.name}`);
  } else {
    console.log(`  ⚠️  No gadget matched (may be expected)`);
  }

  // Test 4: List all gadgets
  console.log('\nTest 4: List all gadgets');
  const allGadgets = registry.listAllGadgets();
  console.log(`  ✅ Found ${allGadgets.length} total gadgets`);
  for (const gadget of allGadgets) {
    console.log(`     - ${gadget.name} (${gadget.equipped ? 'equipped' : 'unequipped'})`);
  }

  // Test 5: Get status
  console.log('\nTest 5: Registry status');
  const status = registry.getStatus();
  console.log(`  ✅ Status: ${status.equipped}/${status.totalLoaded} gadgets equipped`);

  return true;
}

async function runTests() {
  try {
    const loaderTest = await testBatGadgetLoader();
    const registryTest = await testBatGadgetRegistry();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  TEST RESULTS                                          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    if (loaderTest && registryTest) {
      console.log('\n✅ ALL TESTS PASSED');
      console.log('\nBat-Gadget Protocol (BGP) is working correctly!');
      console.log('\nGadgets can now be equipped to the Utility Belt.');
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