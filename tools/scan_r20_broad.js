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
  // 脑海/脑海中 variants
  '脑海中','脑海中映出','脑海中出现','脑海中映现','脑海中现出画面',
  '脑海里','脑海里映出','脑海里出现','脑海里映现',
  // 呼吸 variants
  '呼吸','呼吸一滞','呼吸一停','呼吸一顿','呼吸一沉',
  '呼吸沉了些','呼吸缓了下来','呼吸放深了','呼吸放轻了',
  '喘息急促','急促喘息','喘得急促','喘得发急',
  '呼吸声','呼吸声中','呼吸声里','呼吸声渐','呼吸声带',
  // 喉结/喉咙
  '喉结','喉结上下滚','喉结滚动一下','喉结动了动','喉咙动了动',
  '喉咙','喉咙清了清','喉咙清了一下','喉咙一紧',
  // 胸口 variants
  '胸口','胸口窒','胸口闷','胸口一闷','胸口一窒','胸口一紧','胸口一痛',
  '胸口沉闷','胸口沉闷着','胸口沉闷下去',
  // 眼底/眼尾
  '眼底','眼底闪过','眼底掠过','眼底深处',
  '眼尾','眼尾一挑','眼角一挑',
  // 心头/脑际/脑际闪过
  '心头','脑际','脑际闪过','脑中','脑中闪过','脑中浮现',
  // 一股 variants
  '一股','一股寒意','一股暖流','一股冲动','一股凉意',
  '涌向心头','涌上心头','涌动心头',
  // 脚步 variants
  '脚步','脚步一顿','脚步微顿','脚步轻顿',
  // 其他
  '微微','轻轻','缓缓','不禁','眼底','眼角','眼尾',
  '声音','声音微颤','声音微抖','声音有些发颤','声音有些沙哑',
  '眼神','眼神冰冷','眼神深邃','眼神坚定','眼神凛冽',
  '眼神一暗','眼神一凛','眼神一冷','眼神复杂',
  '掌心一片','掌心发凉','掌心冰凉',
];

console.log('=== R20 BROAD SCAN ===');
for (const s of checks) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 2) console.log('  ' + s + ': ' + cnt);
}