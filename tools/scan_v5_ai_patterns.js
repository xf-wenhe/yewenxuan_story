#!/usr/bin/env node
/* scan_v5_ai_patterns.js — Scan V5 for remaining AI writing patterns */

const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'chapters/volume-5');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md')).sort();

const patterns = {
  '能感觉到': 0,
  '的心脏在跳': 0,
  '仿佛': 0,
  '犹如': 0,
  '宛若': 0,
  '如同': 0,
  '深吸一口气': 0,
  '不禁': 0,
  '缓缓': 0,
  '微微': 0,
  '轻轻': 0,
  '淡淡': 0,
  '眼中闪过': 0,
  '嘴角勾起': 0,
  '心中暗道': 0,
  '不由自主': 0,
  '情不自禁': 0,
  '不是A而是B': 0,
  '他知道': 0,
  '眼中闪过一丝': 0,
  '心中涌起': 0,
  '脑中闪过': 0,
};

for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf-8');

  for (const pat of Object.keys(patterns)) {
    if (pat === '不是A而是B') {
      patterns['不是A而是B'] += (text.match(/不是[^\s]{1,20}而是/g) || []).length;
    } else {
      patterns[pat] += (text.match(new RegExp(pat.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g')) || []).length;
    }
  }
}

console.log('=== V5 AI Pattern Scan ===');
const sorted = Object.entries(patterns).sort((a,b) => b[1]-a[1]);
for (const [pat, count] of sorted) {
  if (count > 0) console.log('  ' + pat + ': ' + count);
}