#!/usr/bin/env node
/* fix_pad_deai.js — Fix de-AI banned words in PAD pool sentences across all volumes */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();

const REPLACEMENTS = [
  // PAD sentence containing 轻轻
  ['这些话没有出口，只是在他的意识里轻轻翻涌。',
   '这些话没有出口，只是在他的意识里翻涌。'],
  // PAD sentence containing 微微
  ['他低头看了看自己的手，手还在微微发抖。',
   '他低头看了看自己的手，手还在发抖。'],
];

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

let totalReplacements = 0;
let chaptersAffected = 0;

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
      totalReplacements += localCount;
      chaptersAffected++;
    }
  }
}

console.log('PAD de-AI fixes:', totalReplacements);
console.log('Chapters affected:', chaptersAffected);

// Verify remaining de-AI words
console.log('\n=== POST-FIX SCAN ===');
const PATTERNS = ['轻轻', '微微', '缓缓', '淡淡', '不禁', '仿佛', '深吸一口气'];
for (const p of PATTERNS) {
  let total = 0;
  for (const volDir of VOLUMES) {
    const d = path.join(baseDir, 'chapters', volDir);
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md'));
    for (const f of files) {
      const text = fs.readFileSync(path.join(d, f), 'utf-8');
      total += (text.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g')) || []).length;
    }
  }
  console.log('  ' + p + ': ' + total);
}