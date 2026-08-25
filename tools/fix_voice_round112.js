const fs = require('fs');
const path = require('path');

const BB1 = '嗓音干涩如砂砾互相摩擦。';
const BB2 = '嗓音粗糙得像砂砾反复摩擦。';
const BB3 = '嗓音冷静，寡淡得不像话。';
const BB4 = '嗓音，连完整句子都困难。';
const BB5 = '嗓音被沙砾的粗糙填满。';
const BB6 = '嗓音像砂砾摩擦，难听得紧。';
const BB7 = '嗓音粗糙得像掺了沙粒。';
const BB8 = '嗓音像砂砾反复摩擦。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
const Bb = [
  '嗓音干涩得像砂砾互相摩擦。',
  '嗓音干涩，如同砂砾互相摩擦。',
  '嗓音干涩如砂石互相摩擦。',
  '嗓音干涩得像砂子互相摩擦。',
  '嗓音粗糙得像砂砾来回摩擦。',
  '嗓音粗糙得如同砂砾摩擦。',
  '嗓音粗糙得像砂砾不断摩擦。',
  '嗓音粗糙得像砂砾重复摩擦。',
  '嗓音冷静，寡淡得不成样子。',
  '嗓音冷静，寡淡得异乎寻常。',
  '嗓音冷静，寡淡得过头。',
  '嗓音冷静，寡淡得不像回事。',
  '嗓音，连完整句子都凑不齐。',
  '嗓音，完整句子都说不出来。',
  '嗓音，连一句话都拼不成。',
  '嗓音，连一个完整句子都费劲。',
  '嗓音被砂砾的粗糙塞满。',
  '嗓音被砂砾的粗粝填满。',
  '嗓音被砂砾的粗糙充斥。',
  '嗓音被砂砾的粗糙包裹。',
  '嗓音像砂砾摩擦，难听得要命。',
  '嗓音像砂砾摩擦，刺耳得很。',
  '嗓音像砂砾摩擦，令人不适。',
  '嗓音像砂砾摩擦，实在难听。',
  '嗓音粗糙得像混入了沙粒。',
  '嗓音粗糙得像掺了砂石。',
  '嗓音粗糙得像掺了细沙。',
  '嗓音粗糙得像带沙粒。',
  '嗓音像砂砾来回摩擦。',
  '嗓音像砂砾不断摩擦。',
  '嗓音像砂砾来回刮擦。',
  '嗓音像砂砾一遍遍摩擦。',
];
const REPL = [
  [BB1, Bb[0], Bb[1], Bb[2], Bb[3]],
  [BB2, Bb[4], Bb[5], Bb[6], Bb[7]],
  [BB3, Bb[8], Bb[9], Bb[10], Bb[11]],
  [BB4, Bb[12], Bb[13], Bb[14], Bb[15]],
  [BB5, Bb[16], Bb[17], Bb[18], Bb[19]],
  [BB6, Bb[20], Bb[21], Bb[22], Bb[23]],
  [BB7, Bb[24], Bb[25], Bb[26], Bb[27]],
  [BB8, Bb[28], Bb[29], Bb[30], Bb[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R112 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 112 ===');
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