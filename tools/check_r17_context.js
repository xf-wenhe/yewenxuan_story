const fs = require('fs'), p = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const PATTERNS = ['嘴角微微','嘴角轻轻','握了握','咬了咬','攥了攥','喉咙滚动','声音有些颤抖','呼吸一紧','呼吸变得','呼吸急促','眉头紧锁'];
const ctx = 25;
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
        if (cnt <= 5) {
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