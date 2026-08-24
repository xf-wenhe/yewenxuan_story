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

// Final broad sweep for Round 16
const extra2 = [
  // Body reaction adverbs + 地
  '猛地一颤','猛地一僵','猛地一缩','猛地一紧','猛地一震','猛地一抖','猛地一跳','猛地一沉',
  '骤然一颤','骤然一僵','骤然一缩','骤然一紧','骤然一震','骤然一抖','骤然一跳','骤然一沉',
  '陡然一颤','陡然一僵','陡然一缩','陡然一紧','陡然一震','陡然一抖','陡然一跳','陡然一沉',
  '猛然一颤','猛然一僵','猛然一缩','猛然一紧','猛然一震','猛然一抖','猛然一跳','猛然一沉',
  '瞬间一颤','瞬间一僵','瞬间一缩','瞬间一紧','瞬间一震',
  // 心脏 + reaction
  '心脏猛地','心脏骤然','心脏陡然','心脏忽然','心脏猛然','心脏瞬间','心脏突然',
  '心脏一缩','心脏一紧','心脏一颤','心脏一跳','心脏一沉','心脏一悸',
  '心脏剧烈','心脏狂跳','心脏怦怦','心脏砰砰',
  // Other body + 猛地/骤然
  '拳头猛地','拳头骤然','拳头陡然','拳头猛然',
  '脚步猛地','脚步骤然','脚步陡然','脚步猛然',
  '身体猛地','身体骤然','身体陡然','身体猛然','身体一颤','身体一僵',
  '身子猛地','身子骤然','身子陡然','身子猛然','身子一颤','身子一僵',
  '浑身猛地','浑身骤然','浑身陡然','浑身猛然','浑身一颤','浑身一僵','浑身一抖',
  '全身猛地','全身骤然','全身陡然','全身猛然','全身一颤','全身一僵','全身一抖',
  // 喉咙/喉结 (R14 survivors?)
  '喉结猛地','喉结一滚','喉结一动','喉结滚动','喉结上下','喉结动了动','喉结上下滚了滚',
  '喉咙动了动','喉咙滚动','喉咙一滚','喉咙一动',
  // 面无表情 variants
  '面无表情','面无表情地',
  // 眼中 patterns
  '眼中闪过','眼中掠过','眼中涌起','眼中浮现','眼中一片','眼中深处','眼中隐隐',
  '眼中闪过一丝','眼中掠过一丝','眼中涌起一丝','眼中浮现一丝',
  '眼中闪过一抹','眼中掠过一抹','眼中涌起一抹','眼中浮现一抹',
  // 冷笑/淡笑
  '冷笑一声','冷笑一下','冷笑两声','冷冷一笑','淡淡一笑',
  '淡淡地笑','淡淡笑了笑','淡淡地说道','淡淡地开口','淡淡地说',
  '淡淡地摇头','淡淡地摆','淡淡地摇',
  // 心中 patterns
  '心中暗叹','心中暗道','心中暗想','心中暗笑','心中暗惊','心中暗震',
  '心中一叹','心中一叹道','心中五味杂陈','五味杂陈',
  // 喉咙动了
  '喉咙动了','喉结动了',
];

const results = [];
for (const s of extra2) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 2) results.push({ s, count: cnt });
}
results.sort((a,b) => b.count - a.count);
console.log('=== R16 EXTENDED (>=2) ===');
for (const r of results) console.log('  ' + r.s + ': ' + r.count);
console.log('\nTotal: ' + results.length);