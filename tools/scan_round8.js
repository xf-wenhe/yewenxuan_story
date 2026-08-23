#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const checks = [
  // more thought/emotion surges
  '心中涌起一股', '心中升起一股', '心头升起一股',
  '心中涌起', '心头涌起', '胸口一紧',
  '一种无法', '一种不可', '一种莫名',
  // mechanical "eye glance" patterns
  '目光一沉', '目光一凝', '目光微凝', '目光一闪',
  '眼神一沉', '眼神微凝', '眼神微动',
  // "heart/mind" surges
  '心底涌起', '心底升起', '心头一紧',
  '心口发紧', '心口一紧',
  // "slowly" variants
  '慢慢', '缓缓',
  // more vague
  '一种说不清的', '一种难以言喻的', '一种难以名状的',
  // "deep breath" full matches
  '深吸了一口', '深吸了下', '深吸了口',
];

const results = {};
for (const p of checks) {
  let total = 0;
  for (const v of VOLUMES) {
    const d = path.join(baseDir, 'chapters', v);
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
    for (const f of files) {
      total += fs.readFileSync(path.join(d, f), 'utf-8').split(p).length - 1;
    }
  }
  if (total > 0) results[p] = total;
}
for (const [p, c] of Object.entries(results).sort((a,b) => b[1] - a[1])) {
  console.log(c + 'x  ' + p);
}
