const fs = require('fs'), p = require('path');
const fromCodes = cs => cs.map(c => String.fromCharCode(c)).join('');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const allText = [];
for (const v of V) {
  const d = p.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md')))
    allText.push([f, fs.readFileSync(p.join(d, f), 'utf-8')]);
}

const checks = [
  fromCodes([33058,21517,27092,39243]), // 声音沙哑
  fromCodes([33058,21517,20582,24778]), // 声音颤抖
  fromCodes([33058,21517,27092,22833]), // 声音嘶哑
  fromCodes([21897,32467,21160,21160]), // 喉结动动
  fromCodes([21897,32467,21160,20102]), // 喉结动了
  fromCodes([21897,32467,28378,21160]), // 喉结滚动了 (R21 alternative:喉结滚 as substring)
  fromCodes([21897,32467,28378,21160]), // 喉结滚动了
];

const ctx = 35;
for (const pat of checks) {
  let cnt = 0;
  console.log('\n=== "' + pat + '" ===');
  for (const [f, t] of allText) {
    let i = t.indexOf(pat);
    while (i >= 0) {
      cnt++;
      if (cnt <= 15) {
        const start = Math.max(0, i - ctx);
        const end = Math.min(t.length, i + pat.length + ctx);
        console.log('  ' + cnt + ' ' + f + ': ...' + t.slice(start, end).replace(/\s+/g, '') + '...');
      }
      i = t.indexOf(pat, i + pat.length);
    }
  }
  console.log('  TOTAL: ' + cnt);
}