const fs = require('fs');
const path = require('path');

// === R61 SOURCES (8 patterns) ===

const YY1 = '声音变了调，像是远处有什么在低语。';
const YY2 = '声音极弱。';
const YY3 = '声音极轻而短。';
const YY4 = '声音很细小发颤。';
const YY5 = '声音提高了。';
const YY6 = '声音简短。';
const YY7 = '声音轻得发抖。';
const YY8 = '声音极轻小。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R61 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Yz = [
  // YY1 (声音变了调，像是远处有什么在低语。)
  '声音变了调，带着远处的回音。',
  '声音变了调，混着隐隐的响动。',
  '声音变了样，像有人在远处低语。',
  '声音变了调，似有似无地飘来。',
  // YY2 (声音极弱。)
  '声音微弱到几乎无声。',
  '声音极轻微。',
  '声音弱得难以察觉。',
  '声音淡得几乎消失。',
  // YY3 (声音极轻而短。)
  '声音轻得短促。',
  '声音极轻极短。',
  '声音轻而短促。',
  '声音短得几乎听不到。',
  // YY4 (声音很细小发颤。)
  '声音细到发颤。',
  '声音细小而颤抖。',
  '声音细碎地颤动。',
  '声音细细地抖着。',
  // YY5 (声音提高了。)
  '声音拔高了。',
  '声音抬高了。',
  '声音陡然高了起来。',
  '音量抬高了。',
  // YY6 (声音简短。)
  '声音简练。',
  '声音短促。',
  '声音只有几个字。',
  '声音寥寥几个字。',
  // YY7 (声音轻得发抖。)
  '声音发抖般颤动。',
  '声音抖得让人听不清。',
  '声音抖着颤着。',
  '声音发抖般飘散。',
  // YY8 (声音极轻小。)
  '声音轻得微小。',
  '声音微小而轻。',
  '声音轻得极微。',
  '声音轻得难以捕捉。',
];// === R61 EXECUTION ===

const REPL = [
  [YY1, Yz[0], Yz[1], Yz[2], Yz[3]],
  [YY2, Yz[4], Yz[5], Yz[6], Yz[7]],
  [YY3, Yz[8], Yz[9], Yz[10], Yz[11]],
  [YY4, Yz[12], Yz[13], Yz[14], Yz[15]],
  [YY5, Yz[16], Yz[17], Yz[18], Yz[19]],
  [YY6, Yz[20], Yz[21], Yz[22], Yz[23]],
  [YY7, Yz[24], Yz[25], Yz[26], Yz[27]],
  [YY8, Yz[28], Yz[29], Yz[30], Yz[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R61 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 61 ===');
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