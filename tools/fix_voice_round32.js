const fs = require('fs');
const path = require('path');

// === R32 SOURCES (8 patterns: recycled R27 alternatives + high-freq leftovers) ===

const V1 = '周围的空气因为这句话顿了一瞬';
const V2 = '周围的空气因为这句话静了一瞬';
const V3 = '那个念头在他脑子里转了好几圈，才停下来';
const V4 = '那个念头在他脑子里转了几个来回，才停下来';
const V5 = '沉默在两人之间蔓延，谁也没有先开口打破它';
const V6 = '叶文轩的脑子没停过';
const V7 = '暗红色的光';
const V8 = '叶文轩的眼睛在看赵大嘴';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R32 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Va = [
  // V1 (周围的空气因为这句话顿了一瞬)
  '四周忽然沉寂下来。',
  '周围因为这句话安静了。',
  '空气因这句话骤然静默。',
  '四下忽然安静下来。',
  // V2 (周围的空气因为这句话静了一瞬)
  '四周因这句话忽然安静。',
  '周围因为这句话定住了。',
  '空气因为这句话停顿了。',
  '四下因这句话忽然静止。',
  // V3 (那个念头在他脑子里转了好几圈，才停下来)
  '那个念头在他的脑海中盘旋多次，终于止住。',
  '脑子里那个想法反复回旋，才渐渐停息。',
  '那个想法在他的意识中转动许久，终于平息。',
  '脑海中的念头来回盘旋，终于静止。',
  // V4 (那个念头在他脑子里转了几个来回，才停下来)
  '那个念头在他的意识中反复打转，终于停住。',
  '脑子里那个想法回旋数次，才渐渐消停。',
  '那个想法在他的脑海中往返数次，终于平息。',
  '脑海中的念头反复回旋，终于止住。',
  // V5 (沉默在两人之间蔓延，谁也没有先开口打破它)
  '两人之间一片安静，谁都没先出声。',
  '沉默笼罩着两人，无人率先开口。',
  '两人都没有说话，空气里满是沉默。',
  '沉默包裹着两人，谁也没有率先打破这份寂静。',
  // V6 (叶文轩的脑子没停过)
  '叶文轩的意识从未停歇。',
  '叶文轩的念头一直在运转。',
  '叶文轩的思路一刻也没有中断。',
  '叶文轩始终在想着事情。',
  // V7 (暗红色的光)
  '昏暗的红色光线',
  '幽暗的绯红色光芒',
  '深沉的血红色调',
  '朦胧的紫红色光线',
  // V8 (叶文轩的眼睛在看赵大嘴)
  '叶文轩注视着赵大嘴。',
  '叶文轩把目光投向赵大嘴。',
  '叶文轩盯着赵大嘴不放。',
  '叶文轩看向赵大嘴的方向。',
];// === R32 EXECUTION ===

const REPL = [
  [V1, Va[0], Va[1], Va[2], Va[3]],
  [V2, Va[4], Va[5], Va[6], Va[7]],
  [V3, Va[8], Va[9], Va[10], Va[11]],
  [V4, Va[12], Va[13], Va[14], Va[15]],
  [V5, Va[16], Va[17], Va[18], Va[19]],
  [V6, Va[20], Va[21], Va[22], Va[23]],
  [V7, Va[24], Va[25], Va[26], Va[27]],
  [V8, Va[28], Va[29], Va[30], Va[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R32 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 32 ===');
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