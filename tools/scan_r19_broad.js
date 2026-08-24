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
  '脚步一顿','脚步微微','脚步轻轻','脚步微顿','脚步轻顿',
  '呼吸一紧','呼吸变得','呼吸急促','呼吸微滞','呼吸一顿',
  '声音微颤','声音微抖','声音有些发颤','声音有些沙哑','声音有些低沉',
  '眼神冰冷','眼神深邃','眼神坚定','眼神凛冽',
  '眼神一暗','眼神一凛','眼神一冷','眼神复杂',
  '掌心一片','掌心发凉','掌心冰凉','掌心一片冰凉',
  '胸口一闷','胸口一窒','胸口一紧','胸口一痛','胸口窒',
  '喉结滚动','喉咙滚动','喉结一滚',
  '一股寒意','一股暖流','一股冲动','一股热流','一股凉意',
  '涌动心头','涌向心头',
  '眼底闪过','眼底掠过','眼底深处',
  '眼尾一挑','眼角一挑',
  '心头','脑际','脑海',
  '呼吸间','呼吸声',
  '微微','轻轻','缓缓','不禁',
];

console.log('=== R19 BROAD SCAN ===');
for (const s of checks) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 2) console.log('  ' + s + ': ' + cnt);
}