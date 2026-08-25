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
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
}

for (const prefix of ['声音低', '声音平', '音量低', '声音轻', '脑在', '声音沙', '声调', '声音哑']) {
  console.log('=== ' + prefix + ' ===');
  const results = scan(prefix);
  for (const [k,v] of results) console.log(v + ' ' + k);
}