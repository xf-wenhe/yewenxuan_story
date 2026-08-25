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

function scan(prefix) {
  let idx = -1, counts = {};
  while ((idx = allText.indexOf(prefix, idx+1)) >= 0) {
    const snippet = allText.slice(idx, idx+30);
    counts[snippet] = (counts[snippet] || 0) + 1;
  }
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  return {total, entries: Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5)};
}

for (const prefix of [
  '声音轻得', '声音低得', '音量低', '音量轻',
  '他还需要', '脑子', '赵大嘴的声', '韩冰开口',
  '韩冰用极低', '叶文轩的脸', '赵大嘴出声',
  '声音轻得几乎', '声音低得几乎'
]) {
  const r = scan(prefix);
  if (r.total >= 5) {
    console.log(r.total + '\t' + prefix);
    for (const [k,v] of r.entries) console.log('  ' + v + ' ' + k);
  }
}