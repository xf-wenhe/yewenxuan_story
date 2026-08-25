const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const textAll = [];
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    textAll.push(fs.readFileSync(path.join(d, f), 'utf-8'));
  }
}
const allText = textAll.join('\n');

// --- Specific patterns the user asked about ---
const specific = [
  ['声音在0429信号中传来', 'literal'],
  ['声音通过0429备份', 'literal'],
  ['声音在抖', 'literal'],
  ['声音在叶文轩的脑子里', 'literal'],
  ['声音。', 'literal'],
  ['声音"。', 'literal'],
  ['"声音"。', 'literal'],
  ['声音？', 'literal'],
  ['声音？', 'literal'],
  ['声音。女儿的声音', 'literal'],
  ['声音在', 'literal'],
  ['声音带', 'literal'],
  ['声音里', 'literal'],
  ['声音中', 'literal'],
  ['声音从', 'literal'],
  ['声音向', 'literal'],
  ['声音传', 'literal'],
];

console.log('=== SPECIFIC PATTERNS ===');
for (const [p, _] of specific) {
  let count = 0;
  const rx = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  let m;
  while ((m = rx.exec(allText)) !== null) { count++; }
  console.log(count + '\t' + JSON.stringify(p));
}

// --- Broad "声音" contextual scan ---
// Find all 声音 occurrences and extract a short window around them
console.log('\n=== "声音" FULL WINDOW SCAN (top 60 by frequency) ===');
const counts = {};
const rx = /声音.{0,30}/g;
let m;
while ((m = rx.exec(allText)) !== null) {
  const key = m[0];
  counts[key] = (counts[key] || 0) + 1;
}
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
for (const [k, v] of sorted.slice(0, 60)) {
  console.log(v + '\t' + JSON.stringify(k));
}
