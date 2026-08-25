const fs = require('fs');
const path = require('path');
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

// Fix bad alt: replace "那声音说了句。。" with "那人说了句。。"
const bad = '那声音说了句。。';
const good = '那人说了句。。';

let total = 0;
let changed = 0;
let cjkDrops = [];

for (const volDir of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const fp = path.join(d, f);
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let text = fs.readFileSync(fp, 'utf-8');
    const before = countCjk(text);
    let fileRepl = 0;
    let idx = text.indexOf(bad);
    while (idx >= 0) {
      text = text.slice(0, idx) + good + text.slice(idx + bad.length);
      idx = text.indexOf(bad, idx + good.length);
      total++;
      fileRepl++;
    }
    if (fileRepl > 0) {
      const after = countCjk(text);
      fs.writeFileSync(fp, text, 'utf-8');
      changed++;
      if (after < 3000) cjkDrops.push([chNum, before, after]);
    }
  }
}

console.log('Fixed bad alt: ' + total + ' replacements, ' + changed + ' chapters');

// Verify: check for both source and bad alt
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const src = text.split('声音说了句。。').length - 1;
    const badC = text.split(bad).length - 1;
    if (src > 0 || badC > 0) {
      console.log('  ' + f + ': source=' + src + ' bad=' + badC);
    }
  }
}

if (cjkDrops.length) {
  console.log('CJK drops:');
  for (const [ch, b, a] of cjkDrops) console.log('  ch' + ch + ': ' + b + ' -> ' + a);
}