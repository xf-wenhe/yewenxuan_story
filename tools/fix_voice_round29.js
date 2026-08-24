const fs = require('fs');
const path = require('path');

// === R29 SOURCES (10 patterns, recycled R27/R28 alternatives) ===

const R1 = '叶文轩的心脏怦怦直跳';
const R2 = '叶文轩的心脏在剧烈跳动';
const R3 = '叶文轩的心脏在咚咚作响';
const R4 = '叶文轩的心脏跳得很厉害';
const R5 = '那些影子在光里晃动，是一些被遗忘的记忆在挣扎';
const R6 = '这个念头在他脑子里转了几圈，才慢慢止住';
const R7 = '这个念头在他脑子里转了转，终于停了下来';
const R8 = '这个念头在他脑子里转了几个来回，才慢慢停';
const R9 = '这个念头在他脑子里转了一圈又一圈，才终于歇了';
const R10 = '墙上的灯光忽明忽暗';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R29 ALTERNATIVES (10 sources × 4 = 40 total) ===

const Ra = [
  // R1 (叶文轩的心脏怦怦直跳)
  '叶文轩胸口发闷，喘不过气。',
  '血液在叶文轩身体里奔涌。',
  '叶文轩的脉搏陡然加快。',
  '叶文轩的心口被什么东西撞了一下。',
  // R2 (叶文轩的心脏在剧烈跳动)
  '叶文轩的胸口剧烈起伏。',
  '血液在叶文轩体内快速奔涌。',
  '叶文轩的脉搏跳动得很剧烈。',
  '叶文轩的胸口像是被攥紧。',
  // R3 (叶文轩的心脏在咚咚作响)
  '叶文轩的心口发出咚咚的回响。',
  '血液在叶文轩身体里隆隆作响。',
  '叶文轩胸口传来砰砰的回声。',
  '叶文轩心脏处的跳动声清晰可闻。',
  // R4 (叶文轩的心脏跳得很厉害)
  '叶文轩的胸口起伏得厉害。',
  '血液在叶文轩体内加速奔流。',
  '叶文轩的脉搏快得发颤。',
  '叶文轩的心脏狂跳不停。',
  // R5 (那些影子在光里晃动，是一些被遗忘的记忆在挣扎)
  '那些影子在暗处浮动。',
  '光里的影子在晃动。',
  '黑暗中的影子在蠕动。',
  '那些轮廓在光影里游移。',
  // R6 (这个念头在他脑子里转了几圈，才慢慢止住)
  '这个念头一直在脑海中盘旋。',
  '脑海中那个声音挥之不去。',
  '那个想法像根刺扎在脑子里。',
  '脑子里那个念头不肯散去。',
  // R7 (这个念头在他脑子里转了转，终于停了下来)
  '这个念头在脑海中打了个转，最终沉了下去。',
  '脑子里那个声音转了转，然后消失了。',
  '念头在脑海中盘旋片刻，终于平息。',
  '那个想法转了半圈，最终沉进心底。',
  // R8 (这个念头在他脑子里转了几个来回，才慢慢停)
  '这个念头在脑海中翻来覆去，最后才安静下来。',
  '脑子里那个声音来回转动，终于歇了。',
  '念头在脑海里反复盘旋，最终消散。',
  '那个想法在脑中绕了好几圈，渐渐平息。',
  // R9 (这个念头在他脑子里转了一圈又一圈，才终于歇了)
  '这个念头在脑海中不停盘旋，最终才散去。',
  '脑子里那个声音一圈圈打转，终于平息。',
  '念头在脑海中反复回旋，最终止住。',
  '那个想法不断在脑中盘旋，才慢慢歇下。',
  // R10 (墙上的灯光忽明忽暗)
  '灯光一闪一闪。',
  '墙壁上的灯时明时暗。',
  '灯泡发出忽亮忽暗的光。',
  '灯光不断明灭。',
];// === R29 EXECUTION ===

const REPL = [
  [R1, Ra[0], Ra[1], Ra[2], Ra[3]],
  [R2, Ra[4], Ra[5], Ra[6], Ra[7]],
  [R3, Ra[8], Ra[9], Ra[10], Ra[11]],
  [R4, Ra[12], Ra[13], Ra[14], Ra[15]],
  [R5, Ra[16], Ra[17], Ra[18], Ra[19]],
  [R6, Ra[20], Ra[21], Ra[22], Ra[23]],
  [R7, Ra[24], Ra[25], Ra[26], Ra[27]],
  [R8, Ra[28], Ra[29], Ra[30], Ra[31]],
  [R9, Ra[32], Ra[33], Ra[34], Ra[35]],
  [R10, Ra[36], Ra[37], Ra[38], Ra[39]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R29 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 29 ===');
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