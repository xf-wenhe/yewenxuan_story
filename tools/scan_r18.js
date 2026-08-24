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

const candidates = [
  // 心头 + various
  '心头一颤','心头一紧','心头一跳','心头一沉','心头一震',
  '心头陡然','心头骤然','心头猛然','心头忽然',
  '心头涌起','心头闪过','心头掠过','心头一动',
  // 脑中/心中/心里 + 闪过/浮现/掠过
  '脑中闪过','脑中浮现','脑中掠过',
  '眼前闪过','眼前掠过',
  '心中闪过','心中浮现','心中掠过',
  '心里闪过','心里浮现','心里掠过',
  // 心头 (general)
  '心头一阵','心头一热','心头一凉','心头一酸','心头一暖',
  '心头一滞','心头一涩','心头一悸','心头一窒',
  // 眼底/眼尾
  '眼底闪过','眼底掠过','眼底深处',
  '眼尾一挑','眼尾微微',
  // 手指/指尖 formulaic
  '手指微微','手指轻轻','指尖微微','指尖轻轻',
  '指甲嵌','指甲嵌入',
  // 胸口 survivors
  '胸口一闷','胸口一窒','胸口一紧','胸口一痛','胸口窒',
  // 声音 survivors
  '声音微颤','声音微抖','声音有些发颤','声音有些沙哑','声音有些低沉',
  // 眼神
  '眼神冰冷','眼神深邃','眼神坚定','眼神凛冽',
  '眼神一暗','眼神一凛','眼神一冷','眼神复杂',
  // 脚步
  '脚步微微','脚步轻轻','脚步一顿',
  // 掌心 survivors
  '掌心一片','掌心发凉','掌心冰凉',
  // 喉结/喉咙
  '喉结滚动','喉咙滚动','喉结一滚',
  // 一股
  '一股寒意','一股暖流','一股冲动','一股热流','一股凉意',
  '一股暖流涌','一股寒意涌','一股冲动涌','一股凉意涌',
  // 涌上心头
  '涌上心头','涌上心','涌向心头',
  // 握了握/咬了咬/攥了攥
  '握了握','咬了咬','攥了攥',
  // 呼吸
  '呼吸一紧','呼吸变得','呼吸急促','呼吸微滞','呼吸一顿',
  // 眉头
  '眉头紧锁','眉头微皱','眉头一皱','眉头一紧',
  // 心头
  '心头一松','心头一轻','心头一沉',
  // 指尖/指腹
  '指腹按','指尖抵','指尖触','指尖微凉',
  // 掌心
  '掌心渗出冷汗','掌心全是汗','掌心满是汗',
];

const results = [];
for (const s of candidates) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 3) results.push({ s, count: cnt });
}
results.sort((a,b) => b.count - a.count);
console.log('=== R18 CANDIDATES (>=3) ===');
for (const r of results) console.log('  ' + r.s + ': ' + r.count);
console.log('\nTotal candidates: ' + results.length);
console.log('Total replacements (all): ' + results.reduce((s,r) => s + r.count, 0));