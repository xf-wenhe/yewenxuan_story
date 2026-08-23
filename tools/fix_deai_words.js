#!/usr/bin/env node
/* fix_deai_words.js — Mechanical replacement of L1 de-AI banned words across all volumes */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();

const VOLUMES = ['volume-2','volume-3','volume-5','volume-6'];

// Banned word replacements — each word maps to an array of alternatives
const REPLACEMENTS = {
  '轻轻': ['轻', '稍', '略', '慢慢'],
  '微微': ['略微', '稍', '稍微'],
  '缓缓': ['慢慢', '渐渐地'],
  '淡淡': ['稍', '略微'],
  '仿佛': ['似乎', '好像'],
};

let stats = {};
for (const word of Object.keys(REPLACEMENTS)) stats[word] = { total: 0, affected: 0 };

for (const volDir of VOLUMES) {
  const d = path.join(baseDir, 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();

  for (const f of files) {
    const fp = path.join(d, f);
    let text = fs.readFileSync(fp, 'utf-8');
    let changed = false;

    for (const [word, alts] of Object.entries(REPLACEMENTS)) {
      const count = (text.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g')) || []).length;
      if (count === 0) continue;

      stats[word].total += count;
      stats[word].affected++;

      // Replace each occurrence with a random alternative
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g');
      let localIdx = 0;
      text = text.replace(regex, () => {
        localIdx++;
        return alts[(localIdx - 1) % alts.length];
      });
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(fp, text, 'utf-8');
    }
  }
}

console.log('=== De-AI Word Replacements ===');
for (const [word, s] of Object.entries(stats)) {
  console.log('  ' + word + ': ' + s.total + ' occurrences across ' + s.affected + ' chapters');
}