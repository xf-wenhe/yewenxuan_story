// find_know_v3.js — Find ONLY sentence-start "他知道/她知道" narration (the deadly pattern)
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

const results = [];

for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n');

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    // Skip dialogue lines (start with ")
    if (line.trim().startsWith('"')) continue;
    // Skip system output lines (start with 「)
    if (line.trim().startsWith('「')) continue;

    // Find all sentence-start "他知道" or "她知道"
    // Patterns: start of line, after 。, after ！, after ？, after ；
    const sentencePattern = /(?:^|[。！？；])\s*(?:他知道|她知道)/g;
    let m;
    while ((m = sentencePattern.exec(line)) !== null) {
      const pos = m.index;
      const after = line.substring(pos + m[0].length, pos + m[0].length + 30);
      // Get line number
      results.push({ ch, line: li + 1, pos, after: after.replace(/\n/g, '') });
    }
  }
}

console.log('Sentence-start 他知道/她知道 instances:\n');
for (const r of results) {
  console.log('ch' + r.ch + ' line ' + r.line + ': ...' + r.after);
}
console.log('\nTotal: ' + results.length + ' instances across ' + new Set(results.map(r => r.ch)).size + ' chapters');
