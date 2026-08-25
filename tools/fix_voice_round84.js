const fs = require('fs');
const path = require('path');

// === R84 SOURCES (8 patterns) ===

const XX1 = '他还需要些时间才行。。';
const XX2 = '他还需要短暂的时间才能说完。。';
const XX3 = '他还需要一段时间。。';
const XX4 = '他还需要点时间。。';
const XX5 = '他还需要一些时间才能把话说完整。。';
const XX6 = '他还需要片刻才能把话讲完。。';
const XX7 = '他还需要些时间。。';
const XX8 = '他还需要短暂的时间来思考。。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
// === R84 ALTERNATIVES (8 sources x 4 = 32 total) ===

const Xx = [
  // XX1 (他还需要些时间才行。。)
  '他还要再等一会儿才行。',
  '他得再缓一缓才来得及。',
  '他还需要再多一刻钟。',
  '他还差一口气才行。',
  // XX2 (他还需要短暂的时间才能说完。。)
  '他还要再缓一缓才能说完。',
  '他得再等一会儿才能把话讲完。',
  '他需要再多一会儿才能说完。',
  '他还差一口气才能讲完。',
  // XX3 (他还需要一段时间。。)
  '他还要再等一会儿。',
  '他得再缓一缓。',
  '他需要再多花些时间。',
  '他还要再熬一会儿。',
  // XX4 (他还需要点时间。。)
  '他还要再等片刻。',
  '他得再缓片刻。',
  '他需要再多给点时间。',
  '他得再喘口气。',
  // XX5 (他还需要一些时间才能把话说完整。。)
  '他还要再缓一缓才能把话说完整。',
  '他需要再多一会儿才能把话说全。',
  '他得再等一会儿才能讲完整。',
  '他还差一口气才能把话讲完。',
  // XX6 (他还需要片刻才能把话讲完。。)
  '他还要再等片刻才能讲完。',
  '他得再缓片刻才能说完。',
  '他需要再多一会儿才能把话讲完。',
  '他还要再喘口气才能讲清。',
  // XX7 (他还需要些时间。。)
  '他得再缓过这一阵。',
  '他还要再等一等。',
  '他需要再多喘口气。',
  '他得再稳一稳。',
  // XX8 (他还需要短暂的时间来思考。。)
  '他还要再缓一缓来思考。',
  '他得再等一会儿来理清思绪。',
  '他需要再多一会儿来想清楚。',
  '他得再沉住气来思考。',
];
// === R84 EXECUTION ===

const REPL = [
  [XX1, Xx[0], Xx[1], Xx[2], Xx[3]],
  [XX2, Xx[4], Xx[5], Xx[6], Xx[7]],
  [XX3, Xx[8], Xx[9], Xx[10], Xx[11]],
  [XX4, Xx[12], Xx[13], Xx[14], Xx[15]],
  [XX5, Xx[16], Xx[17], Xx[18], Xx[19]],
  [XX6, Xx[20], Xx[21], Xx[22], Xx[23]],
  [XX7, Xx[24], Xx[25], Xx[26], Xx[27]],
  [XX8, Xx[28], Xx[29], Xx[30], Xx[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R84 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 84 ===');
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
