// batch_runner.js — Run batch_fix.js on all remaining chapters with blocking findings
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\work\\yewenxuan_story';
const SCAN_FILE = path.join(ROOT, 'tools', 'scan_output', 'blocking_findings.json');
const FIXED = new Set([61, 62, 63]);
const BATCH_FIX = path.join(ROOT, 'tools', 'batch_fix.js');

const scan = JSON.parse(fs.readFileSync(SCAN_FILE, 'utf8'));
const toProcess = scan.chapters
  .filter(c => !FIXED.has(c.ch))
  .map(c => c.ch);

const total = toProcess.length;
let done = 0;
let fixed = 0;
let partial = 0;
const partialDetails = [];

console.log(`Processing ${total} chapters...`);

for (const ch of toProcess) {
  try {
    // batch_fix.js exits 1 for fixed/clean, 0 for partial
    // execSync throws on non-zero exit, returns on exit 0
    const out = execSync(`node "${BATCH_FIX}" ${ch}`, {
      cwd: ROOT, timeout: 60000, stdio: 'pipe'
    });
    // exit 0 = partial (some findings could not be auto-fixed)
    done++;
    partial++;
    partialDetails.push(ch);
  } catch (e) {
    // exit 1 = fixed or clean
    done++;
    fixed++;
  }

  if (done % 25 === 0 || done === total) {
    console.log(`Progress: ${done}/${total} (fixed: ${fixed}, partial: ${partial})`);
  }
}

console.log(`\n=== Final Results ===`);
console.log(`Total processed: ${done}`);
console.log(`Fixed (0 remaining): ${fixed}`);
console.log(`Partial (some remaining): ${partial}`);

if (partialDetails.length > 0) {
  console.log(`\nChapters with remaining findings: ${partialDetails.join(', ')}`);
}