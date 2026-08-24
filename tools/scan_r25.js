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

const checks = [
  // Previously identified
  '忽然', '突然', '涌上', '涌出', '弥漫', '忽然觉得',
  // R24 new alternatives to check
  '这话没有出口', '这些话停在了嗓子口', '这话没有说出口', '这些念头留在心里',
  '这个念头一出现', '念头一旦出现', '一旦冒出来', '这念头一冒出来',
  '他没把话说完', '话没说完', '话说到一半停住了',
  '远处的风声似乎大了一些', '风似乎也大了一些', '远处的风声大了一些', '风声似乎也大了一些',
  '周围的空气也因为这句话', '空气似乎也因为这句话', '周围的一切也因为这句话', '周围的空气静了一瞬',
  // Broader AI tropes
  '忽然觉得', '突然觉得', '心头一', '胸口一', '呼吸一', '脚步一',
  '涌上心头', '涌上心口', '涌上脑', '涌上脸',
  '弥漫在', '弥漫开', '弥漫出',
  '弥漫开来', '弥漫在整个',
  '弥漫',
  '一股', '不禁', '微微', '缓缓', '淡淡',
  '眼眸', '瞳孔', '眼底', '目光',
  '不是……而是', '不是', '而是',
  '他知道', '脑中闪过', '心中涌起', '眼中闪过', '嘴角勾起', '眉头微皱', '心中暗道',
];

console.log('=== R25 SCAN ===');
const results = [];
for (const s of checks) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 3) results.push([cnt, s]);
}
results.sort((a,b) => b[0] - a[0]);
for (const [cnt, s] of results) console.log('  ' + s + ': ' + cnt);