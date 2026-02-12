/**
 * Startup Benchmark - Compare v4.0 vs v4.1
 * 
 * PicoClaw-inspired efficiency metrics
 */

const fs = require('fs');
const { performance } = require('perf_hooks');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  FORTRESS ZAG STARTUP BENCHMARK                        ║');
console.log('║  Comparing v4.0 (eager) vs v4.1 (lazy-loading)        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function benchmarkV40() {
  console.log('🔄 Testing v4.0 (Eager Loading)...');
  
  const startMemory = process.memoryUsage();
  const startTime = performance.now();
  
  // Clear require cache for agent files
  Object.keys(require.cache).forEach(key => {
    if (key.includes('agent.js') || key.includes('agent-optimized.js')) {
      delete require.cache[key];
    }
  });
  
  try {
    const { FortressZag } = require('../src/core/agent.js');
    const agent = new FortressZag({ workdir: './data' });
    await agent.initialize();
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    const stats = {
      version: 'v4.0 (Eager)',
      startupTime: Math.round(endTime - startTime),
      memoryUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024),
      totalMemory: Math.round(endMemory.heapUsed / 1024 / 1024)
    };
    
    console.log(`  Startup: ${stats.startupTime}ms`);
    console.log(`  Memory: ${stats.memoryUsed}MB (total: ${stats.totalMemory}MB)`);
    
    return stats;
  } catch (error) {
    console.error('  Error:', error.message);
    return null;
  }
}

async function benchmarkV41() {
  console.log('\n🔄 Testing v4.1 (Lazy Loading)...');
  
  const startMemory = process.memoryUsage();
  const startTime = performance.now();
  
  // Clear require cache for agent files
  Object.keys(require.cache).forEach(key => {
    if (key.includes('agent.js') || key.includes('agent-optimized.js')) {
      delete require.cache[key];
    }
  });
  
  try {
    const { FortressZag } = require('../src/core/agent-optimized.js');
    const agent = new FortressZag({ 
      workdir: './data',
      memoryThreshold: 50 * 1024 * 1024 // 50MB threshold
    });
    await agent.initialize();
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    const stats = {
      version: 'v4.1 (Lazy)',
      startupTime: Math.round(endTime - startTime),
      memoryUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024),
      totalMemory: Math.round(endMemory.heapUsed / 1024 / 1024),
      lazyStats: agent.getStatus().lazyLoaded
    };
    
    console.log(`  Startup: ${stats.startupTime}ms`);
    console.log(`  Memory: ${stats.memoryUsed}MB (total: ${stats.totalMemory}MB)`);
    console.log(`  Lazy loaded: ${stats.lazyStats.cached} modules`);
    
    return stats;
  } catch (error) {
    console.error('  Error:', error.message);
    return null;
  }
}

async function runBenchmark() {
  const results = {
    v40: await benchmarkV40(),
    v41: await benchmarkV41()
  };
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  BENCHMARK RESULTS                                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  if (results.v40 && results.v41) {
    const timeImprovement = Math.round((1 - results.v41.startupTime / results.v40.startupTime) * 100);
    const memoryImprovement = Math.round((1 - results.v41.memoryUsed / results.v40.memoryUsed) * 100);
    
    console.log(`\n📊 Startup Time:`);
    console.log(`  v4.0 (Eager):  ${results.v40.startupTime}ms`);
    console.log(`  v4.1 (Lazy):   ${results.v41.startupTime}ms`);
    console.log(`  Improvement:   ${timeImprovement > 0 ? '+' : ''}${timeImprovement}%`);
    
    console.log(`\n📊 Memory Usage:`);
    console.log(`  v4.0 (Eager):  ${results.v40.memoryUsed}MB`);
    console.log(`  v4.1 (Lazy):   ${results.v41.memoryUsed}MB`);
    console.log(`  Improvement:   ${memoryImprovement > 0 ? '+' : ''}${memoryImprovement}%`);
    
    console.log(`\n🎯 Comparison to PicoClaw:`);
    console.log(`  PicoClaw target: <10MB RAM, <1s boot`);
    console.log(`  Fortress Zag v4.1: ~${results.v41.memoryUsed}MB RAM, ~${results.v41.startupTime}ms boot`);
    console.log(`  Gap to close: ~${results.v41.memoryUsed - 10}MB RAM, ~${results.v41.startupTime - 1000}ms boot`);
  }
  
  console.log('\n💡 Recommendations:');
  console.log('  1. Use --max-old-space-size=64 for 64MB heap limit');
  console.log('  2. Run with --optimize-for-size flag');
  console.log('  3. Consider pkg for single binary (removes Node.js overhead)');
  console.log('  4. Use lighter alternatives to heavy dependencies');
}

runBenchmark().catch(console.error);