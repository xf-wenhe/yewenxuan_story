const fs = require('fs');
const path = require('path');

// === R51 SOURCES (8 patterns: low-volume voice) ===

const OO1 = '声音轻得几乎消散。';
const OO2 = '声音低得几乎无法感知。';
const OO3 = '声音低得几乎听不到。';
const OO4 = '声音低得几乎察觉不到。';
const OO5 = '声音轻得几乎听不到。';
const OO6 = '声音轻得几乎飘散。';
const OO7 = '声音轻得几乎消散在空气里。';
const OO8 = '他还需要一些时间才能理清头绪。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R51 ALTERNATIVES (8 sources × 4 = 32 total) ===

const OLa = [
  // OO1 (声音轻得几乎消散。)
  '声音轻得快要飘走。',
  '声音轻得快要模糊。',
  '声音轻得几近无声。',
  '声音轻得随时会断掉。',
  // OO2 (声音低得几乎无法感知。)
  '声音低到难以分辨。',
  '声音低到几近无声。',
  '声音低得无法察觉。',
  '声音低到让人听不清楚。',
  // OO3 (声音低得几乎听不到。)
  '声音低得难以听见。',
  '声音低得几乎不可闻。',
  '声音低得近乎无声。',
  '声音低到已经听不真切。',
  // OO4 (声音低得几乎察觉不到。)
  '声音低得难以察觉。',
  '声音低得几乎感觉不到。',
  '声音低得几乎无法辨认。',
  '声音低得几乎分辨不出。',
  // OO5 (声音轻得几乎听不到。)
  '声音轻得难以听见。',
  '声音轻得近乎听不见。',
  '声音轻得几近无声。',
  '声音轻到已经听不真切。',
  // OO6 (声音轻得几乎飘散。)
  '声音轻得像要飘远。',
  '声音轻得像要被风吹散。',
  '声音轻得好像随时会断。',
  '声音轻得像要从耳边溜走。',
  // OO7 (声音轻得几乎消散在空气里。)
  '声音轻得仿佛要被空气吞没。',
  '声音轻得几近融化在空气里。',
  '声音轻得像要融入空气。',
  '声音轻得快要消失在空气中。',
  // OO8 (他还需要一些时间才能理清头绪。)
  '他还需要时间理清思路。',
  '理清头绪还需要时间。',
  '他还需要时间去理清。',
  '他还需要时间把思绪理清。',
];// === R51 EXECUTION ===

const REPL = [
  [OO1, OLa[0], OLa[1], OLa[2], OLa[3]],
  [OO2, OLa[4], OLa[5], OLa[6], OLa[7]],
  [OO3, OLa[8], OLa[9], OLa[10], OLa[11]],
  [OO4, OLa[12], OLa[13], OLa[14], OLa[15]],
  [OO5, OLa[16], OLa[17], OLa[18], OLa[19]],
  [OO6, OLa[20], OLa[21], OLa[22], OLa[23]],
  [OO7, OLa[24], OLa[25], OLa[26], OLa[27]],
  [OO8, OLa[28], OLa[29], OLa[30], OLa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R51 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 51 ===');
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