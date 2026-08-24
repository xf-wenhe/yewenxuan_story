const fs = require('fs'), p = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const allText = [];
for (const v of V) {
  const d = p.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md')))
    allText.push(fs.readFileSync(p.join(d, f), 'utf-8'));
}
const combined = allText.join('\n');

// Check what "指尖触" actually matches
const PATTERNS = [
  ['指尖触', 10],
  ['握了握', 5],
  ['咬了咬', 5],
  ['攥了攥', 5],
  ['指腹按', 5],
  ['眉头紧锁', 5],
  ['掌心全是汗', 5],
];

const ctx = 25;
for (const [pat, maxShow] of PATTERNS) {
  let cnt = 0;
  for (const t of allText) {
    let i = t.indexOf(pat);
    while (i >= 0) {
      cnt++;
      if (cnt <= maxShow) {
        const start = Math.max(0, i - ctx);
        const end = Math.min(t.length, i + pat.length + ctx);
        console.log('  ' + pat + ' [' + cnt + '] ...' + t.slice(start, end).replace(/\s+/g, '') + '...');
      }
      i = t.indexOf(pat, i + pat.length);
    }
  }
  console.log('  ' + pat + ' TOTAL: ' + cnt);
  // Also show what follows "指尖触" if relevant
  if (pat === '指尖触') {
    const after = new Map();
    for (const t of allText) {
      let i = t.indexOf(pat);
      while (i >= 0) {
        const following = t.slice(i + pat.length, i + pat.length + 4);
        after.set(following, (after.get(following) || 0) + 1);
        i = t.indexOf(pat, i + pat.length);
      }
    }
    console.log('  Following 4 chars:');
    for (const [s, c] of [...after.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15)) {
      console.log('    "' + s + '": ' + c);
    }
  }
  if (pat === '指腹按') {
    const after = new Map();
    for (const t of allText) {
      let i = t.indexOf(pat);
      while (i >= 0) {
        const following = t.slice(i + pat.length, i + pat.length + 4);
        after.set(following, (after.get(following) || 0) + 1);
        i = t.indexOf(pat, i + pat.length);
      }
    }
    console.log('  Following 4 chars:');
    for (const [s, c] of [...after.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15)) {
      console.log('    "' + s + '": ' + c);
    }
  }
  console.log('');
}