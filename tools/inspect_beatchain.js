#!/usr/bin/env node
/* inspect_beatchain.js — Understand the "的心脏在跳" pattern in V5 */

const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'chapters/volume-5');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md')).sort();

// Collect all instances with context
const examples = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf-8');
  const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('的心脏在跳')) {
      const ctx = (lines[i-1] || '').slice(0, 60) + ' → ' + line.slice(0, 100);
      examples.push({ ch: chNum, line: i+1, ctx });
    }
  }
}

console.log('Total "的心脏在跳" instances:', examples.length);
console.log('\nFirst 30 examples:');
for (const e of examples.slice(0, 30)) {
  console.log('  ch' + e.ch + ' L' + e.line + ': ' + e.ctx);
}

// Distribution by chapter
const byCh = {};
for (const e of examples) {
  if (!byCh[e.ch]) byCh[e.ch] = 0;
  byCh[e.ch]++;
}
const sorted = Object.entries(byCh).sort((a,b) => b[1]-a[1]);
console.log('\nChapters with most instances (top 15):');
for (const [ch, count] of sorted.slice(0, 15)) {
  console.log('  ch' + ch + ': ' + count);
}