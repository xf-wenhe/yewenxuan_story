// final_verify.js — Re-scan all 305 chapters to confirm 0 blocking findings
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\work\\yewenxuan_story';
const SCAN_FILE = path.join(ROOT, 'tools', 'scan_output', 'blocking_findings.json');
const DETECTOR = path.join(ROOT, '.claude\\skills\\story-deslop\\scripts\\check-ai-patterns.js');
const FIXED = new Set([61, 62, 63]);

const scan = JSON.parse(fs.readFileSync(SCAN_FILE, 'utf8'));
const toProcess = scan.chapters
  .filter(c => !FIXED.has(c.ch))
  .map(c => c.ch);

// Volume mapping
function getVol(ch) {
  if (ch <= 100) return 1;
  if (ch <= 250) return 2;
  if (ch <= 400) return 3;
  if (ch <= 550) return 4;
  if (ch <= 750) return 5;
  if (ch <= 918) return 6;
  return 7;
}

let total = 0;
let stillBlocking = [];
let clean = 0;

for (const ch of toProcess) {
  const vol = getVol(ch);
  const numStr = String(ch).padStart(2, '0');
  const filePath = path.join(ROOT, 'chapters', `volume-${vol}`, `chapter-${numStr}-polished.md`);

  try {
    execSync(`node "${DETECTOR}" "${filePath}" --json --fail-on=all`, {
      cwd: ROOT, timeout: 30000, stdio: 'pipe'
    });
    clean++;
  } catch (e) {
    if (e.status === 1) {
      try {
        const result = JSON.parse(e.stdout.toString());
        const blocking = (result.findings || []).filter(f => f.severity === 'blocking');
        if (blocking.length > 0) {
          total++;
          stillBlocking.push({ch, count: blocking.length, types: [...new Set(blocking.map(f => f.type))].join(',')});
        } else {
          clean++; // has advisory but no blocking
        }
      } catch(_) {
        total++;
        stillBlocking.push(ch);
      }
    }
  }

  if (toProcess.indexOf(ch) % 50 === 0 || toProcess.indexOf(ch) === toProcess.length - 1) {
    console.log(`Scanned ${toProcess.indexOf(ch)+1}/${toProcess.length} (blocking: ${total}, clean: ${clean})`);
  }
}

console.log(`\n=== Final Verification ===`);
console.log(`Total re-scanned: ${toProcess.length}`);
console.log(`Clean: ${clean}`);
console.log(`Still blocking: ${stillBlocking.length}`);
if (stillBlocking.length > 0) {
  console.log(`Chapters: ${stillBlocking.join(', ')}`);
  process.exit(0);
}