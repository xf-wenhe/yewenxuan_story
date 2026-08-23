#!/usr/bin/env node
/* check_mechanical.js — Check remaining mechanical/text-level issues */

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

let issues = {
  orphanPeriod: 0,       // "。" at end of line with only whitespace after (no paragraph break)
  doubleNewline: 0,      // 3+ consecutive blank lines
  halfWidthInCN: 0,      // half-width , or . mixed in CJK context
  staleDraft: 0,         // files matching "draft" or "wip"
  wrongExt: 0,           // .txt .tmp etc in chapters/
  doubleComma: 0,        // ,,
  doublePeriod: 0,       // 。。
  strayAsterisk: 0,      // single * not **
};

let examples = [];

for (const fp of FILES) {
  const text = fs.readFileSync(fp, 'utf-8');
  const chNum = parseInt(fp.match(/chapter-(\d+)/)[1]);

  // 3+ blank lines
  if (/\n\n\n\n/.test(text)) { issues.doubleNewline++; examples.push('ch' + chNum + ': 4+ blank lines'); }

  // 。。double period
  const dp = (text.match(/。。/g) || []).length;
  if (dp) issues.doublePeriod += dp;

  // ,, double comma (half-width)
  const dc = (text.match(/,,/g) || []).length;
  if (dc) issues.doubleComma += dc;

  // Stray half-width comma in CJK context
  const hw = (text.match(/(?<=[一-鿿]),(?=[一-鿿])/g) || []).length;
  if (hw) issues.halfWidthInCN += hw;
}

console.log('=== MECHANICAL CHECK ===');
for (const [k, v] of Object.entries(issues)) {
  if (v > 0) console.log('  ' + k + ': ' + v);
}
if (issues.doubleNewline > 0 || issues.doublePeriod > 0 || issues.doubleComma > 0 || issues.halfWidthInCN > 0) {
  console.log('\nExamples:');
  for (const e of examples.slice(0, 10)) console.log('  ' + e);
}

// Check for stray draft/wip files
console.log('\n--- Stray files in chapters/ ---');
let strayCount = 0;
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => !f.endsWith('-polished.md'));
  if (files.length > 0) {
    console.log('  ' + v + ': ' + files.join(', '));
    strayCount += files.length;
  }
}
if (strayCount === 0) console.log('  (none)');