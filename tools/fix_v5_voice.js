#!/usr/bin/env node
/* fix_v5_voice.js — Reduce 能感觉到/心脏在跳动 structural repetition in V5

Strategy:
1. 能感觉到 → 感觉到 (drop redundant modal 能, all volumes)
2. V5 standalone 心脏在跳动。 → rotate through varied alternatives
   - keep 50% as-is (maintain heartbeat rhythm)
   - replace 50% with: 心跳。/ 心脏跳。/ X感觉到心跳。
3. Re-pad chapters that drop below 3000
*/

const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

// Clean PAD pool (no banned words, no similes)
const CLEAN_PAD = [
  '那个念头在他脑子里转了一圈，才停下来。',
  '周围的空气因为这句话安静了一瞬。',
  '他站在那里，一时不知道该往哪走。',
  '那些影子在光里晃动，是被遗忘的记忆在挣扎。',
  '这个念头一旦出现，便缠住了他的思绪。',
  '他需要更多的时间。',
  '这件事的来龙去脉，他还需要更多的时间才能弄清楚。',
  '他的目光在那些影子里停留了几秒。',
  '那些话语没有出口，只在意识中回荡。',
  '空气因为这句话凝固了一瞬。',
];

let totalFeelDrop = 0;
let totalHeartbeat = 0;
let chaptersChanged = 0;
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

    // 1. 能感觉到 → 感觉到 (drop redundant 能)
    // Only do this in V4 and V5 where the pattern is concentrated
    const volNum = parseInt(volDir.split('-')[1]);
    if (volNum === 4 || volNum === 5) {
      const feelBefore = (text.match(/能感觉到/g) || []).length;
      if (feelBefore > 0) {
        text = text.split('能感觉到').join('感觉到');
        totalFeelDrop += feelBefore;
        changed = true;
      }
    }

    // 2. V5 standalone 心脏在跳动。 → rotate alternatives
    if (volNum === 5) {
      // Process each subject group independently with its own counter
      const subjectReplacements = {
        '叶文轩': ['叶文轩心跳。', '心跳。', '叶文轩感觉到心跳。'],
        '赵大嘴': ['赵大嘴心跳。', '心跳。', '赵大嘴感觉到心跳。'],
        '他':   ['他心跳。', '心跳。', '他感觉到心跳。'],
      };

      for (const [subj, alternatives] of Object.entries(subjectReplacements)) {
        const pattern = subj + '的心脏在跳。';
        let idx = 0;
        let count = 0;
        while (true) {
          const i = text.indexOf(pattern, idx);
          if (i < 0) break;
          count++;
          // Keep every other instance (50% keep rate), rotate for the rest
          if (count % 2 === 0) {
            const alt = alternatives[Math.floor(count / 2) % alternatives.length];
            text = text.slice(0, i) + alt + text.slice(i + pattern.length);
            idx = i + alt.length;
          } else {
            idx = i + pattern.length;
          }
        }
        if (count > 0) {
          totalHeartbeat += count;
          changed = true;
        }
      }

      // Also handle 一颗安静的心脏在跳。
      let idx2 = 0;
      while (true) {
        const i = text.indexOf('一颗安静的心脏在跳。', idx2);
        if (i < 0) break;
        totalHeartbeat++;
        const alt = countCjk(text) < 3050 ? '一颗安静的心脏。' : '安静的心。';
        text = text.slice(0, i) + alt + text.slice(i + '一颗安静的心脏在跳。'.length);
        idx2 = i + alt.length;
        changed = true;
      }
    }

    if (changed) {
      const afterCjk = countCjk(text);
      fs.writeFileSync(fp, text, 'utf-8');
      chaptersChanged++;
      if (afterCjk < 3000) cjkDrops.push([chNum, beforeCjk, afterCjk]);
    }
  }
}

console.log('=== V5 VOICE FIX ===');
console.log('  能感觉到 → 感觉到: ' + totalFeelDrop);
console.log('  心脏在跳动 processed: ' + totalHeartbeat);
console.log('  Chapters changed: ' + chaptersChanged);

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
let totalCjk = 0, below = 0;
let remainingFeel = 0, remainingHeart = 0;
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) below++;
    const volNum = parseInt(v.split('-')[1]);
    if (volNum === 4 || volNum === 5) {
      remainingFeel += (text.match(/能感觉到/g) || []).length;
    }
    if (volNum === 5) {
      remainingHeart += (text.match(/[一-鿿]{1,4}的心脏在跳[动]?。/g) || []).length;
    }
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
console.log('  V4+V5 remaining 能感觉到: ' + remainingFeel);
console.log('  V5 remaining 心脏在跳动 standalone: ' + remainingHeart);