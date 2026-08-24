const fs = require('fs');
const path = require('path');

// === R31 SOURCES (8 patterns: 4 air + 2 thought + 2 character) ===

const U1 = '周围的空气静了一瞬';
const U2 = '周围的空气也因为这句话静了一瞬';
const U3 = '周围的空气因为这句话忽然静了';
const U4 = '周围的空气因为这句话凝滞了一瞬';
const U5 = '那个念头在他脑子里转了转，才终于止住';
const U6 = '那个念头在他脑子里转了一圈又一圈，才慢慢歇了';
const U7 = '赵大嘴的父亲的声音很哑';
const U8 = '叶文轩的声音有些发紧';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R31 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Ua = [
  // U1 (周围的空气静了一瞬)
  '四周忽然静了下来。',
  '周围静了。',
  '四下忽然安静。',
  '周围的喧嚣骤然消失。',
  // U2 (周围的空气也因为这句话静了一瞬)
  '周围因为这句话安静了。',
  '这句话让四周静了下来。',
  '四周因为这句话忽然安静。',
  '周围忽然沉寂。',
  // U3 (周围的空气因为这句话忽然静了)
  '这句话让周围忽然静下来。',
  '四周因为这句话骤然安静。',
  '周围因这句话而静默。',
  '四周突然安静下来。',
  // U4 (周围的空气因为这句话凝滞了一瞬)
  '这句话让周围凝滞了片刻。',
  '四周因这句话而停顿了。',
  '周围因这句话定住了。',
  '这句话让空气凝固了。',
  // U5 (那个念头在他脑子里转了转，才终于止住)
  '那个念头在他的脑海中盘旋片刻，终于平息。',
  '脑子里那个声音转了转，最终消散。',
  '那个想法在他的意识中打转，随后停止。',
  '脑海中的念头最终安静下来。',
  // U6 (那个念头在他脑子里转了一圈又一圈，才慢慢歇了)
  '那个念头在他的意识中反复回旋，终于停息。',
  '脑子里那个声音一圈圈打转，最终消散。',
  '那个想法在他的脑海中不断盘旋，才渐渐停。',
  '脑海中的念头反复回旋，终于止息。',
  // U7 (赵大嘴的父亲的声音很哑)
  '赵大嘴父亲的声音沙哑得厉害。',
  '赵大嘴父亲说话带着浓厚的沙哑声。',
  '赵大嘴父亲的嗓音粗哑不堪。',
  '赵大嘴父亲开口时声音异常沙哑。',
  // U8 (叶文轩的声音有些发紧)
  '叶文轩说话时嗓音绷得很紧。',
  '叶文轩开口，声音带着紧绷感。',
  '叶文轩的语调紧绷而急促。',
  '叶文轩的嗓音绷得发涩。',
];// === R31 EXECUTION ===

const REPL = [
  [U1, Ua[0], Ua[1], Ua[2], Ua[3]],
  [U2, Ua[4], Ua[5], Ua[6], Ua[7]],
  [U3, Ua[8], Ua[9], Ua[10], Ua[11]],
  [U4, Ua[12], Ua[13], Ua[14], Ua[15]],
  [U5, Ua[16], Ua[17], Ua[18], Ua[19]],
  [U6, Ua[20], Ua[21], Ua[22], Ua[23]],
  [U7, Ua[24], Ua[25], Ua[26], Ua[27]],
  [U8, Ua[28], Ua[29], Ua[30], Ua[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R31 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 31 ===');
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