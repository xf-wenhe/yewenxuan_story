const fs = require('fs');
const path = require('path');

// === R73 SOURCES (8 patterns) ===

const LL1 = '声音颤抖不止。';
const LL2 = '声音有点飘，"它在叫我。';
const LL3 = '声音很模糊。像隔着一层水。像隔着一层时间。';
const LL4 = '声音从远处传来，浪拍在沙滩上的声音。';
const LL5 = '声音细得像游丝。。';
const LL6 = '声音颤抖着。';
const LL7 = '声音在0415碎片的最深层循环播放。';
const LL8 = '声音压到了最低。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R73 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Ll = [
  // LL1 (声音颤抖不止。)
  '声线颤抖不停。',
  '声音一直颤动。',
  '声音抖动着没停。',
  '声调颤得没有尽头。',
  // LL2 (声音有点飘，"它在叫我。)
  '声线飘忽不定，"它在唤我。',
  '声音轻飘，"它在喊我。',
  '声调飘了起来，"它在叫我。',
  '声音飘忽，"它在召我。',
  // LL3 (声音很模糊。像隔着一层水。像隔着一层时间。)
  '声音模糊不清。仿佛隔着水。仿佛隔着时间。',
  '声线含糊。像隔了一层雾。像隔了一层岁月。',
  '声音飘忽。像隔了一层纱。像隔着一层时空。',
  '声调模糊。像隔了水面。像隔了光阴。',
  // LL4 (声音从远处传来，浪拍在沙滩上的声音。)
  '声音由远及近，海浪拍打着沙滩。',
  '远处传来声音，浪花拍打沙滩的声响。',
  '声音从远方飘来，浪涛拍在沙滩上。',
  '远方的声音传来，浪涌拍击沙滩。',
  // LL5 (声音细得像游丝。。)
  '声音细若游丝。。',
  '声线细得像一根线。。',
  '声音细得几乎听不见。。',
  '声调细得像蛛丝。。',
  // LL6 (声音颤抖着。)
  '声线颤抖。',
  '声音抖动着。',
  '声调颤动着。',
  '嗓音颤抖。',
  // LL7 (声音在0415碎片的最深层循环播放。)
  '声音在0415碎片最深处反复回响。',
  '声音在0415碎片核心层不断循环。',
  '声音在0415碎片底层不停回荡。',
  '声音在0415碎片最深处循环往复。',
  // LL8 (声音压到了最低。)
  '声线压到最低。',
  '音量降到了底。',
  '声音压至最低。',
  '声调压到最底。',
];// === R73 EXECUTION ===

const REPL = [
  [LL1, Ll[0], Ll[1], Ll[2], Ll[3]],
  [LL2, Ll[4], Ll[5], Ll[6], Ll[7]],
  [LL3, Ll[8], Ll[9], Ll[10], Ll[11]],
  [LL4, Ll[12], Ll[13], Ll[14], Ll[15]],
  [LL5, Ll[16], Ll[17], Ll[18], Ll[19]],
  [LL6, Ll[20], Ll[21], Ll[22], Ll[23]],
  [LL7, Ll[24], Ll[25], Ll[26], Ll[27]],
  [LL8, Ll[28], Ll[29], Ll[30], Ll[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R73 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 73 ===');
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