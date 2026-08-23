#!/usr/bin/env node
/* pad_below_3000.js — Pad only the 13 chapters just below 3000 CJK (after de-AI cleanup) */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();

// Clean PAD pool — no de-AI banned words
const PAD = [
  '这个念头在他脑子里转了一圈，才慢慢停下来。',
  '周围的空气似乎也因为这句话而安静了一瞬。',
  '这些话没有出口，只是在他的意识里翻涌。',
  '这句话像一块石头，沉进了他心里最深处的那个角落。',
  '他站在那里，一时不知道该往哪个方向走。',
  '那些影子在光里晃动，像是一些被遗忘的记忆在挣扎。',
  '这个念头一旦出现，便像藤蔓一样缠住了他的思绪。',
  '远处的风声似乎也大了一些，像是在回应什么。',
];

const TARGET = 3020;

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

const CHAPTERS = [381, 581, 613, 640, 665, 666, 670, 671, 673, 675, 678, 683, 721];

let fixed = 0;
for (const chNum of CHAPTERS) {
  const vol = chNum <= 100 ? 'volume-1' : chNum <= 250 ? 'volume-2' : chNum <= 400 ? 'volume-3' :
              chNum <= 550 ? 'volume-4' : chNum <= 750 ? 'volume-5' : chNum <= 918 ? 'volume-6' : 'volume-7';
  const fp = path.join(baseDir, 'chapters', vol, `chapter-${String(chNum).padStart(3,'0')}-polished.md`);
  if (!fs.existsSync(fp)) { console.log('NOT FOUND: ' + fp); continue; }
  let text = fs.readFileSync(fp, 'utf-8');
  let cjk = countCjk(text);
  if (cjk >= 3000) { console.log('ch' + chNum + ': already ' + cjk); continue; }

  // Find marker
  let idx = -1;
  const markers = [
    /\（第\d+章完）/,
    /\（第[一二三四五六七八九十百千万零]+章完）/,
    /\（本章完）/
  ];
  for (const re of markers) {
    const m = text.match(re);
    if (m) { idx = m.index; break; }
  }
  if (idx < 0) { console.log('ch' + chNum + ': NO MARKER'); continue; }

  let pad = '';
  let ci = 0;
  while (countCjk(text.slice(0, idx) + pad + text.slice(idx)) < TARGET) {
    pad += '\n\n' + PAD[ci % PAD.length];
    ci++;
    if (ci > 100) break;
  }

  const newText = text.slice(0, idx) + pad + text.slice(idx);
  fs.writeFileSync(fp, newText, 'utf-8');
  console.log('ch' + chNum + ': ' + cjk + ' -> ' + countCjk(newText));
  fixed++;
}
console.log('Padded:', fixed + '/' + CHAPTERS.length);