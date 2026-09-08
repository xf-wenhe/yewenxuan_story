// find_know_v2.js — Find narration-only "他知道/她知道" instances (skip dialogue)
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
  const pattern = /(知道)/g;
  let matches = [];
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const pos = m.index;
    // Check if this is in dialogue (between " and ")
    const before = text.substring(0, pos);
    const after = text.substring(pos + 2);
    // Count unescaped quotes before and after
    const quotesBefore = (before.match(/"/g) || []).length;
    const quotesAfter = (after.match(/"/g) || []).length;
    // If odd number of quotes before, we're inside dialogue
    const inDialogue = (quotesBefore % 2 === 1);

    if (!inDialogue) {
      // Get context
      const ctxStart = Math.max(0, pos - 15);
      const ctxEnd = Math.min(text.length, pos + 17);
      matches.push({
        ch, pos,
        context: text.substring(ctxStart, ctxEnd).replace(/\n/g, '↵')
      });
    }
  }
  if (matches.length > 0) {
    results.push({ ch, count: matches.length, instances: matches });
  }
}

for (const r of results) {
  console.log('\n=== ch' + r.ch + ' (' + r.count + ' narration instances) ===');
  for (const inst of r.instances) {
    console.log('  ...' + inst.context + '...');
  }
}
console.log('\nTotal chapters: ' + results.length + ', Total instances: ' + results.reduce((s, r) => s + r.count, 0));
