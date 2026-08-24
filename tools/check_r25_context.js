const fs = require('fs'), p = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const allText = [];
for (const v of V) {
  const d = p.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md')))
    allText.push([f, fs.readFileSync(p.join(d, f), 'utf-8')]);
}

const checks = [
  ['忽然', '忽然'],
  ['突然', '突然'],
];
const ctx = 40;
for (const [label, pat] of checks) {
  console.log('\n=== "' + label + '" (showing 20 samples) ===');
  let cnt = 0;
  for (const [f, t] of allText) {
    let i = t.indexOf(pat);
    while (i >= 0) {
      cnt++;
      if (cnt <= 20) {
        const start = Math.max(0, i - ctx);
        const end = Math.min(t.length, i + pat.length + ctx);
        console.log('  ' + cnt + ' ' + f + ': ...' + t.slice(start, end).replace(/\s+/g, '') + '...');
      }
      i = t.indexOf(pat, i + pat.length);
    }
  }
  console.log('  TOTAL: ' + cnt);
}