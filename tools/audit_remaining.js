#!/usr/bin/env node
/* audit_remaining.js — Complete scan of ALL known de-AI patterns */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const FILES = [];
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort().forEach(f => FILES.push(path.join(d, f)));
}

// Full de-AI list from polish_pipeline.py L1_WORDS + DEADLY_PATTERNS
const PATTERNS = [
  // Simile words
  '仿佛', '犹如', '宛若', '如同',
  // Adverbs
  '深吸一口气', '缓缓', '不禁', '微微', '轻轻', '淡淡',
  // Expressions
  '眼中闪过', '嘴角勾起', '眉头微皱', '心中暗道',
  '不由自主', '情不自禁',
  // Judgment words
  '不容置疑', '显而易见', '毫无疑问',
  // Adjectives
  '坚定', '深邃', '凛冽', '冰冷',
  // Deadly patterns
  '不是…而是', '不是...而是', '不是A而是B',
  '他知道', '眼中闪过一丝', '心中涌起一股', '脑中闪过',
];

const results = {};
for (const p of PATTERNS) {
  let count = 0;
  for (const fp of FILES) {
    const text = fs.readFileSync(fp, 'utf-8');
    const esc = p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    count += (text.match(new RegExp(esc, 'g')) || []).length;
  }
  results[p] = count;
}

console.log('=== FULL DE-AI PATTERN AUDIT ===');
console.log('Total chapters scanned: ' + FILES.length);
console.log('');

const zero = [], nonzero = [];
for (const [p, c] of Object.entries(results).sort((a,b) => b[1]-a[1])) {
  if (c > 0) nonzero.push([p, c]);
  else zero.push(p);
}

if (nonzero.length) {
  console.log('--- REMAINING (non-zero) ---');
  for (const [p, c] of nonzero) console.log('  ' + p + ': ' + c);
} else {
  console.log('ALL ZERO');
}

console.log('');
console.log('--- CLEAN (zero) ---');
console.log('  ' + zero.join(', '));

// Structural patterns
console.log('\n--- STRUCTURAL (voice-level, not mechanical) ---');
let total = 0;
for (const fp of FILES) {
  const text = fs.readFileSync(fp, 'utf-8');
  total += (text.match(/能感觉到/g) || []).length;
}
console.log('  能感觉到: ' + total);
total = 0;
for (const fp of FILES) {
  const text = fs.readFileSync(fp, 'utf-8');
  total += (text.match(/的心脏在跳/g) || []).length;
}
console.log('  的心脏在跳: ' + total);