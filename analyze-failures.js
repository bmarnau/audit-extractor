const fs = require('fs');
const results = JSON.parse(fs.readFileSync('Testoutput/test-results.json', 'utf8'));

const errorTypes = {};
let totalFailures = 0;

results.testResults.forEach(suite => {
  const suiteName = suite.name.replace(/.*extractor[\\/]/, '').replace(/\\/g, '/');
  
  suite.assertionResults
    .filter(t => t.status === 'failed')
    .forEach(test => {
      totalFailures++;
      const msg = test.failureMessages[0] || '';
      let type = 'OTHER';
      
      if (msg.includes('Cannot read properties of undefined')) type = 'UNDEFINED';
      else if (msg.includes('toBeDefined')) type = 'MISSING_FIELD';
      else if (msg.includes('Expected')) type = 'VALUE_MISMATCH';
      else if (msg.includes('toContain')) type = 'MISSING_CONTENT';
      else if (msg.includes('Cannot find')) type = 'NOT_FOUND';
      
      if (!errorTypes[type]) errorTypes[type] = [];
      errorTypes[type].push({ 
        suite: suiteName.substring(0, 60), 
        test: test.title.substring(0, 50)
      });
    });
});

console.log('\n=== PHASE 35 FEHLERANALYSE ===\n');
console.log(`Gesamt fehlgeschlagene Tests: ${totalFailures}\n`);

Object.entries(errorTypes)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([type, failures]) => {
    console.log(`[${failures.length}] ${type}`);
    failures.slice(0, 3).forEach(f => {
      console.log(`  • ${f.suite}`);
      console.log(`    └─ ${f.test}`);
    });
    console.log('');
  });

console.log('='.repeat(70));
console.log('\nRECOMMENDATIONS:\n');
console.log('PRIORITY 1: Fix UNDEFINED errors (likely initialization issues)');
console.log('PRIORITY 2: Fix VALUE_MISMATCH errors (logic/calculation issues)');
console.log('PRIORITY 3: Fix MISSING_FIELD errors (add missing validation/config)');
console.log('PRIORITY 4: Fix MISSING_CONTENT errors (add validation output)\n');
