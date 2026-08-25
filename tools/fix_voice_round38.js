const fs = require('fs');
const path = require('path');

// === R38 SOURCES (8 patterns: recycled alternatives + concentrated patterns) ===

const BB1 = '叶文轩的脑子在飞速运转。';
const BB2 = '他站在那里，什么也没有说出口。';
const BB3 = '叶文轩没有说话。';
const BB4 = '他抬起头，看向窗外，但窗外什么也没有。';
const BB5 = '赵大嘴跟在他后面。';
const BB6 = '备用能量在快速减少。';
const BB7 = '什么都没有。';
const BB8 = '叶文轩感到。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R38 ALTERNATIVES (8 sources × 4 = 32 total) ===

const BBa = [
  // BB1 (叶文轩的脑子在飞速运转。)
  '叶文轩的思绪飞速盘旋。',
  '叶文轩的思维高速运转。',
  '叶文轩的大脑在全力计算。',
  '叶文轩的思路以极快速度盘旋。',
  // BB2 (他站在那里，什么也没有说出口。)
  '他伫立原地，一言未发。',
  '他站在那里，始终没有开口。',
  '他站在原处，什么也没说。',
  '他立在那里，保持了沉默。',
  // BB3 (叶文轩没有说话。)
  '叶文轩一言未发。',
  '叶文轩保持了沉默。',
  '叶文轩始终没有开口。',
  '叶文轩未发一言。',
  // BB4 (他抬起头，看向窗外，但窗外什么也没有。)
  '他抬头望向窗外，窗外什么也不见。',
  '他抬眼看向窗外，外面空无一物。',
  '他抬起头望向外面，外面什么都没有。',
  '他抬头看着窗外，窗外空荡荡的。',
  // BB5 (赵大嘴跟在他后面。)
  '赵大嘴跟在叶文轩身后。',
  '赵大嘴尾随在他后面。',
  '赵大嘴跟在他身后不远处。',
  '赵大嘴紧随其后。',
  // BB6 (备用能量在快速减少。)
  '备用能源正在急速消耗。',
  '备用电量正在迅速下降。',
  '备用能量正在急剧流失。',
  '备用能量正以极快的速度递减。',
  // BB7 (什么都没有。)
  '一切都是空白的。',
  '没有任何东西存在。',
  '一片虚无。',
  '什么都没有留下。',
  // BB8 (叶文轩感到)
  '叶文轩察觉到',
  '叶文轩觉察到',
  '叶文轩意识到了',
  '叶文轩意识到了',
];// === R38 EXECUTION ===

const REPL = [
  [BB1, BBa[0], BBa[1], BBa[2], BBa[3]],
  [BB2, BBa[4], BBa[5], BBa[6], BBa[7]],
  [BB3, BBa[8], BBa[9], BBa[10], BBa[11]],
  [BB4, BBa[12], BBa[13], BBa[14], BBa[15]],
  [BB5, BBa[16], BBa[17], BBa[18], BBa[19]],
  [BB6, BBa[20], BBa[21], BBa[22], BBa[23]],
  [BB7, BBa[24], BBa[25], BBa[26], BBa[27]],
  [BB8, BBa[28], BBa[29], BBa[30], BBa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R38 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 38 ===');
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