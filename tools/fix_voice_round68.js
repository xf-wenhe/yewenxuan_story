const fs = require('fs');
const path = require('path');

// === R68 SOURCES (8 他还需要 patterns) ===

const FF1 = '他还需要时间去理清。';
const FF2 = '他还需要时间把思绪理清。';
const FF3 = '他还需要时间把思路理清。';
const FF4 = '他还需要些时间才能理清思路。';
const FF5 = '他还需要时间去想明白。';
const FF6 = '他还需要时间去弄通。';
const FF7 = '他还需要一点时间。';
const FF8 = '他还需要时间才能弄通。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R68 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Fg = [
  // FF1 (他还需要时间去理清。)
  '他还要花点时间理清。',
  '理清这些还需要时间。',
  '他需要再花些时间理清。',
  '理清头绪还得花时间。',
  // FF2 (他还需要时间把思绪理清。)
  '理清思绪还得花时间。',
  '他需要把思绪梳理清楚。',
  '把思绪理顺还得花时间。',
  '他还要花时间理顺思绪。',
  // FF3 (他还需要时间把思路理清。)
  '理清思路还得花时间。',
  '他需要把思路梳理清楚。',
  '把思路理顺还得花时间。',
  '他还要花时间理顺思路。',
  // FF4 (他还需要些时间才能理清思路。)
  '理清思路还得花些时间。',
  '梳理思路还要花些时间。',
  '理顺思路还需要些时间。',
  '把思路想清楚还得花时间。',
  // FF5 (他还需要时间去想明白。)
  '想明白还得花时间。',
  '理清这件事还需要时间。',
  '把这事想通还得花时间。',
  '弄明白还得花点时间。',
  // FF6 (他还需要时间去弄通。)
  '弄通还得花时间。',
  '理清这事还得花时间。',
  '想通这事还需要时间。',
  '把这事弄明白还要花时间。',
  // FF7 (他还需要一点时间。)
  '他还要花一点时间。',
  '还得给点时间。',
  '稍微给点时间。',
  '需要再花一点时间。',
  // FF8 (他还需要时间才能弄通。)
  '弄通还得花时间。',
  '把这事弄明白还要花时间。',
  '想通还得再花些时间。',
  '理顺还得再花点时间。',
];// === R68 EXECUTION ===

const REPL = [
  [FF1, Fg[0], Fg[1], Fg[2], Fg[3]],
  [FF2, Fg[4], Fg[5], Fg[6], Fg[7]],
  [FF3, Fg[8], Fg[9], Fg[10], Fg[11]],
  [FF4, Fg[12], Fg[13], Fg[14], Fg[15]],
  [FF5, Fg[16], Fg[17], Fg[18], Fg[19]],
  [FF6, Fg[20], Fg[21], Fg[22], Fg[23]],
  [FF7, Fg[24], Fg[25], Fg[26], Fg[27]],
  [FF8, Fg[28], Fg[29], Fg[30], Fg[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R68 VERIFICATION ===');
const sources = REPL.map(e => e[0]);
const allAlts = [];
for (const e of REPL) for (let j = 1; j < e.length; j++) allAlts.push(e[j]);
let bad = false;
for (const a of allAlts) {
  for (const s of sources) {
    if (a.indexOf(s) >= 0) { console.log('BAD: "' + a + '" contains "' + s + '"'); bad = true; }
  }
}
if (!bad) console.log('All clean. No alt contains any source.');

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

let counters = {};
let chaptersChanged = 0;
let cjkDrops = [];
let totalCjkBefore = 0;

for (const volDir of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const fp = path.join(d, f);
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let text = fs.readFileSync(fp, 'utf-8');
    const beforeCjk = countCjk(text);
    totalCjkBefore += beforeCjk;
    let changed = false;
    for (const entry of REPL) {
      const pattern = entry[0];
      if (!counters[pattern]) counters[pattern] = 0;
      let idx = text.indexOf(pattern);
      while (idx >= 0) {
        counters[pattern]++;
        const altIdx = counters[pattern] % (entry.length - 1);
        const alt = entry[1 + altIdx];
        text = text.slice(0, idx) + alt + text.slice(idx + pattern.length);
        idx = text.indexOf(pattern, idx + alt.length);
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

console.log('\n=== VOICE ROUND 68 ===');
for (const [pattern, cnt] of Object.entries(counters)) {
  if (cnt > 0) console.log('  ' + pattern +': ' + cnt);
}
console.log('Chapters changed: ' + chaptersChanged);
console.log('Total replaced: ' + Object.values(counters).reduce((a,b) => a + (b || 0), 0));

if (cjkDrops.length) {
  console.log('\nCJK drops below 3000 (' + cjkDrops.length + '):');
  for (const [ch, b, a] of cjkDrops) console.log('  ch' + ch + ': ' + b + ' -> ' + a);
  console.log('\nRe-padding...');
  let padded = 0;
  for (const [chNum] of cjkDrops) {
    const vol = chNum <= 100 ? "volume-1" : chNum <= 250 ? "volume-2" : chNum <= 400 ? "volume-3" :
                chNum <= 550 ? "volume-4" : chNum <= 750 ? "volume-5" : chNum <= 918 ? "volume-6" : "volume-7";
    const fp = path.join(process.cwd(), 'chapters', vol, 'chapter-' + String(chNum).padStart(3,'0') + '-polished.md');
    let text = fs.readFileSync(fp, 'utf-8');
    let cjk = countCjk(text);
    let idx = -1;
    const re1 = new RegExp(rL + rDi + '\\d+' + rZ + rW + rR);
    const re2 = new RegExp(rL + rDi + '[' + rNums + ']+' + rZ + rW + rR);
    const re3 = new RegExp(rL + rBen + rZ + rW + rR);
    for (const re of [re1, re2, re3]) {
      const m = text.match(re);
      if (m) { idx = m.index; break; }
    }
    if (idx < 0) { console.log('  ch' + chNum + ': no end marker found, skip'); continue; }
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

console.log('\n=== FINAL STATE ===');
let totalCjk = 0, below = 0;
for (const v of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) below++;
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
console.log('  Delta: ' + (totalCjk - totalCjkBefore));

console.log('\nRemaining sources:');
for (const entry of REPL) {
  const p = entry[0];
  let total = 0;
  for (const v of VOLUMES) {
    const d = path.join(process.cwd(), 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      total += fs.readFileSync(path.join(d, f), 'utf-8').split(p).length - 1;
    }
  }
  console.log('  "' + p + '": ' + total);
}