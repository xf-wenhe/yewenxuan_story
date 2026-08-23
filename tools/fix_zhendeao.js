#!/usr/bin/env node
/* fix_zhendeao.js — Fix remaining 他知道 occurrences (PAD-derived + safe organic) */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const REPLACEMENTS = [
  // PAD-derived: common injected sentence
  ['有急着做出判断，因为他知道，有些东西需要慢慢来。',
   '有急着做出判断，因为有些东西需要慢慢来。'],
];

let total = 0;
let affected = 0;

for (const volDir of VOLUMES) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const fp = path.join(d, f);
    let text = fs.readFileSync(fp, 'utf-8');
    let changed = false;
    let localCount = 0;
    for (const [old, new_] of REPLACEMENTS) {
      const count = (text.match(new RegExp(old.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        text = text.split(old).join(new_);
        localCount += count;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(fp, text, 'utf-8');
      total += localCount;
      affected++;
    }
  }
}

console.log('他知道 PAD fixes:', total);
console.log('Chapters affected:', affected);

// Verify remaining
console.log('\n=== REMAINING 他知道 ===');
let rem = 0;
for (const volDir of VOLUMES) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const fp = path.join(d, f);
    const text = fs.readFileSync(fp, 'utf-8');
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    const count = (text.match(/他知道/g) || []).length;
    if (count > 0) {
      let idx = text.indexOf('他知道');
      const ctx = text.slice(Math.max(0, idx-10), idx+40).replace(/\r?\n/g, '↵');
      console.log('  ch' + chNum + ' (' + count + '): ...' + ctx + '...');
      rem += count;
    }
  }
}
console.log('Remaining total:', rem);