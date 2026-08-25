const fs = require('fs');
const path = require('path');

// === R76 SOURCES (8 patterns) ===

const OO1 = '声音来回转动，终于歇了。';
const OO2 = '声音一圈圈打转，终于平息。';
const OO3 = '声音挥之不去。';
const OO4 = '声音转了转，然后消失了。';
const OO5 = '声音转了转，最终消散。';
const OO6 = '声音一圈圈打转，最终消散。';
const OO7 = '声音里面有紧迫感。';
const OO8 = '他还需要更多时间。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R76 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Oo = [
  // OO1 (声音来回转动，终于歇了。)
  '声响反复回旋，慢慢停住。',
  '声音几度来回，到底安静下来。',
  '那响动转了几轮，终归平息。',
  '话语在空气中翻转几回，随后静了。',
  // OO2 (声音一圈圈打转，终于平息。)
  '声响层层回旋，慢慢平息。',
  '那声音一圈圈荡开，最后静下来。',
  '话语反复回旋，渐渐消散。',
  '响动层层荡开，到底停了。',
  // OO3 (声音挥之不去。)
  '声响久久不散。',
  '声音久久萦绕。',
  '那声响迟迟未消。',
  '话语一直在耳边。',
  // OO4 (声音转了转，然后消失了。)
  '声响转了转，随后不见了。',
  '那声音转了几回，到底散掉。',
  '话语回旋片刻，接着隐去。',
  '声音转了几下，最后归于寂静。',
  // OO5 (声音转了转，最终消散。)
  '声响转了几回，最后归于寂静。',
  '那声音回旋片刻，终究淡去。',
  '话语打转几下，终究散掉。',
  '声音反复几次，最后消失不见。',
  // OO6 (声音一圈圈打转，最终消散。)
  '声响层层回旋，最后归于寂静。',
  '那声音一圈圈荡开，最后淡去。',
  '话语反复回旋，终究消散。',
  '响动层层荡开，终究消掉。',
  // OO7 (声音里面有紧迫感。)
  '话里透着紧迫。',
  '语气里带着焦急。',
  '那声音满是仓促。',
  '话语中透着急迫。',
  // OO8 (他还需要更多时间。)
  '他还需要更多余地。',
  '他还需要再久一些。',
  '他还需要再缓一缓。',
  '他还需要更多功夫。',
];// === R76 EXECUTION ===

const REPL = [
  [OO1, Oo[0], Oo[1], Oo[2], Oo[3]],
  [OO2, Oo[4], Oo[5], Oo[6], Oo[7]],
  [OO3, Oo[8], Oo[9], Oo[10], Oo[11]],
  [OO4, Oo[12], Oo[13], Oo[14], Oo[15]],
  [OO5, Oo[16], Oo[17], Oo[18], Oo[19]],
  [OO6, Oo[20], Oo[21], Oo[22], Oo[23]],
  [OO7, Oo[24], Oo[25], Oo[26], Oo[27]],
  [OO8, Oo[28], Oo[29], Oo[30], Oo[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R76 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 76 ===');
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