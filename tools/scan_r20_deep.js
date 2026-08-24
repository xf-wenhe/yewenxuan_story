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
  '脑海中映出','脑海中映现','脑海中出现',
  '脑海里映出','脑海里映现',
  '脑中闪过','脑中浮现','脑中掠过',
  '心头','脑际','脑际闪过',
  '胸口沉闷','胸口沉闷着','胸口沉闷下去',
  '胸口发紧','胸口发闷','胸口发沉',
  '胸口发凉','胸口发寒','胸口发冷',
  '眼底闪过','眼底掠过','眼底深处',
  '眼尾一挑','眼角一挑',
  '呼吸声中','呼吸声里','呼吸声渐','呼吸声带',
  '喉结','喉结上下滚','喉结滚动','喉结动了动','喉结一滚',
  '涌向心头','涌上心头','涌动心头',
  '一股寒意','一股暖流','一股冲动','一股凉意','一股热流',
  '微微','轻轻','缓缓','不禁','不由',
  '声音微颤','声音微抖','声音有些发颤','声音有些沙哑','声音有些低沉',
  '眼神冰冷','眼神深邃','眼神坚定','眼神凛冽',
  '眼神一暗','眼神一凛','眼神一冷','眼神复杂',
  '掌心一片冰凉','掌心发凉','掌心冰凉',
  '步伐','步伐一顿','步伐微顿',
];

console.log('=== R20 DEEP SCAN ===');
for (const s of checks) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 2) console.log('  ' + s + ': ' + cnt);
}