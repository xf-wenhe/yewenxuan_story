#!/usr/bin/env node
/*
scan_feel.js — Scan V5 for "能感觉到" saturation (mechanical repetition).
Reports chapters where the pattern appears excessively (>15 times).
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const volDir = path.join(ROOT, 'chapters', 'volume-5');
if (!fs.existsSync(volDir)) { console.log('No volume-5'); process.exit(1); }

const PATTERN = /能感觉到/g;

const results = [];

for (const f of fs.readdirSync(volDir).filter(f => f.endsWith('-polished.md')).sort()) {
  const text = fs.readFileSync(path.join(volDir, f), 'utf-8');
  const matches = text.match(PATTERN);
  const count = matches ? matches.length : 0;
  const lines = text.split('\n').length;
  const ratio = lines > 0 ? (count / lines).toFixed(2) : '0';
  if (count > 10) {
    results.push({ file: f, count, lines, ratio, severity: count > 30 ? 'CRITICAL' : count > 20 ? 'HIGH' : 'MODERATE' });
  }
}

results.sort((a, b) => b.count - a.count);

console.log('=== "能感觉到" Saturation in V5 ===');
console.log('Threshold: >10 occurrences (reporting only)');
console.log('');

const critical = results.filter(r => r.severity === 'CRITICAL');
const high = results.filter(r => r.severity === 'HIGH');
const moderate = results.filter(r => r.severity === 'MODERATE');

console.log(`CRITICAL (>30): ${critical.length} chapters`);
console.log(`HIGH (20-30):   ${high.length} chapters`);
console.log(`MODERATE (10-20): ${moderate.length} chapters`);
console.log('');

console.log('--- CRITICAL chapters (top 20) ---');
for (const r of results.slice(0, 20)) {
  console.log(`  ${r.file}: ${r.count} occurrences / ${r.lines} lines (ratio ${r.ratio}) [${r.severity}]`);
}

console.log('\n--- All affected ---');
for (const r of results) {
  console.log(`  ${r.file}: ${r.count} [${r.severity}]`);
}

console.log(`\nTotal affected chapters: ${results.length} / 72`);
console.log(`Total "能感觉到" occurrences in affected chapters: ${results.reduce((s,r) => s + r.count, 0)}`);