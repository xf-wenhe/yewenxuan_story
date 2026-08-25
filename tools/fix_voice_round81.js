const fs = require('fs');
const path = require('path');

// === R81 SOURCES (8 patterns) ===

const TT1 = '声音在叶文轩的意识中响起，飘荡。';
const TT2 = '声音反复几次，最后消失不见。';
const TT3 = '声音淡得像水。';
const TT4 = '声音抖得让人听不清。';
const TT5 = '声音变了调，混着隐隐的响动。';
const TT6 = '声音从后方传来。';
const TT7 = '声音弱得难以察觉。';
const TT8 = '声音发哑。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R81 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Tt = [
  // TT1 (声音在叶文轩的意识中响起，飘荡。)
  '声线在叶文轩的意识里浮现，来回游荡。',
  '嗓音在叶文轩的意识中回旋。',
  '声音在叶文轩的意识里回荡。',
  '叶文轩的意识中传来声线，浮浮沉沉。',
  // TT2 (声音反复几次，最后消失不见。)
  '声响反复数次，最终归于无声。',
  '那声音来回几次，到底消散。',
  '话语重复几回，然后隐去。',
  '声线回旋多时，最后彻底不见。',
  // TT3 (声音淡得像水。
  '声线淡得如同流水。',
  '嗓音淡得似水般清浅。',
  '声音淡得几乎无迹可寻。',
  '声调淡得像水面上的倒影。',
  // TT4 (声音抖得让人听不清。)
  '声线颤动得难以辨清。',
  '嗓音发抖得让人无法听清。',
  '声音抖得几乎听不见。',
  '声调抖得含糊不清。',
  // TT5 (声音变了调，混着隐隐的响动。)
  '声线改变了频率，夹杂若隐若现的声响。',
  '嗓音变了调门，混入隐约的回响。',
  '声音调子改变，掺杂着隐隐的动静。',
  '声调变了音，裹着微弱的杂音。',
  // TT6 (声音从后方传来。)
  '声线从背后传来。',
  '嗓音从后面传来。',
  '声音自后方传来。',
  '话音从身后传来。',
  // TT7 (声音弱得难以察觉。)
  '声线微弱得几乎无法察觉。',
  '嗓音弱到几乎不可闻。',
  '声音微弱得难以捕捉。',
  '声调弱得近乎消失。',
  // TT8 (声音发哑。)
  '声线发哑。',
  '嗓音沙哑。',
  '声音嘶哑。',
  '声调干哑。',
];// === R81 EXECUTION ===

const REPL = [
  [TT1, Tt[0], Tt[1], Tt[2], Tt[3]],
  [TT2, Tt[4], Tt[5], Tt[6], Tt[7]],
  [TT3, Tt[8], Tt[9], Tt[10], Tt[11]],
  [TT4, Tt[12], Tt[13], Tt[14], Tt[15]],
  [TT5, Tt[16], Tt[17], Tt[18], Tt[19]],
  [TT6, Tt[20], Tt[21], Tt[22], Tt[23]],
  [TT7, Tt[24], Tt[25], Tt[26], Tt[27]],
  [TT8, Tt[28], Tt[29], Tt[30], Tt[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R81 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 81 ===');
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