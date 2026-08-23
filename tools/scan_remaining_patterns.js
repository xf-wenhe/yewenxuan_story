#!/usr/bin/env node
// scan_remaining_patterns.js — efficient remaining pattern scan
const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const FILES = [];
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort().forEach(f =>
    FILES.push({path: path.join(d, f), num: parseInt(f.match(/chapter-(\d+)/)[1]), vol: v}));
}

const checks = [
  // Heartbeat related
  '心跳停了一拍', '脉搏顿住了', '胸口顿了一下', '心口猛地一沉', '心跳漏了一拍', '心脏骤停了一瞬',
  '心脏跳了一下', '心跳了一下', '胸口跳了一下', '心口猛地一跳',
  '心脏收缩了一下', '胸口紧了一下', '心口猛地一缩', '脉搏紧了一下',
  // Other face/body
  '他的嘴角动了一下', '嘴角牵了下', '嘴角扯了下', '嘴角动了动',
  '嘴角上扬', '嘴角浮起', '嘴角泛起', '嘴角扬起',
  // Mental state
  '他明白', '他忽然明白', '他终于明白', '他意识到',
  // Other AI markers
  '低头', '摇头', '沉默', '沉默了一下', '沉默片刻', '深深吸了一口气',
  '深吸一口气', '深吸了一口气', '深吸一口',
  '缓缓', '不禁', '微微', '轻轻', '淡淡', '不禁', '不由自主', '情不自禁',
  '一种预感', '一种沉重的', '一种压迫感',
];

for (const p of checks) {
  let total = 0;
  for (const f of FILES) {
    total += fs.readFileSync(f.path, 'utf-8').split(p).length - 1;
  }
  if (total > 0) console.log('  ' + total + 'x  ' + p);
}