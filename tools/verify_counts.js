const fs = require('fs');
const path = require('path');

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

const below = [];
let total = 0, totalCjk = 0;

for (const vol of ['2','3','5']) {
  const dir = path.join('chapters', 'volume-' + vol);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('-polished.md'))) {
    const text = fs.readFileSync(path.join(dir, f), 'utf-8');
    const cjk = countCjk(text);
    total++;
    totalCjk += cjk;
    if (cjk < 3000) below.push(f + ' (' + cjk + ')');
  }
}

console.log('Total chapters:', total);
console.log('Total CJK:', totalCjk);
console.log('Below 3000:', below.length);
if (below.length > 0) below.forEach(b => console.log('  ' + b));
console.log('Min:', Math.min(...below.map(b => parseInt(b.match(/\((\d+)\)/)[1])) || 'N/A'));