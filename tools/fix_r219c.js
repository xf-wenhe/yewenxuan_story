// fix_r219c.js — Collapse excessive blank lines
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

let fixed = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  const orig = fs.readFileSync(fp, 'utf-8');
  // Collapse 3+ consecutive blank lines to 2
  const text = orig.replace(/\n{3,}/g, '\n\n');
  if (text !== orig) {
    fs.writeFileSync(fp, text, 'utf-8');
    fixed++;
  }
}
console.log('Chapters fixed: ' + fixed);
