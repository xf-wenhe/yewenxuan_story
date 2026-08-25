const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const NN6 = '嗓音涩哑';

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

const alts = ['嗓音粗哑', '嗓音沙哑', '嗓音哑了', '嗓音沙哑哑'];
let counters = {};
let totalReplaced = 0;

for (const volDir of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const fp = path.join(d, f);
    let text = fs.readFileSync(fp, 'utf-8');
    let idx = text.indexOf(NN6);
    let cnt = 0;
    while (idx >= 0) {
      const alt = alts[cnt % alts.length];
      text = text.slice(0, idx) + alt + text.slice(idx + NN6.length);
      idx = text.indexOf(NN6, idx + alt.length);
      cnt++;
    }
    if (cnt > 0) {
      fs.writeFileSync(fp, text, 'utf-8');
      totalReplaced += cnt;
    }
  }
}

console.log('Cleanup: ' + totalReplaced + ' 嗓音涩哑 replaced');

let total = 0;
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    total += fs.readFileSync(path.join(d, f), 'utf-8').split(NN6).length - 1;
  }
}
console.log('Remaining 嗓音涩哑: ' + total);