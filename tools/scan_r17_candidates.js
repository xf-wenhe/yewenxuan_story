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

// Comprehensive AI-voice trope sweep for Round 17
const candidates = [
  // 猛地 (standalone or with other endings)
  '猛地一颤','猛地一僵','猛地一缩','猛地一紧','猛地一震','猛地一抖','猛地一下','猛地一下心','猛地一拳','猛地一脚',
  // 骤然/陡然/忽然/猛然/瞬间 + 一 + X
  '骤然一颤','骤然一僵','骤然一缩','骤然一紧','骤然一震','骤然一抖',
  '陡然一颤','陡然一僵','陡然一缩','陡然一紧','陡然一震','陡然一抖',
  '猛然一颤','猛然一僵','猛然一缩','猛然一紧','猛然一震','猛然一抖',
  '瞬间一颤','瞬间一僵','瞬间一缩','瞬间一紧','瞬间一震','瞬间一抖',
  // 心脏 + reaction
  '心脏骤然','心脏陡然','心脏忽然','心脏猛然','心脏瞬间','心脏突然',
  '心脏剧烈','心脏狂跳','心脏怦怦','心脏砰砰',
  // 喉结 + reaction (survivors)
  '喉结猛地','喉结一滚','喉结一动','喉结滚动','喉结上下滚','喉结上下','喉结动了动',
  '喉咙动了动','喉咙滚动','喉咙一滚','喉咙一动',
  // 面无表情 variants
  '面无表情','面无表情地',
  // 眼中 patterns (standalone)
  '眼中闪过','眼中掠过','眼中涌起','眼中浮现','眼中一片','眼中深处','眼中隐隐',
  '眼中闪过一丝','眼中掠过一丝','眼中涌起一丝','眼中浮现一丝',
  '眼中闪过一抹','眼中掠过一抹','眼中涌起一抹','眼中浮现一抹',
  // 冷笑/淡笑
  '冷笑一声','冷笑一下','冷冷一笑','淡淡一笑',
  '淡淡地笑','淡淡笑了笑','淡淡地说道','淡淡地开口','淡淡地说',
  '淡淡地摇头','淡淡地摆','淡淡地摇',
  // 心中 patterns
  '心中暗叹','心中暗道','心中暗想','心中暗笑','心中暗惊','心中暗震',
  '心中一叹','心中一叹道','心中五味杂陈','五味杂陈',
  // 嘴角微微/微微勾起
  '嘴角微微','嘴角轻轻','嘴角淡淡','嘴角一勾',
  // 眉头 (survivors)
  '眉头紧锁','眉头微皱','眉头紧皱','眉头拧','眉头一紧','眉头一皱',
  // 身形 (survivors)
  '身形一震','身形一僵','身形一颤','身形微僵','身形微颤',
  '身体一震','身体一僵','身体一颤','身体微僵','身体微颤',
  // 拳头 (survivors)
  '拳头猛地','拳头骤然','拳头陡然','拳头猛然',
  // 脚步 (survivors)
  '脚步猛地','脚步骤然','脚步陡然','脚步猛然',
  // 声音 + adverb
  '声音猛地','声音陡然','声音骤然','声音猛然',
  '声音微颤','声音微抖','声音有些颤抖','声音有些发颤','声音有些发颤',
  // 呼吸 (survivors)
  '呼吸一紧','呼吸变得','呼吸急促','呼吸沉重','呼吸粗重','呼吸粗重',
  '呼吸陡然','呼吸骤然','呼吸猛然','呼吸忽然',
  // 沉默 (survivors)
  '沉默片刻','沉默了一会','沉默了一会儿','沉默了许久',
  // 其他 AI tropes
  '握了握','咬了咬','咽了咽','攥了攥',
];

const results = [];
for (const s of candidates) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 2) results.push({ s, count: cnt });
}
results.sort((a,b) => b.count - a.count);
console.log('=== R17 CANDIDATES (>=2) ===');
for (const r of results) console.log('  ' + r.s + ': ' + r.count);
console.log('\nTotal candidates: ' + results.length);
console.log('Top 20 total replacements: ' + results.slice(0,20).reduce((s,r) => s + r.count, 0));