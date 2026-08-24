const fs = require('fs'), p = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const T = ['没有任何表情','嘴角动了动','呼吸猛地','眼底深处','脸上出现','脸上露出','情不自禁','目光变得'];
let below = 0, tot = 0, found = 0;

for (const v of V) {
  const d = p.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const t = fs.readFileSync(p.join(d, f), 'utf-8');
    let c = 0;
    for (const x of t) { if (x >= '一' && x <= '鿿') c++; }
    tot += c;
    if (c < 3000) below++;
    for (const pat of T) {
      let n = 0, i = t.indexOf(pat);
      while (i >= 0) { n++; i = t.indexOf(pat, i + pat.length); }
      if (n > 0) { console.log('REMAINING ' + pat + ' in ' + f + ': ' + n); found += n; }
    }
  }
}
console.log('Total CJK: ' + tot.toLocaleString());
console.log('Below 3000: ' + below);
console.log('Patterns remaining: ' + found);
console.log('All clear: ' + (found === 0 && below === 0));