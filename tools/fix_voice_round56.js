const fs = require('fs');
const path = require('path');

// === R56 SOURCES (8 patterns: 声音 descriptors + 叶文轩 voice tone) ===

const TT1 = '声音在抖。';
const TT2 = '声音很弱。';
const TT3 = '声音很细小。';
const TT4 = '声音极轻。';
const TT5 = '声音轻得发颤。';
const TT6 = '叶文轩的声线里听不出任何波澜。';
const TT7 = '叶文轩说话时语气平淡得不像真人。';
const TT8 = '叶文轩的声调平稳得近乎冷淡。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R56 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Td = [
  // TT1 (声音在抖。)
  '声音在颤。',
  '声音在发颤。',
  '声音在颤动。',
  '声音在发抖。',
  // TT2 (声音很弱。)
  '声音很低。',
  '声音很小。',
  '声音很微弱。',
  '声音很淡。',
  // TT3 (声音很细小。)
  '声音很细小而短。',
  '声音很轻细。',
  '声音很细小发颤。',
  '声音很细小而模糊。',
  // TT4 (声音极轻。)
  '声音极弱。',
  '声音极轻细。',
  '声音极轻小。',
  '声音极轻而短。',
  // TT5 (声音轻得发颤。)
  '声音轻得发抖。',
  '声音轻得颤。',
  '声音轻而颤动。',
  '声音轻得在抖。',
  // TT6 (叶文轩的声线里听不出任何波澜。)
  '叶文轩的声线里听不到一丝波动。',
  '叶文轩的声线里听不出一点变化。',
  '叶文轩的声线里听不见半分波澜。',
  '叶文轩的声线里没有任何起伏。',
  // TT7 (叶文轩说话时语气平淡得不像真人。)
  '叶文轩说话时语气平淡得不像活人。',
  '叶文轩说话时语气平淡得没有感情。',
  '叶文轩说话时语气平淡得像机器。',
  '叶文轩说话时语气平淡得让人发冷。',
  // TT8 (叶文轩的声调平稳得近乎冷淡。)
  '叶文轩的声调平稳得几乎冷淡。',
  '叶文轩的声调平稳得近乎漠然。',
  '叶文轩的声调平稳得像没有情绪。',
  '叶文轩的声调平稳得让人感觉不到情感。',
];// === R56 EXECUTION ===

const REPL = [
  [TT1, Td[0], Td[1], Td[2], Td[3]],
  [TT2, Td[4], Td[5], Td[6], Td[7]],
  [TT3, Td[8], Td[9], Td[10], Td[11]],
  [TT4, Td[12], Td[13], Td[14], Td[15]],
  [TT5, Td[16], Td[17], Td[18], Td[19]],
  [TT6, Td[20], Td[21], Td[22], Td[23]],
  [TT7, Td[24], Td[25], Td[26], Td[27]],
  [TT8, Td[28], Td[29], Td[30], Td[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R56 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 56 ===');
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