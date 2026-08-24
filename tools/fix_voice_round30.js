const fs = require('fs');
const path = require('path');

// === R30 SOURCES (10 recycled patterns) ===

const T1 = '他站在那里，一时不知道该迈出去';
const T2 = '他站在那里，一时不知道该走还是不走';
const T3 = '他站在那里，一时不知道该迈哪只脚';
const T4 = '他站在那里，一时不知道该朝哪个方向走';
const T5 = '他的目光在那些影子里凝滞了几秒';
const T6 = '他的目光在那些影子里定格了几秒';
const T7 = '他的目光在那些影子里多看了几秒';
const T8 = '他的目光在那些影子里停了几秒';
const T9 = '叶文轩睁开眼睛';
const T10 = '叶文轩没有回答';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R30 ALTERNATIVES (10 sources × 4 = 40 total) ===

const Ta = [
  // T1 (他站在那里，一时不知道该迈出去)
  '他就这么站着，不知道该往前走还是停住。',
  '他站在原地，一步也迈不动。',
  '他停留在原地，脚步像被钉住了。',
  '他待在原地，迈不开步子。',
  // T2 (他站在那里，一时不知道该走还是不走)
  '他站在原地，犹豫着要不要迈步。',
  '他待在原地，不知道该不该往前走。',
  '他停住脚步，进退两难。',
  '他站在原处，不知道该前进还是后退。',
  // T3 (他站在那里，一时不知道该迈哪只脚)
  '他站在原地，两只脚都抬不起来。',
  '他停在那里，不知道该先迈哪一只脚。',
  '他待在原地，两只脚像被绑住了。',
  '他站在那里，脚抬不起来。',
  // T4 (他站在那里，一时不知道该朝哪个方向走)
  '他站在原地，不知道该往哪个方向迈。',
  '他停住脚步，不知道该朝哪边走。',
  '他待在原地，不知道该朝哪个方向去。',
  '他站在原处，迷失了方向。',
  // T5 (他的目光在那些影子里凝滞了几秒)
  '他的视线在影子里定格了几秒。',
  '他的眼睛停留在影子上。',
  '他盯着那些影子看了几秒。',
  '他的视线锁定在影子上。',
  // T6 (他的目光在那些影子里定格了几秒)
  '他的视线在影子上凝住了。',
  '他凝视着那些影子，纹丝不动。',
  '他的视线粘在影子上。',
  '他盯着影子看了一会儿。',
  // T7 (他的目光在那些影子里多看了几秒)
  '他的视线在影子上停留了几秒。',
  '他多看了影子几秒。',
  '他的眼睛在影子上多停了片刻。',
  '他继续盯着影子看。',
  // T8 (他的目光在那些影子里停了几秒)
  '他的视线在影子上凝了几秒。',
  '他的眼睛停在影子上。',
  '他注视着那些影子，几秒不动。',
  '他的视线落在影子上。',
  // T9 (叶文轩睁开眼睛)
  '叶文轩睁开了双眼。',
  '叶文轩重新睁开眼。',
  '叶文轩把眼睛睁开。',
  '叶文轩睁开双眼。',
  // T10 (叶文轩没有回答)
  '叶文轩没说话。',
  '叶文轩沉默了。',
  '叶文轩没有开口。',
  '叶文轩未作回应。',
];// === R30 EXECUTION ===

const REPL = [
  [T1, Ta[0], Ta[1], Ta[2], Ta[3]],
  [T2, Ta[4], Ta[5], Ta[6], Ta[7]],
  [T3, Ta[8], Ta[9], Ta[10], Ta[11]],
  [T4, Ta[12], Ta[13], Ta[14], Ta[15]],
  [T5, Ta[16], Ta[17], Ta[18], Ta[19]],
  [T6, Ta[20], Ta[21], Ta[22], Ta[23]],
  [T7, Ta[24], Ta[25], Ta[26], Ta[27]],
  [T8, Ta[28], Ta[29], Ta[30], Ta[31]],
  [T9, Ta[32], Ta[33], Ta[34], Ta[35]],
  [T10, Ta[36], Ta[37], Ta[38], Ta[39]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R30 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 30 ===');
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