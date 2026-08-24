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
  '脑海中浮现','脑海里浮现','脑海中闪过','脑海里闪过','脑海中回荡','脑海里回荡',
  '呼吸之间','呼吸间','呼吸一紧','呼吸变得','呼吸急促','呼吸微滞','呼吸一顿',
  '喉咙滚动','喉结滚动','喉结一滚',
  '眼底闪过','眼底掠过','眼底深处',
  '涌动心头','涌向心头','涌上心头',
  '眼尾一挑','眼角一挑',
  '呼吸声中','呼吸声里','呼吸声渐','呼吸声带',
];

const ctx = 30;
for (const pat of PATTERNS) {
  let cnt = 0;
  for (const t of allText) {
    let i = t.indexOf(pat);
    while (i >= 0) {
      cnt++;
      if (cnt <= 5) {
        const start = Math.max(0, i - ctx);
        const end = Math.min(t.length, i + pat.length + ctx);
        console.log('  ' + pat + ' [' + cnt + '] ...' + t.slice(start, end).replace(/\s+/g, '') + '...');
      }
      i = t.indexOf(pat, i + pat.length);
    }
  }
  console.log('  ' + pat + ' TOTAL: ' + cnt + '\n');
}