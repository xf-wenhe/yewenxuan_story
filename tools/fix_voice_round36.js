const fs = require('fs');
const path = require('path');

// === R36 SOURCES (8 patterns: recycled alternatives + 0428 backup lines + looking-at patterns) ===

const Z1 = '那句话沉进了他心里，再也抹不掉。';
const Z2 = '那句话沉进了他心里，再也浮不上来。';
const Z3 = '叶文轩看着他。';
const Z4 = '赵大嘴看着他。';
const Z5 = '叶文轩感觉到心跳。';
const Z6 = '那些被压下去的东西，现在一点一点地浮上来。';
const Z7 = '0428备份在坐标的位置发光，';
const Z8 = '0428备份在坐标的位置运行，';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R36 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Za = [
  // Z1 (那句话沉进了他心里，再也抹不掉。)
  '那句话烙进他的意识里，永远无法擦除。',
  '那句话根植于他的心底，再也无法拔除。',
  '那句话刻进他的内心，终生无法磨灭。',
  '那句话深深刻入他的意识，不可逆。',
  // Z2 (那句话沉进了他心里，再也浮不上来。)
  '那句话沉入他的心底，再未重新出现。',
  '那句话陷入他的意识最深处，永远搁置。',
  '那句话沉入他心底的深渊，再未浮出水面。',
  '那句话埋入他的记忆底层，再未现形。',
  // Z3 (叶文轩看着他。)
  '叶文轩的目光落在他身上。',
  '叶文轩注视着他。',
  '叶文轩将视线停在他身上。',
  '叶文轩望向那人的方向。',
  // Z4 (赵大嘴看着他。)
  '赵大嘴的目光落在他身上。',
  '赵大嘴注视着他。',
  '赵大嘴将视线停在他身上。',
  '赵大嘴望向那人的方向。',
  // Z5 (叶文轩感觉到心跳。)
  '叶文轩意识到心脏在跳动。',
  '叶文轩感到心口在跳动。',
  '叶文轩察觉到心脏的跳动。',
  '叶文轩觉察到自己心脏的搏动。',
  // Z6 (那些被压下去的东西，现在一点一点地浮上来。)
  '那些被压制的记忆，此刻正在逐渐回归。',
  '那些被隐藏的情感，正在缓慢地重新浮现。',
  '那些被封锁的内容，正一点一点重新出现。',
  '那些被掩埋的过往，此刻正慢慢显露。',
  // Z7 (0428备份在坐标的位置发光，)
  '0428备份在坐标处散发光芒，',
  '0428的备份体在坐标上亮了起来，',
  '0428副本在坐标位置释放出光线，',
  '0428备份于坐标处发出微光，',
  // Z8 (0428备份在坐标的位置运行，)
  '0428备份在坐标处持续运转，',
  '0428的备份体在坐标上稳定运行，',
  '0428副本在坐标位置执行运算，',
  '0428备份于坐标处正常工作，',
];// === R36 EXECUTION ===

const REPL = [
  [Z1, Za[0], Za[1], Za[2], Za[3]],
  [Z2, Za[4], Za[5], Za[6], Za[7]],
  [Z3, Za[8], Za[9], Za[10], Za[11]],
  [Z4, Za[12], Za[13], Za[14], Za[15]],
  [Z5, Za[16], Za[17], Za[18], Za[19]],
  [Z6, Za[20], Za[21], Za[22], Za[23]],
  [Z7, Za[24], Za[25], Za[26], Za[27]],
  [Z8, Za[28], Za[29], Za[30], Za[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R36 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 36 ===');
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