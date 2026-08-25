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

// scan for "声音轻得几乎" full sentences
let idx = -1, counts = {};
while ((idx = allText.indexOf('声音轻得几乎', idx+1)) >= 0) {
  const snippet = allText.slice(idx, idx+25);
  counts[snippet] = (counts[snippet] || 0) + 1;
}
console.log('=== 声音轻得几乎 ===');
for (const [k,v] of Object.entries(counts).sort((a,b)=>b[1]-a[1])) console.log(v + ' ' + k);

// "声音低得几乎" full sentences
idx = -1, counts = {};
while ((idx = allText.indexOf('声音低得几乎', idx+1)) >= 0) {
  const snippet = allText.slice(idx, idx+30);
  counts[snippet] = (counts[snippet] || 0) + 1;
}
console.log('=== 声音低得几乎 ===');
for (const [k,v] of Object.entries(counts).sort((a,b)=>b[1]-a[1])) console.log(v + ' ' + k);