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
  '胸口发紧','胸口发闷','胸口发沉','胸口发凉','胸口发寒',
  '不由','不由地','不由自主',
  '喉结上下滚','喉结滚动','喉结动了动','喉结一滚','喉结动了动',
];

const ctx = 30;
for (const pat of PATTERNS) {
  let cnt = 0;
  for (const t of allText) {
    let i = t.indexOf(pat);
    while (i >= 0) {
      cnt++;
      if (cnt <= 8) {
        const start = Math.max(0, i - ctx);
        const end = Math.min(t.length, i + pat.length + ctx);
        console.log('  ' + pat + ' [' + cnt + '] ...' + t.slice(start, end).replace(/\s+/g, '') + '...');
      }
      i = t.indexOf(pat, i + pat.length);
    }
  }
  console.log('  ' + pat + ' TOTAL: ' + cnt + '\n');
}