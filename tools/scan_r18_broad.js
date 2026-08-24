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

// Count specific patterns
const checks = [
  // 指尖触碰 as full 4-char pattern
  '指尖触碰','指尖触到','指尖触及',
  // 心头 patterns
  '心头一颤','心头一紧','心头一跳','心头一沉','心头一震',
  '心头涌起','心头闪过','心头掠过','心头一动','心头一滞',
  '心头一热','心头一凉','心头一酸','心头一暖','心头一松','心头一涩',
  '心头一悸','心头一窒','心头一阵',
  // 脑中/心中
  '脑中闪过','脑中浮现','脑中掠过','脑中浮现出',
  '心中闪过','心中浮现','心中掠过','心中涌起',
  '心里闪过','心里浮现','心里掠过',
  // 眼底
  '眼底闪过','眼底掠过','眼底深处',
  // 眼尾
  '眼尾一挑',
  // 眉头
  '眉头紧锁','眉头微皱','眉头一皱','眉头一紧',
  // 脚步
  '脚步一顿','脚步微微','脚步轻轻',
  // 一股
  '一股寒意','一股暖流','一股冲动','一股热流','一股凉意',
  '涌上心头','涌向心头',
  // 喉结/喉咙
  '喉结滚动','喉咙滚动','喉结一滚',
  // 呼吸
  '呼吸一紧','呼吸变得','呼吸急促','呼吸微滞','呼吸一顿',
  // 声音
  '声音微颤','声音微抖','声音有些发颤','声音有些沙哑','声音有些低沉',
  // 眼神
  '眼神冰冷','眼神深邃','眼神坚定','眼神凛冽',
  '眼神一暗','眼神一凛','眼神一冷','眼神复杂',
  // 掌心
  '掌心一片','掌心发凉','掌心冰凉','掌心一片冰凉',
  // 胸口
  '胸口一闷','胸口一窒','胸口一紧','胸口一痛','胸口窒',
  // 握/咬/攥
  '握了握','咬了咬','攥了攥',
  // 心头 (broader)
  '心头',
  '脑际',
];

console.log('=== BROAD SCAN ===');
for (const s of checks) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 2) console.log('  ' + s + ': ' + cnt);
}