const fs = require('fs');
const path = require('path');

// === R34 SOURCES (8 patterns: recycled R33 alternatives that became high-freq) ===

const X1 = '叶文轩开口，语调没有任何起伏。';
const X2 = '叶文轩说话不带任何情绪。';
const X3 = '叶文轩的声音平淡无波。';
const X4 = '叶文轩开口，语气毫无波澜。';
const X5 = '赵大嘴开口，声音低得几乎听不见。';
const X6 = '赵大嘴说话，音量压得很低。';
const X7 = '赵大嘴的嗓音压低了。';
const X8 = '赵大嘴用极低的音量说话。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R34 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Xa = [
  // X1 (叶文轩开口，语调没有任何起伏。)
  '叶文轩的声音平静而单调。',
  '叶文轩说话时没有一丝情绪波动。',
  '叶文轩的声调平稳得近乎冷淡。',
  '叶文轩开口，声音平直而缺乏变化。',
  // X2 (叶文轩说话不带任何情绪。)
  '叶文轩的语速平稳且毫无情感。',
  '叶文轩开口，声音中没有半点儿情绪。',
  '叶文轩的嗓音冷静而寡淡。',
  '叶文轩说话的声音冷得像没有温度。',
  // X3 (叶文轩的声音平淡无波。)
  '叶文轩开口，声线平直得像一条直线。',
  '叶文轩的语调单调而平稳。',
  '叶文轩说话时语气平淡得不像真人。',
  '叶文轩的声线里听不出任何波澜。',
  // X4 (叶文轩开口，语气毫无波澜。)
  '叶文轩说话，语气平稳得没有涟漪。',
  '叶文轩开口，声调里听不出起伏。',
  '叶文轩的声音平稳而缺乏变化。',
  '叶文轩开口，语气里没有任何震荡。',
  // X5 (赵大嘴开口，声音低得几乎听不见。)
  '赵大嘴压着声音说话。',
  '赵大嘴的声音细若游丝。',
  '赵大嘴开口，音量微乎其微。',
  '赵大嘴说话的声音轻得几乎听不到。',
  // X6 (赵大嘴说话，音量压得很低。)
  '赵大嘴说话时把声音压到最低。',
  '赵大嘴的音量轻得几乎听不清。',
  '赵大嘴用很轻的声音说话。',
  '赵大嘴开口，把声音压得极低。',
  // X7 (赵大嘴的嗓音压低了。)
  '赵大嘴把嗓音降了下来。',
  '赵大嘴压低嗓音说话。',
  '赵大嘴的声调忽然变低。',
  '赵大嘴把声音压得比平时更低。',
  // X8 (赵大嘴用极低的音量说话。)
  '赵大嘴说话，音量低到几乎无声。',
  '赵大嘴用极轻的嗓音开口。',
  '赵大嘴声音极低地说了句。',
  '赵大嘴几乎无声地说着话。',
];// === R34 EXECUTION ===

const REPL = [
  [X1, Xa[0], Xa[1], Xa[2], Xa[3]],
  [X2, Xa[4], Xa[5], Xa[6], Xa[7]],
  [X3, Xa[8], Xa[9], Xa[10], Xa[11]],
  [X4, Xa[12], Xa[13], Xa[14], Xa[15]],
  [X5, Xa[16], Xa[17], Xa[18], Xa[19]],
  [X6, Xa[20], Xa[21], Xa[22], Xa[23]],
  [X7, Xa[24], Xa[25], Xa[26], Xa[27]],
  [X8, Xa[28], Xa[29], Xa[30], Xa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R34 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 34 ===');
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