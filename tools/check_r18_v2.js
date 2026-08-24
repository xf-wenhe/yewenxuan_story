const fs = require('fs'), p = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const allText = [];
for (const v of V) {
  const d = p.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md')))
    allText.push(fs.readFileSync(p.join(d, f), 'utf-8'));
}
const combined = allText.join('\n');

const PATTERNS = [
  '心头一颤','心头一紧','心头一沉','心头涌起','心头闪过',
  '脑中闪过','心头一动','心头掠过','心头一滞','心中闪过',
  '脑中浮现','涌上心头','心头一窒','心头一涩','心头一阵',
  '心中浮现','心里浮现','心中涌起','眉头紧锁','掌心全是汗'
];

const ctx = 30;
for (const pat of PATTERNS) {
  let cnt = 0;
  for (const t of allText) {
    let i = t.indexOf(pat);
    while (i >= 0) {
      cnt++;
      if (cnt <= 3) {
        const start = Math.max(0, i - ctx);
        const end = Math.min(t.length, i + pat.length + ctx);
        console.log('  ' + pat + ' [' + cnt + '] ...' + t.slice(start, end).replace(/\s+/g, '') + '...');
      }
      i = t.indexOf(pat, i + pat.length);
    }
  }
  console.log('  ' + pat + ' TOTAL: ' + cnt + '\n');
}