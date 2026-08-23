#!/usr/bin/env node
// scan_wide.js — broader sweep for AI voice markers not yet scanned
const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const FILES = [];
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort().forEach(f =>
    FILES.push({path: path.join(d, f)}));
}

const checks = [
  // CLAUDE.md banned
  '仿佛', '犹如', '宛若', '如同',
  '不禁', '微微', '淡淡', '轻轻',
  '不由自主', '情不自禁',
  '坚定', '深邃', '凛冽', '冰冷',
  // More thought/emotion
  '心中涌起', '心头涌起', '胸口涌起',
  '脑海中浮现', '脑海中闪过',
  '眼中闪过', '眸中闪过', '眼里闪过',
  '目光中闪过',
  '嘴角上扬', '嘴角浮起', '嘴角泛起', '嘴角勾起', '嘴角微扬', '嘴角扬起',
  // Sudden realizations
  '他忽然明白', '他忽然觉得', '他忽然意识到',
  '突然觉得', '突然意识到',
  '猛然意识到', '猛然明白',
  // Vague feelers
  '一种沉重的', '一种压迫感', '一种预感',
  '说不清的',
  // Other common AI patterns
  '不是……而是', '不……而是',
  '显然', '无疑',
  '深吸',
  '缓缓',
  // "低头" variants to check if they're AI-ish
  '低着头', '低下头',
  '摇了摇头', '摇着头',
];

const results = {};
for (const p of checks) {
  let total = 0;
  for (const f of FILES) {
    total += fs.readFileSync(f.path, 'utf-8').split(p).length - 1;
  }
  if (total > 0) results[p] = total;
}
for (const [p, c] of Object.entries(results).sort((a,b) => b[1] - a[1])) {
  console.log(c + 'x  ' + p);
}
