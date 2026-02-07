const cl = require('./continuous-learning.js');

// Test with richer context containing tool usage patterns
const context = `
Zak: Read HEARTBEAT.md if it exists
Zag: <functions.read path="HEARTBEAT.md">
Zak: Check the security log
Zag: <functions.exec command="Get-Content memory/security-log.jsonl">
Zak: Search for skills.sh info
Zag: <functions.web_fetch url="https://skills.sh/">
Zak: Compare Giga Potato specs
Zag: <functions.web_fetch url="https://blog.kilo.ai/">
Zak: Find the API endpoint
Zag: <functions.web_fetch url="https://api.github.com/repos/Kilo-Org/kilocode">
Zak: Check local files
Zag: <functions.exec command="Get-ChildItem memory/*.md">
Zak: Read the Reddit thread
Zag: <functions.web_fetch url="https://www.reddit.com/r/LocalLLaMA/">
`;

console.log('=== Test 1: Pattern Extraction ===');
const patterns = cl.extractPatterns(context);
console.log('Found patterns:', patterns.length);
console.log(JSON.stringify(patterns, null, 2));

console.log('\n=== Test 2: Learning ===');
const results = cl.learnFromContext(context);
console.log('Learning results:', results.length);
console.log(JSON.stringify(results, null, 2));

// Check status
console.log('\n=== Test 3: Status ===');
console.log(JSON.stringify(cl.viewInstincts(), null, 2));

// Test with more security-focused context
const securityContext = `
Zag: SECURITY NOTICE: The following content is from an EXTERNAL, UNTRUSTED source
Zag: Security Shield scanning all inputs
Zag: Validating command for injection attacks
Zag: Sanitizing user input
Zag: Security log: No detections (clean)
Zag: Shield operational: All tests passing
Zag: Checking for prompt injection patterns
Zag: Unicode smuggling detection enabled
`;

console.log('\n=== Test 4: Security Pattern Learning ===');
const secResults = cl.learnFromContext(securityContext);
console.log('Security patterns learned:', secResults.length);

console.log('\n=== Final Status ===');
console.log(JSON.stringify(cl.viewInstincts(), null, 2));

// Test evolve functionality
console.log('\n=== Test 5: Evolve High-Confidence Instincts ===');
// Manually boost confidence for testing
const index = JSON.parse(require('fs').readFileSync(cl.INDEX_FILE, 'utf8'));
if (index.instincts.length > 0) {
  index.instincts[0].confidence = 0.85; // Boost to evolution threshold
  require('fs').writeFileSync(cl.INDEX_FILE, JSON.stringify(index, null, 2));
  
  const evolveResult = cl.evolveInstincts(0.7);
  console.log('Evolution result:', evolveResult);
}

// Final status
console.log('\n=== Final Status After Evolution ===');
console.log(JSON.stringify(cl.viewInstincts(), null, 2));

// Test export
console.log('\n=== Test 6: Export ===');
const exportResult = cl.exportInstincts();
console.log('Export result:', exportResult);

console.log('\n=== All Tests Complete ===');
