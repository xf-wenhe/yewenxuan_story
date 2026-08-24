const fs = require('fs');
const path = require('path');
const base = process.cwd();
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

// Collect all chapter texts
const files = [];
let totalCjk = 0;
let below = 0;
let belowList = [];

for (const v of V) {
  const d = path.join(base, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md')).sort()) {
    const fp = path.join(d, f);
    const t = fs.readFileSync(fp, 'utf-8');
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    const cjk = [...t].filter(c => c >= '一' && c <= '鿿').length;
    totalCjk += cjk;
    if (cjk < 3000) { below++; belowList.push([chNum, cjk]); }
    files.push(t);
  }
}

const combined = files.join('\n');

console.log('=== R17 VERIFICATION ===');
console.log('Files: ' + files.length);
console.log('Total CJK: ' + totalCjk.toLocaleString());
console.log('Below 3000: ' + below);
if (belowList.length) for (const [ch, c] of belowList) console.log('  ch' + ch + ': ' + c);

const checks = [
  '指节发白','指节泛白','胸口闷','嘴角微微','嘴角轻轻',
  '眼前浮现','指甲掐','掌心渗出','声音有些颤抖'
];
console.log('\nRemaining patterns:');
for (const p of checks) {
  const raw = combined.split(p).length - 1;
  console.log('  "' + p + '": ' + raw + ' (raw split)');
}

// For 指甲掐, check if remaining are inside 指甲掐入/指甲掐进
if (combined.includes('指甲掐')) {
  let temp = combined;
  temp = temp.split('指甲掐入').join('');
  temp = temp.split('指甲掐进').join('');
  const real = temp.split('指甲掐').length - 1;
  console.log('  指甲掐 (after removing 掐入/掐进): ' + real + ' (real orphans)');
}

// Alt distribution
console.log('\nAlt distribution:');
const alts = ['指节咬紧','指节生疼','指节发僵','指关节发白','指关节泛白',
              '指甲陷进肉里','手指攥得发僵','心口堵','心口紧','胸腔堵',
              '胸口发堵','胸口发紧','心口发沉','嘴角抽动','嘴角一抽',
              '嘴角动了动','嘴角扯了扯','眼前出现','眼前展开','眼前显现',
              '眼前呈现','眼前映出','指甲抠','指甲抓','指甲掐入','指甲掐进',
              '掌心冒出','掌心冒汗','掌心发汗','掌心出细汗',
              '声音发颤','声音颤抖','声音发抖','声音抖起来'];
let altTotal = 0;
for (const a of alts) {
  const c = combined.split(a).length - 1;
  if (c > 0) console.log('  ' + a + ': ' + c);
  altTotal += c;
}
console.log('Alt total: ' + altTotal);
console.log('\nResult: ' + (below === 0 && altTotal === 113 ? 'CLEAN' : 'ISSUE'));