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

const patterns = [
  [/声音.{1,20}/g, '声音.', 3],
  [/声线.{1,20}/g, '声线.', 3],
  [/嗓音.{1,20}/g, '嗓音.', 3],
  [/声调.{1,20}/g, '声调.', 3],
  [/.{0,5}声音.{0,5}是/g, 'X声音是', 3],
  [/.{0,5}声音.{0,5}说/g, 'X声音说', 3],
  [/.{0,5}声音.{0,5}带/g, 'X声音带', 3],
  [/.{0,5}声音.{0,5}传/g, 'X声音传', 3],
  [/声音.{0,3}里.{0,5}/g, '声音里', 3],
  [/声音.{0,3}中.{0,5}/g, '声音中', 3],
];
for (const [re, label, min] of patterns) {
  const counts = {};
  const rx = new RegExp(re.source, 'g');
  let m;
  while ((m = rx.exec(allText)) !== null) {
    const key = m[0].slice(0, 30);
    counts[key] = (counts[key] || 0) + 1;
  }
  const sorted = Object.entries(counts).filter(([k,v]) => v >= min).sort((a,b) => b[1] - a[1]);
  if (sorted.length) {
    console.log('\n=== ' + label + ' ===');
    for (const [k,v] of sorted.slice(0, 40)) console.log(v + '\t' + k);
  }
}