#!/usr/bin/env node
/*
scan_dupes.js — Detect exact duplicate paragraphs in V5 chapters.
*/

const fs = require('fs');
const path = require('path');

const volDir = path.join(process.cwd(), 'chapters', 'volume-5');

const results = [];

for (const f of fs.readdirSync(volDir).filter(f => f.endsWith('-polished.md')).sort()) {
  const text = fs.readFileSync(path.join(volDir, f), 'utf-8');
  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(p => p.length > 10);
  const counts = {};
  for (const p of paragraphs) counts[p] = (counts[p] || 0) + 1;
  const dupes = Object.entries(counts).filter(([p, c]) => c > 1);
  const totalDupeCopies = dupes.reduce((s, [p, c]) => s + c - 1, 0); // extra copies beyond the first
  if (dupes.length > 0) {
    results.push({ file: f, uniqueDupeParagraphs: dupes.length, totalExtraCopies: totalDupeCopies });
  }
}

results.sort((a, b) => b.totalExtraCopies - a.totalExtraCopies);

console.log('=== Duplicate Paragraph Detection in V5 ===\n');
console.log('Top 25 by extra duplicate copies:\n');
for (const r of results.slice(0, 25)) {
  console.log(`  ${r.file}: ${r.uniqueDupeParagraphs} unique paragraphs duplicated, ${r.totalExtraCopies} extra copies`);
}

console.log(`\nTotal chapters with any duplicates: ${results.length}`);
console.log(`Total extra duplicate copies: ${results.reduce((s,r) => s + r.totalExtraCopies, 0)}`);

// Show the worst case's top duplicated paragraphs
const worst = results[0];
if (worst) {
  console.log(`\n=== Detail: ${worst.file} ===`);
  const text = fs.readFileSync(path.join(volDir, worst.file), 'utf-8');
  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(p => p.length > 10);
  const counts = {};
  for (const p of paragraphs) counts[p] = (counts[p] || 0) + 1;
  const dupes = Object.entries(counts).filter(([p, c]) => c > 1).sort((a, b) => b[1] - a[1]);
  for (const [p, c] of dupes.slice(0, 5)) {
    const short = p.length > 100 ? p.slice(0, 100) + '...' : p;
    console.log(`  [${c}x] ${short}`);
  }
}