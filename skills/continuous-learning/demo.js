const cl = require('./continuous-learning.js');

console.log('═══════════════════════════════════════════════════════');
console.log('CONTINUOUS LEARNING v2 - LIVE DEMONSTRATION');
console.log('═══════════════════════════════════════════════════════\n');

// Simulate a tool-heavy research session (like what we did today)
const researchSession = `
Zak: Search for Giga Potato info
Zag: <functions.web_fetch url="https://blog.kilo.ai/p/announcing-a-powerful-new-stealth">
Zag: <functions.web_fetch url="https://www.reddit.com/r/LocalLLaMA/comments/...">
Zak: Check Kilo Code's GitHub
Zag: <functions.web_fetch url="https://api.github.com/repos/Kilo-Org/kilocode">
Zag: <functions.web_fetch url="https://api.github.com/repos/Kilo-Org/kilocode/contents/src/api">
Zag: <functions.web_fetch url="https://raw.githubusercontent.com/Kilo-Org/kilocode/main/src/api/providers/kilocode/model-settings.ts">
Zak: Compare with DeepSeek Coder V2
Zag: <functions.read path="MEMORY.md">
Zak: Research MCP ecosystem
Zag: <functions.web_fetch url="https://glama.ai/mcp/servers">
Zag: <functions.web_fetch url="https://mcp.so">
Zag: <functions.web_fetch url="https://github.com/punkpeye/awesome-mcp-servers">
Zak: Security assessment of skills.sh
Zag: Security Shield scanning... Input sanitized. No threats detected.
Zag: Warning: npx skills add executes arbitrary code from GitHub
Zag: Recommendation: Audit before installing, test in isolation
`;

console.log('📥 INPUT: Research Session (Multiple web_fetch + security analysis)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Session length: ${researchSession.length} characters`);
console.log(`Tool calls: ${(researchSession.match(/web_fetch/g) || []).length} web_fetch`);
console.log(`Security refs: ${(researchSession.match(/security|Security|sanitize/gi) || []).length}`);

console.log('\n🔍 STEP 1: Pattern Extraction');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const patterns = cl.extractPatterns(researchSession);
console.log(`Found ${patterns.length} patterns:\n`);

if (patterns.length === 0) {
  console.log('  (No patterns detected with current extractors)');
  console.log('  Adding manual demonstration patterns...\n');
  
  // Demonstrate manual pattern creation
  const manualPatterns = [
    { type: 'research-workflow', content: 'Multiple web_fetch calls before analysis', frequency: 8 },
    { type: 'security-first', content: 'Security scan before external tool usage', frequency: 5 },
    { type: 'api-investigation', content: 'GitHub API exploration pattern', frequency: 3 }
  ];
  
  manualPatterns.forEach((p, i) => {
    console.log(`  ${i+1}. [${p.type}] Frequency: ${p.frequency}`);
    console.log(`     → ${p.content}`);
  });
  
  // Learn from these patterns
  console.log('\n🧠 STEP 2: Learning from Patterns');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  manualPatterns.forEach(p => {
    const result = cl.createInstinct(p, researchSession);
    console.log(`  ${result.action.toUpperCase()}: ${result.instinct.name}`);
    console.log(`     Confidence: ${(result.instinct.confidence * 100).toFixed(1)}%`);
  });
} else {
  patterns.forEach((p, i) => {
    console.log(`  ${i+1}. [${p.type}] Frequency: ${p.frequency}`);
    console.log(`     Content: ${p.content.substring(0, 60)}...`);
  });
}

console.log('\n📊 STEP 3: Current Instinct Registry');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const status = cl.viewInstincts();
console.log(`Total instincts: ${status.total}`);
console.log(`Evolved to skills: ${status.stats.totalEvolved}\n`);

status.instincts.forEach((instinct, i) => {
  const bar = '█'.repeat(Math.floor(instinct.confidence * 10)) + '░'.repeat(10 - Math.floor(instinct.confidence * 10));
  const status = instinct.evolved ? '✅ EVOLVED' : '⏳ LEARNING';
  console.log(`  ${i+1}. ${instinct.name} ${status}`);
  console.log(`      Confidence: [${bar}] ${(instinct.confidence * 100).toFixed(1)}%`);
});

console.log('\n🚀 STEP 4: Evolution');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const highConfidence = status.instincts.filter(i => i.confidence >= 0.5);
console.log(`Instincts ≥50% confidence: ${highConfidence.length}\n`);

if (highConfidence.length > 0) {
  console.log('Boosting confidence for demonstration...');
  
  // Boost one instinct to evolution threshold
  const fs = require('fs');
  const index = JSON.parse(fs.readFileSync(cl.INDEX_FILE, 'utf8'));
  const target = index.instincts.find(i => !i.evolved);
  if (target) {
    target.confidence = 0.85;
    fs.writeFileSync(cl.INDEX_FILE, JSON.stringify(index, null, 2));
    console.log(`Boosted "${target.name}" to 85% confidence\n`);
    
    console.log('⚡ Evolving high-confidence instincts...\n');
    const evolved = cl.evolveInstincts(0.7);
    console.log(`✅ Evolved ${evolved.evolved} instincts into skills:`);
    evolved.skills.forEach(s => console.log(`   • ${s}`));
  }
}

console.log('\n📁 STEP 5: Generated Files');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const fs = require('fs');
const path = require('path');

// List instinct files
const instinctFiles = fs.readdirSync(cl.INSTINCTS_DIR).filter(f => f.endsWith('.md'));
console.log(`\nInstinct files (${instinctFiles.length}):`);
instinctFiles.forEach(f => {
  const stat = fs.statSync(path.join(cl.INSTINCTS_DIR, f));
  console.log(`  📄 ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
});

// List auto-generated skills
if (fs.existsSync(cl.AUTO_SKILLS_DIR)) {
  const skillFiles = fs.readdirSync(cl.AUTO_SKILLS_DIR).filter(f => f.endsWith('.md'));
  console.log(`\nAuto-generated skills (${skillFiles.length}):`);
  skillFiles.forEach(f => {
    console.log(`  🎓 ${f}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('DEMONSTRATION COMPLETE');
console.log('═══════════════════════════════════════════════════════');
