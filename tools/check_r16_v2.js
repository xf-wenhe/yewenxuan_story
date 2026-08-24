const fs = require('fs'), p = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const PATTERNS = ['心脏猛地','猛地一跳','猛地一沉','喉咙动了','面无表情'];
const ctx = 20;
for (const pat of PATTERNS) {
  let cnt = 0;
  for (const v of V) {
    const d = p.join(process.cwd(), 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      const t = fs.readFileSync(p.join(d, f), 'utf-8');
      let i = t.indexOf(pat);
      while (i >= 0) {
        cnt++;
        if (cnt <= 6) {
          const start = Math.max(0, i - ctx);
          const end = Math.min(t.length, i + pat.length + ctx);
          console.log('  ' + pat + ' [' + cnt + '] ...' + t.slice(start, end).replace(/\s+/g, '') + '...');
        }
        i = t.indexOf(pat, i + pat.length);
      }
    }
  }
  console.log('  ' + pat + ' TOTAL: ' + cnt + '\n');
}