#!/usr/bin/env node
// scan_more_patterns.js — look for next batch of AI voice markers
const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const FILES = [];
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort().forEach(f =>
    FILES.push({path: path.join(d, f), num: parseInt(f.match(/chapter-(\d+)/)[1])}));
}

const checks = [
  // More facial
  '嘴角上扬', '嘴角浮起', '嘴角泛起', '嘴角扬起', '嘴角微扬', '嘴角勾起',
  '嘴角浮起一抹', '嘴角扬起一抹',
  // Eye patterns
  '眼中闪过', '眼中闪过一丝', '眼中闪过一抹',
  '目光中闪过', '眸中闪过', '眼里闪过',
  // Mind/thought
  '脑中闪过', '脑海中闪过', '心头闪过',
  '心中暗道', '心中涌起', '心头涌起',
  '心中闪过', '脑海中浮现',
  // Emotional surges
  '心中涌起一股', '心中升起一股', '心头升起一股',
  // Sudden
  '他忽然明白', '他忽然意识到', '他忽然觉得', '他忽然感觉到',
  '突然意识到', '突然觉得',
  // Other
  '一种沉重的', '一种压迫感', '一种预感',
  '嘴角牵了下', '嘴角扯了下',
  // "他知道" patterns (verify)
  '他知道，', '他知道。',
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
