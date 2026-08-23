#!/usr/bin/env node
/* fix_mechanical_round2.js — Fix A组 (typos) + B组 (PAD residue similes) */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

// A组: typo fixes
const A_FIXES = [
  ['。。', '。'],      // double period
  ['的的', '的'],      // double 的
  ['了了', '了'],      // double 了
];

// B组: PAD residue simile fixes
const B_FIXES = [
  ['这个念头一旦出现，便像藤蔓一样缠住了他的思绪。',
   '这个念头一旦出现，便缠住了他的思绪。'],
  ['这句话像一块石头，沉进了他心里最深处的那个角落。',
   '这句话沉进了他心里最深处的那个角落。'],
  ['那些影子在光里晃动，像是一些被遗忘的记忆在挣扎。',
   '那些影子在光里晃动，是一些被遗忘的记忆在挣扎。'],
];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

let stats = {};
for (const [old, _] of [...A_FIXES, ...B_FIXES]) stats[old] = {total: 0, chapters: 0};
let cjkDrops = [];

for (const volDir of VOLUMES) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();

  for (const f of files) {
    const fp = path.join(d, f);
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let text = fs.readFileSync(fp, 'utf-8');
    const beforeCjk = countCjk(text);
    let changed = false;

    for (const [old, new_] of [...A_FIXES, ...B_FIXES]) {
      const esc = old.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
      const count = (text.match(new RegExp(esc, 'g')) || []).length;
      if (count > 0) {
        text = text.split(old).join(new_);
        stats[old].total += count;
        stats[old].chapters++;
        changed = true;
      }
    }

    if (changed) {
      const afterCjk = countCjk(text);
      fs.writeFileSync(fp, text, 'utf-8');
      if (afterCjk < 3000) {
        cjkDrops.push('ch' + chNum + ': ' + beforeCjk + ' -> ' + afterCjk);
      }
    }
  }
}

console.log('=== FIX RESULTS ===');
for (const [old, s] of Object.entries(stats)) {
  if (s.total > 0) console.log('  ' + old.slice(0, 40).padEnd(42) + ': ' + s.total + ' (' + s.chapters + ' chs)');
}

if (cjkDrops.length) {
  console.log('\nCJK drops below 3000:');
  for (const c of cjkDrops) console.log('  ' + c);
} else {
  console.log('\nNo CJK drops below 3000.');
}

// Verify
console.log('\n=== POST-FIX VERIFY ===');
let totalTypos = 0;
for (const fp of VOLUMES.flatMap(v => {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).map(f => path.join(d, f));
})) {
  const text = fs.readFileSync(fp, 'utf-8');
  totalTypos += (text.match(/。。/g) || []).length;
  totalTypos += (text.match(/的的/g) || []).length;
  totalTypos += (text.match(/了了/g) || []).length;
}
console.log('  Remaining 。。+的的+了了: ' + totalTypos);

// CJK summary
let below = 0, totalCjk = 0;
for (const fp of VOLUMES.flatMap(v => {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).map(f => path.join(d, f));
})) {
  const text = fs.readFileSync(fp, 'utf-8');
  const c = countCjk(text);
  totalCjk += c;
  if (c < 3000) below++;
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);