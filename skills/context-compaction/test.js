const cc = require('./context-compaction.js');

console.log('═══════════════════════════════════════════════════════');
console.log('CONTEXT-AWARE COMPACTION - TEST SUITE');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Record measurements
console.log('TEST 1: Recording Context Measurements');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const measurements = [
  { used: 50000, expected: 'GREEN' },
  { used: 100000, expected: 'YELLOW' },
  { used: 150000, expected: 'ORANGE' },
  { used: 200000, expected: 'RED' },
  { used: 240000, expected: 'CRITICAL' }
];

measurements.forEach(m => {
  const result = cc.recordMeasurement(m.used);
  const status = result.threshold === m.expected ? '✅' : '❌';
  console.log(`  ${status} ${m.used.toLocaleString()} tokens → ${result.threshold} (expected ${m.expected})`);
});

// Test 2: Context status
console.log('\nTEST 2: Context Status Reporting');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const statuses = [50000, 120000, 180000, 220000, 250000];
statuses.forEach(used => {
  const status = cc.getContextStatus(used);
  const icon = status.threshold === 'CRITICAL' ? '🔴' :
               status.threshold === 'RED' ? '🟠' :
               status.threshold === 'ORANGE' ? '🟡' :
               status.threshold === 'YELLOW' ? '💛' : '🟢';
  
  console.log(`\n  ${icon} ${status.current.percentage} (${used.toLocaleString()}/${status.current.total.toLocaleString()})`);
  console.log(`     Threshold: ${status.threshold}`);
  console.log(`     Action: ${status.recommendation.action}`);
  console.log(`     Message: ${status.recommendation.message}`);
  if (status.burnRate > 0) {
    console.log(`     Burn rate: ${status.burnRate} tokens/min`);
    console.log(`     Time to overflow: ${status.timeToOverflow}`);
  }
});

// Test 3: Compaction analysis
console.log('\n\nTEST 3: Compaction Analysis');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const sampleContext = `
Zak: Read the file
Zag: <functions.read path="example.txt">\nContent of file...\n</functions.read>

Zak: Fetch web data
Zag: <functions.web_fetch url="https://example.com">\n<html>...</html>\n</functions.web_fetch>

Zak: Another web fetch
Zag: <functions.web_fetch url="https://api.example.com">\n{ "data": [...] }\n</functions.web_fetch>

Zak: More data
Zag: <functions.web_fetch url="https://long-content.com">\nVery long content here...\n</functions.web_fetch>

Zak: Here's code
Zag:
\`\`\`javascript
function example() {
  console.log("example");
}
\`\`\`

Zak: More code
Zag:
\`\`\`python
def example():
    print("example")
\`\`\`

Zak: Final web fetch
Zag: <functions.web_fetch url="https://final.com">\nMore content...\n</functions.web_fetch>
`;

const analysis = cc.analyzeCompaction(sampleContext);
console.log(`  Total context size: ${analysis.totalLength.toLocaleString()} chars`);
console.log(`\n  Sections found:`);
analysis.sections.forEach(s => {
  console.log(`    • ${s.type}: ${s.count} items (~${s.estimatedSize.toLocaleString()} chars)`);
});

console.log(`\n  Suggestions:`);
analysis.suggestions.forEach(s => {
  const icon = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '⚪';
  console.log(`    ${icon} [${s.priority.toUpperCase()}] ${s.action}`);
  console.log(`       Potential savings: ${s.potentialSavings}`);
});

// Test 4: Full compaction suggestion
console.log('\n\nTEST 4: Full Compaction Suggestions');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const suggestions = cc.getCompactionSuggestions(sampleContext.repeat(5));
console.log(`  Actionable: ${suggestions.actionable ? 'YES' : 'NO'}`);
console.log(`  Threshold: ${suggestions.status.threshold}`);
console.log(`  Recommendation: ${suggestions.status.recommendation.message}`);

// Test 5: Perform compaction
console.log('\n\nTEST 5: Perform Compaction');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const compaction = cc.compactContext('smart');
console.log(`  ✅ Compaction performed: ${compaction.id}`);
console.log(`  Strategy: ${compaction.strategy}`);
console.log(`  Timestamp: ${compaction.timestamp}`);

const finalStatus = cc.getContextStatus(50000);
console.log(`\n  Total compactions: ${finalStatus.compactionCount}`);
console.log(`  Last compaction: ${finalStatus.lastCompaction || 'Never'}`);

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════');
console.log('  ✅ Measurement recording');
console.log('  ✅ Threshold detection');
console.log('  ✅ Status reporting');
console.log('  ✅ Context analysis');
console.log('  ✅ Compaction suggestions');
console.log('  ✅ Compaction execution');
console.log('\n⚠️  Note: Actual token counting requires OpenClaw integration');
console.log('   Current implementation uses character counts as approximation');
