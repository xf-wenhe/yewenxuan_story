#!/usr/bin/env node
/* fix_dupes_mild.js — Remove duplicate PAD paragraphs from 69 mild V5 chapters */

const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'chapters/volume-5');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md')).sort();

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

let fixed = 0;
let skipped = 0;
let belowThreshold = 0;

for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf-8');
  const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);

  // Split by double-newline paragraphs
  const paras = text.split('\n\n');

  // Find duplicate paragraphs (only among content paragraphs, skip title/marker)
  const seen = {};
  const dupes = [];
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i].trim();
    if (p.length < 5 || p.includes('#') || p.includes('（第') && p.includes('章完）')) continue;
    if (seen[p] !== undefined) {
      dupes.push({ firstIdx: seen[p], secondIdx: i, text: p });
    } else {
      seen[p] = i;
    }
  }

  if (dupes.length === 0) continue;

  // Only fix if exactly 1 duplicate (mild chapters)
  if (dupes.length !== 1) {
    skipped++;
    continue;
  }

  // Remove the second occurrence
  const dupe = dupes[0];
  const newParas = paras.filter((_, i) => i !== dupe.secondIdx);
  const newText = newParas.join('\n\n');
  const newCjk = countCjk(newText);

  if (newCjk < 3000) {
    belowThreshold++;
    console.log('  ch' + chNum + ': BELOW 3000 after dedup (' + newCjk + '), skipping');
    continue;
  }

  fs.writeFileSync(path.join(dir, f), newText, 'utf-8');
  fixed++;
}

console.log('Fixed:', fixed);
console.log('Skipped (>1 dupe):', skipped);
console.log('Skipped (below 3000):', belowThreshold);

// Re-verify
const after = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf-8');
  const paras = text.split('\n\n').map(p => p.trim()).filter(p => p.length > 5 && !p.includes('#') && !p.includes('章完）'));
  const seen = {};
  let extra = 0;
  for (const p of paras) {
    if (seen[p]) extra++;
    else seen[p] = true;
  }
  if (extra > 0) {
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    after.push({ ch: chNum, extra });
  }
}
console.log('Remaining chapters with dupes:', after.length);
if (after.length > 0) {
  for (const r of after.slice(0, 10)) {
    console.log('  ch' + r.ch + ': ' + r.extra + ' extra');
  }
}