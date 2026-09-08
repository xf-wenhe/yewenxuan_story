// find_know.js — Find remaining "他知道/她知道" instances with context
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n');
  const pattern = /知道/g;
  let matches = [];
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const before = text.substring(Math.max(0, m.index - 20), m.index);
    const after = text.substring(m.index + 2, Math.min(text.length, m.index + 22));
    matches.push({ pos: m.index, before, after });
  }
  if (matches.length > 0) {
    console.log('\n=== ch' + ch + ' (' + matches.length + ' instances) ===');
    for (const mt of matches) {
      console.log('  ...' + mt.before + '[知道]' + mt.after);
    }
  }
}
