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

// R58 broader scan
const re = /声音.{1,20}。/g;
const re2 = /他还需要.{1,20}。/g;
const re3 = /韩冰开口.{1,30}。/g;
const re4 = /叶文轩.{1,20}声音.{1,20}。/g;
const re5 = /赵大嘴.{1,20}声音.{1,20}。/g;

function scan(re, label, min) {
  const matches = allText.match(re) || [];
  const counts = {};
  for (const m of matches) {
    const key = m.slice(0, 30);
    counts[key] = (counts[key] || 0) + 1;
  }
  const sorted = Object.entries(counts).filter(([k,v]) => v >= min).sort((a,b) => b[1] - a[1]);
  console.log('\n=== ' + label + ' ===');
  for (const [k,v] of sorted.slice(0, 50)) console.log(v + '\t' + k);
}

scan(re, '声音.', 12);
scan(re2, '他还需要.', 8);
scan(re3, '韩冰开口.', 3);
scan(re4, '叶文轩.*声音.', 10);
scan(re5, '赵大嘴.*声音.', 10);