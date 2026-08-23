#!/usr/bin/env node
/* fix_deai_remaining.js — Fix all remaining organic and PAD-derived de-AI words */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();

// Organic de-AI word replacements (not in PAD, actual story content)
const ORGANIC = [
  // 轻轻 in organic context
  ['频率像被人挠了一下痒，轻轻颤了颤', '频率像被人挠了一下痒，颤了颤'],
  ['她的指甲在轻轻刮他的皮肤', '她的指甲在刮他的皮肤'],
  ['0429碎片在叶文轩的意识中轻轻振动', '0429碎片在叶文轩的意识中振动'],
  ['叶文轩感到0429碎片在意识里轻轻震颤', '叶文轩感到0429碎片在意识里震颤'],
  ['0429碎片在赵大嘴体内轻轻震动', '0429碎片在赵大嘴体内震动'],
  // 微微 in organic context
  ['0429碎片在意识深处微微震动', '0429碎片在意识深处震动'],
  ['0429碎片在赵大嘴体内微微震颤', '0429碎片在赵大嘴体内震颤'],
  // 缓缓 in organic PAD context
  ['他深吸了一口气，又缓缓吐出', '他深吸了一口气，又吐出'],
  ['金色的门在他面前缓缓关闭', '金色的门在他面前关闭'],
  // 淡淡 in organic PAD context
  ['空气里弥漫着一股淡淡的味道', '空气里弥漫着一股味道'],
  // 仿佛 in organic PAD context
  ['那些消失的人，此刻仿佛就站在他的身后', '那些消失的人，此刻就站在他的身后'],
];

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

let total = 0;
let affected = 0;

for (const volDir of VOLUMES) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();

  for (const f of files) {
    const fp = path.join(d, f);
    let text = fs.readFileSync(fp, 'utf-8');
    let changed = false;
    let localCount = 0;

    for (const [old, new_] of ORGANIC) {
      const count = (text.match(new RegExp(old.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        text = text.split(old).join(new_);
        localCount += count;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(fp, text, 'utf-8');
      total += localCount;
      affected++;
    }
  }
}

console.log('Organic de-AI fixes:', total);
console.log('Chapters affected:', affected);

// Verify
console.log('\n=== POST-FIX DE-AI SCAN ===');
const PATTERNS = ['轻轻', '微微', '缓缓', '淡淡', '不禁', '仿佛', '深吸一口气', '他知道'];
for (const p of PATTERNS) {
  let total2 = 0;
  for (const volDir of VOLUMES) {
    const d = path.join(baseDir, 'chapters', volDir);
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md'));
    for (const f of files) {
      const text = fs.readFileSync(path.join(d, f), 'utf-8');
      total2 += (text.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g')) || []).length;
    }
  }
  console.log('  ' + p + ': ' + total2);
}