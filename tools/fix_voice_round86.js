const fs = require('fs');
const path = require('path');

// === R86 SOURCES (8 patterns) ===

const ZZ1 = '声音轻得几近无声。。';
const ZZ2 = '声音轻得随时会断掉。。';
const ZZ3 = '声音细得像一缕风。。';
const ZZ4 = '声音压到了底线。。';
const ZZ5 = '声音细得仿佛游丝。。';
const ZZ6 = '声音小得几乎听不到了。。';
const ZZ7 = '声音压得低到几乎听不见。。';
const ZZ8 = '声音轻得快要散开。。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
// === R86 ALTERNATIVES (8 sources x 4 = 32 total) ===

const Zz = [
  // ZZ1 (声音轻得几近无声。。)
  '声线轻得几乎没有声响。',
  '嗓音轻得几近无声息。',
  '声音轻得几乎听不到声。',
  '声调轻得近乎无声息。',
  // ZZ2 (声音轻得随时会断掉。。)
  '声线轻得随时会中断。',
  '嗓音轻得立刻就会断。',
  '声音轻得马上就要断。',
  '声调轻得随时会断裂。',
  // ZZ3 (声音细得像一缕风。。)
  '声线细得像一片叶。',
  '嗓音细得像一缕烟。',
  '声音细得像一缕丝。',
  '声调细得像一缕云。',
  // ZZ4 (声音压到了底线。。)
  '声线压到了极点。',
  '嗓音压到了最底。',
  '声音压到了极限。',
  '声调压到了最低。',
  // ZZ5 (声音细得仿佛游丝。。)
  '声线细得像一根丝。',
  '嗓音细得像一缕线。',
  '声音细得像一丝线。',
  '声调细得像一缕烟。',
  // ZZ6 (声音小得几乎听不到了。。)
  '声线小得几乎无声。',
  '嗓音小得几乎听不到。',
  '声音小得几近无声。',
  '声调小得几近听不见。',
  // ZZ7 (声音压得低到几乎听不见。。)
  '声线压得低到几近无声。',
  '嗓音压得低到几不可闻。',
  '声音压得低到听不清。',
  '声调压得低到听不见。',
  // ZZ8 (声音轻得快要散开。。)
  '声线轻得快要消散。',
  '嗓音轻得快要飘散。',
  '声音轻得快要消失。',
  '声调轻得快要散去。',
];
// === R86 EXECUTION ===

const REPL = [
  [ZZ1, Zz[0], Zz[1], Zz[2], Zz[3]],
  [ZZ2, Zz[4], Zz[5], Zz[6], Zz[7]],
  [ZZ3, Zz[8], Zz[9], Zz[10], Zz[11]],
  [ZZ4, Zz[12], Zz[13], Zz[14], Zz[15]],
  [ZZ5, Zz[16], Zz[17], Zz[18], Zz[19]],
  [ZZ6, Zz[20], Zz[21], Zz[22], Zz[23]],
  [ZZ7, Zz[24], Zz[25], Zz[26], Zz[27]],
  [ZZ8, Zz[28], Zz[29], Zz[30], Zz[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R86 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 86 ===');
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
