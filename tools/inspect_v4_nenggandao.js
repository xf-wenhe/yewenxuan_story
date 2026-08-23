#!/usr/bin/env node
/* inspect_v4_nenggandao.js — Understand the 能感觉到 pattern in V4 */

const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'chapters/volume-4');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md')).sort();

const byCh = {};
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf-8');
  const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
  const count = (text.match(/能感觉到/g) || []).length;
  if (count > 0) byCh[chNum] = count;
}

const sorted = Object.entries(byCh).sort((a,b) => b[1]-a[1]);
console.log('V4 chapters with 能感觉到:', sorted.length);
console.log('Total occurrences:', sorted.reduce((s,r) => s + r[1], 0));
console.log('\nDistribution:');
const buckets = {};
for (const [, c] of sorted) {
  buckets[c] = (buckets[c] || 0) + 1;
}
for (const [k, v] of Object.entries(buckets).sort((a,b) => b[0]-a[0])) {
  console.log('  ' + k + ' occurrences: ' + v + ' chapters');
}
console.log('\nTop 15:');
for (const [ch, count] of sorted.slice(0, 15)) {
  console.log('  ch' + ch + ': ' + count);
}