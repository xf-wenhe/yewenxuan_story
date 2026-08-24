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

// Additional patterns — even broader
const extra = [
  // 心脏 variants
  '心脏猛地缩','心脏猛地收','心脏猛地跳','心脏猛地撞','心脏猛地一缩','心脏猛地一收','心脏猛地一跳','心脏猛地一撞',
  // 心脏 + other modifiers
  '心脏骤然','心脏陡然','心脏忽然','心脏猛然','心脏瞬间','心脏突然',
  // Heartbeat variations
  '心跳猛地','心跳骤然','心跳陡然','心跳猛然','心跳忽然','心跳瞬间',
  // Pulse/beat patterns
  '心跳加速','心跳加快','心跳急促','心跳漏了','心跳漏掉',
  '脉搏突然','脉搏陡然','脉搏骤然','脉搏猛然',
  // Body reactions
  '浑身猛地','浑身骤然','浑身陡然','浑身猛然','浑身一颤','浑身一僵','浑身一抖',
  '全身猛地','全身骤然','全身陡然','全身猛然','全身一颤','全身一僵','全身一抖',
  '身子猛地','身子骤然','身子陡然','身子猛然','身子一颤','身子一僵',
  // Sudden actions
  '猛地一颤','猛地一僵','猛地一缩','猛地一紧','猛地一震',
  '骤然一颤','骤然一僵','骤然一缩','骤然一紧','骤然一震',
  '陡然一颤','陡然一僵','陡然一缩','陡然一紧','陡然一震',
  '猛然一颤','猛然一僵','猛然一缩','猛然一紧','猛然一震',
  // Eyes
  '眼中闪过','眼中掠过','眼中涌起','眼中浮现','眼中一片','眼中深处','眼中隐隐',
  '眼中闪过一丝','眼中掠过一丝','眼中涌起一丝','眼中浮现一丝',
  '眼中闪过一抹','眼中掠过一抹','眼中涌起一抹','眼中浮现一抹',
  // 喉结/喉咙 (survivors?)
  '喉结猛地','喉结一滚','喉结一动','喉结滚动','喉结上下',
  '喉咙动了动','喉咙滚动','喉咙一滚','喉咙一动',
  '喉结动了动','喉咙动了动',
  // Misc reactions
  '拳头猛地','拳头骤然','拳头陡然','拳头猛然',
  '脚步猛地','脚步骤然','脚步陡然','脚步猛然',
  '声音猛地','声音陡然','声音骤然','声音猛然',
  // 心中
  '心中暗叹','心中暗道','心中暗想','心中暗笑','心中暗惊','心中暗震',
  '心中一叹','心中一叹道',
  '心中五味杂陈','五味杂陈',
  // 冷笑
  '冷笑一声','冷笑一下','冷笑两声','冷冷一笑','淡淡一笑','淡淡地笑',
  // 淡淡
  '淡淡地说道','淡淡地开口','淡淡地说','淡淡地笑','淡淡笑了笑',
  '淡淡一笑','淡淡地摇了摇头','淡淡地摆','淡淡地摇头',
];

const results = [];
for (const s of extra) {
  const cnt = combined.split(s).length - 1;
  if (cnt >= 2) results.push({ s, count: cnt });
}
results.sort((a,b) => b.count - a.count);
console.log('=== ADDITIONAL CANDIDATES (>=2) ===');
for (const r of results) console.log('  ' + r.s + ': ' + r.count);
console.log('\nTotal: ' + results.length);