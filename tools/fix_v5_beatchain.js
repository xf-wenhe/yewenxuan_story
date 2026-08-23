#!/usr/bin/env node
/* fix_v5_beatchain.js — Remove mechanical "XX的心脏在跳。" transition sentences */

const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'chapters/volume-5');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md')).sort();

const REPLACEMENTS = [
  '心跳在胸腔里回荡。',
  '心脏重重地跳了一下。',
  '脉搏在血管里跳动。',
  '胸口传来一阵温热。',
  '呼吸变得更深了。',
  '血液在加速流动。',
  '胸腔里传来一阵悸动。',
  '血液涌向四肢。',
  '胸口一阵发热。',
  '身体里有东西在燃烧。',
];

let totalReplacements = 0;
let chaptersAffected = 0;

for (const f of files) {
  const fp = path.join(dir, f);
  let text = fs.readFileSync(fp, 'utf-8');
  const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);

  const before = text;
  let localCount = 0;

  // Replace standalone "XX的心脏在跳。" sentences
  const standalonePattern = /(?:赵大嘴|叶文轩)的心脏在跳。\n\n/g;
  const matches = text.match(standalonePattern);
  if (matches) {
    for (const m of matches) {
      const idx = localCount % REPLACEMENTS.length;
      text = text.replace(m, REPLACEMENTS[idx] + '\n\n');
      localCount++;
    }
  }

  // Replace inline "XX的心脏在跳。" followed by content on same paragraph
  const inlinePattern1 = /赵大嘴的心脏在跳。/g;
  const inlinePattern2 = /叶文轩的心脏在跳。/g;

  text = text.replace(inlinePattern1, () => {
    localCount++;
    return REPLACEMENTS[(localCount - 1) % REPLACEMENTS.length];
  });
  text = text.replace(inlinePattern2, () => {
    localCount++;
    return REPLACEMENTS[(localCount - 1) % REPLACEMENTS.length];
  });

  if (text !== before) {
    fs.writeFileSync(fp, text, 'utf-8');
    totalReplacements += localCount;
    chaptersAffected++;
  }
}

console.log('Replacements:', totalReplacements);
console.log('Chapters affected:', chaptersAffected);

// Verify
let remaining = 0;
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf-8');
  remaining += (text.match(/的心脏在跳/g) || []).length;
}
console.log('Remaining "的心脏在跳":', remaining);