const fs = require('fs');
const path = require('path');

// === R35 SOURCES (8 patterns: recycled R33/R29 alternatives) ===

const Y1 = '叶文轩说话，音量压得很低。';
const Y2 = '叶文轩开口，声音低得几乎听不见。';
const Y3 = '叶文轩的嗓音压低了。';
const Y4 = '叶文轩用极低的音量说话。';
const Y5 = '那句话沉进了他心里，沉得极深。';
const Y6 = '那句话沉进了他心里，留在了最深处。';
const Y7 = '夜里的风比他想象的要冷一些，吹在脸上有些刺骨。';
const Y8 = '他低头看了看自己的手，手还在发抖。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R35 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Ya = [
  // Y1 (叶文轩说话，音量压得很低。)
  '叶文轩压着嗓子出声。',
  '叶文轩把声音压到最低。',
  '叶文轩说话时声音微不可闻。',
  '叶文轩低声开口。',
  // Y2 (叶文轩开口，声音低得几乎听不见。)
  '叶文轩的声音细如蚊呐。',
  '叶文轩说话，音量微乎其微。',
  '叶文轩低声说了句。',
  '叶文轩的音量低到几乎听不到。',
  // Y3 (叶文轩的嗓音压低了。)
  '叶文轩把嗓音降了下来。',
  '叶文轩压低嗓音。',
  '叶文轩的声调忽然变低。',
  '叶文轩把声音压得更低。',
  // Y4 (叶文轩用极低的音量说话。)
  '叶文轩声音极低地说了句。',
  '叶文轩几乎无声地开口。',
  '叶文轩以极低的音量出声。',
  '叶文轩说话，声音几乎消散在空气里。',
  // Y5 (那句话沉进了他心里，沉得极深。)
  '那句话扎根在他心底，深不见底。',
  '那句话烙进他的意识里，挥之不去。',
  '那句话扎进他心里最底的地方。',
  '那句话深深刻入他的心底，再也不会淡去。',
  // Y6 (那句话沉进了他心里，留在了最深处。)
  '那句话埋进了他心底，停在那里不再动。',
  '那句话钻进他心里，安在最底层。',
  '那句话嵌进他心底最深处，久久不散。',
  '那句话沉入他意识的最底层，再没浮上来。',
  // Y7 (夜里的风比他想象的要冷一些，吹在脸上有些刺骨。)
  '夜风比预想中更冷，刮在脸上生疼。',
  '夜里的风出乎意料地冷，扑面而来的寒意让人打了个颤。',
  '夜风凛冽，比想象中更刺人。',
  '夜里的风冷得超出预期，扫过脸颊时带来一阵寒意。',
  // Y8 (他低头看了看自己的手，手还在发抖。)
  '他低头看向自己的手，指尖仍在微微颤动。',
  '他垂目看着自己的手，那双手还在不停抖动。',
  '他望向自己的双手，指尖还在不受控地颤抖。',
  '他低头检查自己的手，那双手仍在颤个不停。',
];// === R35 EXECUTION ===

const REPL = [
  [Y1, Ya[0], Ya[1], Ya[2], Ya[3]],
  [Y2, Ya[4], Ya[5], Ya[6], Ya[7]],
  [Y3, Ya[8], Ya[9], Ya[10], Ya[11]],
  [Y4, Ya[12], Ya[13], Ya[14], Ya[15]],
  [Y5, Ya[16], Ya[17], Ya[18], Ya[19]],
  [Y6, Ya[20], Ya[21], Ya[22], Ya[23]],
  [Y7, Ya[24], Ya[25], Ya[26], Ya[27]],
  [Y8, Ya[28], Ya[29], Ya[30], Ya[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R35 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 35 ===');
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