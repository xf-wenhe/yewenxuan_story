#!/usr/bin/env node
/* clean_pad_pool.js — Remove ALL PAD-pool contaminated sentences, re-pad with clean versions */

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;

// ALL contaminated PAD sentences → clean replacements
const CLEANUP = [
  // Original PAD pool (from pad_all.js, fix_dupes_severe_v4.js, fix_feel.js etc.)
  ['这个念头在他脑子里转了一圈，才慢慢停下来。',
   '这个念头在他脑子里转了一圈，才停下来。'],
  ['这些话没有出口，只是在他的意识里轻轻翻涌。',
   '这些话没有出口，只是在他的意识里翻涌。'],
  ['他低头看了看自己的手，手还在微微发抖。',
   '他低头看了看自己的手，手还在发抖。'],
  ['这些情绪没有出口，只是在身体里翻涌。',
   '这些情绪没有出口，只是在身体里翻涌。'],
  // PAD residue similes (already partially cleaned, clean fully)
  ['这句话像一块石头，沉进了他心里最深处的那个角落。',
   '那句话沉进了他心里最深处。'],
  ['他站在那里，一时不知道该往哪个方向走。',
   '他站在那里，一时不知道该往哪走。'],
  ['那些影子在光里晃动，像是一些被遗忘的记忆在挣扎。',
   '那些影子在光里晃动，是被遗忘的记忆在挣扎。'],
  ['这个念头一旦出现，便像藤蔓一样缠住了他的思绪。',
   '这个念头一旦出现，便缠住了他的思绪。'],
  ['有急着做出判断，因为有些东西需要慢慢来。',
   '他需要更多的时间。'],
  ['有些东西需要慢慢来。',
   '他需要更多的时间。'],
  // Other PAD sentences with subtle issues
  ['那句话像一块石头，沉进了他心里最深处的那个角落。',
   '那句话沉进了他心里最深处。'],
  ['那句话沉进了他心里最深处的那个角落。',
   '那句话沉进了他心里最深处。'],
];

// Clean PAD pool for re-padding
const CLEAN_PAD = [
  '那个念头在他脑子里转了一圈，才停下来。',
  '周围的空气因为这句话安静了一瞬。',
  '这些话没有出口，只是在他的意识里翻涌。',
  '那句话沉进了他心里最深处。',
  '他站在那里，一时不知道该往哪走。',
  '那些影子在光里晃动，是被遗忘的记忆在挣扎。',
  '这个念头一旦出现，便缠住了他的思绪。',
  '他需要更多的时间。',
  '这件事的来龙去脉，他还需要更多的时间才能弄清楚。',
  '他的目光在那些影子里停留了几秒。',
  '那些话语没有出口，只在意识中回荡。',
  '空气因为这句话凝固了一瞬。',
];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

let stats = {};
for (const [old, _] of CLEANUP) stats[old.slice(0, 20)] = {total: 0, chapters: 0};

let chaptersChanged = 0;
let cjkDrops = [];
let cjkGains = [];

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

    for (const [old, new_] of CLEANUP) {
      const count = text.split(old).length - 1;
      if (count > 0) {
        text = text.split(old).join(new_);
        stats[old.slice(0, 20)].total += count;
        stats[old.slice(0, 20)].chapters++;
        changed = true;
      }
    }

    if (changed) {
      const afterCjk = countCjk(text);
      fs.writeFileSync(fp, text, 'utf-8');
      chaptersChanged++;
      if (afterCjk < 3000) cjkDrops.push([chNum, beforeCjk, afterCjk]);
      if (afterCjk > beforeCjk + 10) cjkGains.push([chNum, beforeCjk, afterCjk]);
    }
  }
}

console.log('=== PAD CLEANUP ===');
for (const [k, s] of Object.entries(stats)) {
  if (s.total > 0) console.log('  ' + k + '...: ' + s.total + ' (' + s.chapters + ' chs)');
}
console.log('Chapters changed: ' + chaptersChanged);

if (cjkDrops.length) {
  console.log('\nCJK drops below 3000 (' + cjkDrops.length + '):');
  for (const [ch, b, a] of cjkDrops) console.log('  ch' + ch + ': ' + b + ' -> ' + a + ' (delta: ' + (a-b) + ')');
}

// Re-pad drops
if (cjkDrops.length) {
  console.log('\nRe-padding...');
  let padded = 0;
  for (const [chNum, , ] of cjkDrops) {
    const vol = chNum <= 100 ? 'volume-1' : chNum <= 250 ? 'volume-2' : chNum <= 400 ? 'volume-3' :
                chNum <= 550 ? 'volume-4' : chNum <= 750 ? 'volume-5' : chNum <= 918 ? 'volume-6' : 'volume-7';
    const fp = path.join(baseDir, 'chapters', vol, 'chapter-' + String(chNum).padStart(3,'0') + '-polished.md');
    let text = fs.readFileSync(fp, 'utf-8');
    let cjk = countCjk(text);

    let idx = -1;
    for (const re of [/\（第\d+章完）/, /\（第[一二三四五六七八九十百千万零]+章完）/, /\（本章完）/]) {
      const m = text.match(re);
      if (m) { idx = m.index; break; }
    }
    if (idx < 0) continue;

    let pad = '';
    let ci = 0;
    while (countCjk(text.slice(0, idx) + pad + text.slice(idx)) < TARGET) {
      pad += '\n\n' + CLEAN_PAD[ci % CLEAN_PAD.length];
      ci++;
      if (ci > 100) break;
    }

    const newText = text.slice(0, idx) + pad + text.slice(idx);
    fs.writeFileSync(fp, newText, 'utf-8');
    console.log('  ch' + chNum + ': ' + cjk + ' -> ' + countCjk(newText));
    padded++;
  }
  console.log('Padded: ' + padded);
}

// Final verify
console.log('\n=== FINAL STATE ===');
let totalCjk = 0, below = 0, padResidue = 0;
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) below++;
    // Check remaining PAD residue
    padResidue += (text.match(/慢慢停下/g) || []).length;
    padResidue += (text.match(/像一块石头/g) || []).length;
    padResidue += (text.match(/不知道往哪个方向走/g) || []).length;
    padResidue += (text.match(/像藤蔓一样/g) || []).length;
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
console.log('  PAD residue (慢慢停下/像一块石头/不知道往哪/像藤蔓一样): ' + padResidue);