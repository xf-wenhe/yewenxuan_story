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
  // 嘴角 + modifiers
  '嘴角微微','嘴角轻轻','嘴角淡淡','嘴角一勾','嘴角一抽',
  // 心头 patterns
  '心头一颤','心头一紧','心头一跳','心头一沉','心头一震',
  '心头陡然','心头骤然','心头猛然','心头忽然',
  '心头涌起','心头闪过','心头掠过',
  // 一股 + emotion
  '一股寒意','一股暖流','一股冲动','一股热流','一股凉意',
  '一股暖流涌','一股寒意涌','一股冲动涌','一股凉意涌',
  // 涌上心头
  '涌上心头','涌上心','涌向心头',
  // 不自觉地/不由自主地 (if any remain)
  '不自觉地','不由自主地','不由自主地','情不自禁地',
  // 脑中/眼前/心中闪过/掠过/浮现
  '脑中闪过','脑中浮现','脑中掠过',
  '眼前闪过','眼前浮现','眼前掠过',
  '心中闪过','心中浮现','心中掠过',
  '心里闪过','心里浮现','心里掠过',
  // 心头 (general)
  '心头一阵','心头一热','心头一凉','心头一酸','心头一暖',
  // 眼底/眼尾
  '眼底闪过','眼底掠过','眼底深处',
  '眼尾一挑','眼尾微微',
  // 手指动作 (formulaic)
  '手指微微','手指轻轻','指尖微微','指尖轻轻',
  '指甲掐','指甲嵌','指甲掐入','指甲嵌入',
  '指节发白','指节泛白','指节发白',
  // 胸口 + reaction
  '胸口一闷','胸口一窒','胸口一紧','胸口一痛','胸口闷','胸口窒',
  // 声音 + adverb (survivors)
  '声音微颤','声音微抖','声音有些颤抖','声音有些发颤',
  '声音有些沙哑','声音有些低沉','声音有些发颤',
  // 眼神 patterns
  '眼神冰冷','眼神深邃','眼神坚定','眼神凛冽',
  // 脚步 patterns
  '脚步微微','脚步轻轻','脚步一顿','脚步一顿',
  // 掌心 patterns
  '掌心渗出','掌心冒汗','掌心出汗','掌心一片',
];

const results = [];
for (const s of candidates) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 2) results.push({ s, count: cnt });
}
results.sort((a,b) => b.count - a.count);
console.log('=== R17 EXPANDED (>=2) ===');
for (const r of results) console.log('  ' + r.s + ': ' + r.count);
console.log('\nTotal: ' + results.length);
console.log('Total replacements (all): ' + results.reduce((s,r) => s + r.count, 0));