const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const P = '声音压到';
const ALTS = ['声音压至', '声音压至', '声音压至', '声音压至'];
let n = 0;
let counters = {};
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const fp = path.join(d, f);
    let t = fs.readFileSync(fp, 'utf-8');
    let idx = t.indexOf(P);
    while (idx >= 0) {
      n++;
      const alt = ALTS[(n-1) % 4];
      t = t.slice(0, idx) + alt + t.slice(idx + P.length);
      idx = t.indexOf(P, idx + alt.length);
    }
    if (n > 0 && t !== fs.readFileSync(fp, 'utf-8')) fs.writeFileSync(fp, t, 'utf-8');
  }
}
console.log('声音压到 cleanup: ' + n + ' replaced');
// verify
let remaining = 0;
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    remaining += fs.readFileSync(path.join(d, f), 'utf-8').split(P).length - 1;
  }
}
console.log('Remaining 声音压到: ' + remaining);