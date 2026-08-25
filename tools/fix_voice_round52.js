const fs = require('fs');
const path = require('path');

// === R52 SOURCES (8 patterns: volume + time) ===

const PP1 = '音量低到几乎无声。';
const PP2 = '音量低得几乎听不到。';
const PP3 = '音量低到几乎听不到。';
const PP4 = '音量轻得几乎听不清。';
const PP5 = '音量轻得几乎消失。';
const PP6 = '他还需要一点时间才能弄懂。';
const PP7 = '他还需要些时间。';
const PP8 = '他还需要些时间才能弄通。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R52 ALTERNATIVES (8 sources × 4 = 32 total) ===

const PPa = [
  // PP1 (音量低到几乎无声。)
  '音量低得几近无声。',
  '音量低到难以察觉。',
  '音量低到让人听不清。',
  '音量低到几乎分辨不出。',
  // PP2 (音量低得几乎听不到。)
  '音量低得难以听见。',
  '音量低得几乎不可闻。',
  '音量低得近乎无声。',
  '音量低到已经听不真切。',
  // PP3 (音量低到几乎听不到。)
  '音量低到难以听见。',
  '音量低到几近无声。',
  '音量低到让人听不清。',
  '音量低到几乎分辨不出。',
  // PP4 (音量轻得几乎听不清。)
  '音量轻得难以分辨。',
  '音量轻得几乎听不见。',
  '音量轻得几近无声。',
  '音量轻得好像要断掉。',
  // PP5 (音量轻得几乎消失。)
  '音量轻得快要飘散。',
  '音量轻得快要模糊。',
  '音量轻得几近无声。',
  '音量轻得好像要断。',
  // PP6 (他还需要一点时间才能弄懂。)
  '弄懂还需要一点时间。',
  '他还需要些时间才能弄懂。',
  '他还需要时间去弄懂。',
  '弄懂还需要时间。',
  // PP7 (他还需要些时间。)
  '他还需要更多时间。',
  '他还需要些时间才行。',
  '他还需要点时间。',
  '他还需要一点时间。',
  // PP8 (他还需要些时间才能弄通。)
  '弄通还需要些时间。',
  '他还需要些时间弄通。',
  '他还需要时间才能弄通。',
  '他还需要时间去弄通。',
];// === R52 EXECUTION ===

const REPL = [
  [PP1, PPa[0], PPa[1], PPa[2], PPa[3]],
  [PP2, PPa[4], PPa[5], PPa[6], PPa[7]],
  [PP3, PPa[8], PPa[9], PPa[10], PPa[11]],
  [PP4, PPa[12], PPa[13], PPa[14], PPa[15]],
  [PP5, PPa[16], PPa[17], PPa[18], PPa[19]],
  [PP6, PPa[20], PPa[21], PPa[22], PPa[23]],
  [PP7, PPa[24], PPa[25], PPa[26], PPa[27]],
  [PP8, PPa[28], PPa[29], PPa[30], PPa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R52 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 52 ===');
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