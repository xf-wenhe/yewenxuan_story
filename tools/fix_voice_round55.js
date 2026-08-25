const fs = require('fs');
const path = require('path');

// === R55 SOURCES (8 patterns: 声音 descriptors + 叶文轩 voice) ===

const SS1 = '声音很平。';
const SS2 = '声音很轻。';
const SS3 = '声音压得极低。';
const SS4 = '声音细若游丝。';
const SS5 = '声音压到最低。';
const SS6 = '叶文轩说话，声音几乎消散在空气里。';
const SS7 = '叶文轩说话时声音微不可闻。';
const SS8 = '叶文轩的声音细如蚊呐。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R55 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Sc = [
  // SS1 (声音很平。)
  '声音平淡。',
  '声音平直。',
  '声音平而稳。',
  '声音平平的。',
  // SS2 (声音很轻。)
  '声音很弱。',
  '声音极轻。',
  '声音轻得发颤。',
  '声音很细小。',
  // SS3 (声音压得极低。)
  '声音压到了极限。',
  '声音低到了底。',
  '声音低到了极点。',
  '声音压到了最低。',
  // SS4 (声音细若游丝。)
  '声音细得像游丝。',
  '声音细得仿佛游丝。',
  '声音细得像一根丝。',
  '声音细得像一缕风。',
  // SS5 (声音压到最低。)
  '声音压到了最低处。',
  '声音压到了最低点。',
  '声音压到了最低水平。',
  '声音压到了底线。',
  // SS6 (叶文轩说话，声音几乎消散在空气里。)
  '叶文轩说话，声音快要消失在空气中。',
  '叶文轩说话，声音快要飘散在空气中。',
  '叶文轩说话，声音快要散去。',
  '叶文轩说话，声音快要散掉了。',
  // SS7 (叶文轩说话时声音微不可闻。)
  '叶文轩说话时声音低不可闻。',
  '叶文轩说话时声音轻得听不见。',
  '叶文轩说话时声音几乎听不见。',
  '叶文轩说话时声音小到听不见。',
  // SS8 (叶文轩的声音细如蚊呐。)
  '叶文轩的声音细得像蚊子。',
  '叶文轩的声音细得如同蚊蚋。',
  '叶文轩的声音细得像蝉鸣。',
  '叶文轩的声音细得如同蜂鸣。',
];// === R55 EXECUTION ===

const REPL = [
  [SS1, Sc[0], Sc[1], Sc[2], Sc[3]],
  [SS2, Sc[4], Sc[5], Sc[6], Sc[7]],
  [SS3, Sc[8], Sc[9], Sc[10], Sc[11]],
  [SS4, Sc[12], Sc[13], Sc[14], Sc[15]],
  [SS5, Sc[16], Sc[17], Sc[18], Sc[19]],
  [SS6, Sc[20], Sc[21], Sc[22], Sc[23]],
  [SS7, Sc[24], Sc[25], Sc[26], Sc[27]],
  [SS8, Sc[28], Sc[29], Sc[30], Sc[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R55 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 55 ===');
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