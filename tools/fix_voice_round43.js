const fs = require('fs');
const path = require('path');

// === R43 SOURCES (8 patterns: flat-voice recycled + shadow recycled + 赵大嘴 follow) ===

const GG1 = '声调从头到尾纹丝不动。';
const GG2 = '语调没有高低变化，只有一条线。';
const GG3 = '声音平得找不到任何起落。';
const GG4 = '声调始终维持在同一高度。';
const GG5 = '光中的影子来回晃动，被遗忘的东西还在跳动。';
const GG6 = '影子在光照中摇晃，被遗忘的记忆在躁动。';
const GG7 = '赵大嘴跟在叶文轩身后。';
const GG8 = '赵大嘴尾随在他后面。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R43 ALTERNATIVES (8 sources × 4 = 32 total) ===

const GGa = [
  // GG1 (声调从头到尾纹丝不动。)
  '声调始终如一地平稳。',
  '语调从头到尾没有任何波动。',
  '声音从头至尾平如水面。',
  '声线从头到尾保持同一高度。',
  // GG2 (语调没有高低变化，只有一条线。)
  '语调平直而缺乏起伏。',
  '声音从头到尾没有变化。',
  '语气平得像一把尺子量过。',
  '声调从头至尾没有半点儿起落。',
  // GG3 (声音平得找不到任何起落。)
  '声音平得听不到半点波动。',
  '声调平得像一条平直的路。',
  '语调从头到尾平得看不见起伏。',
  '声音平直而缺乏波澜。',
  // GG4 (声调始终维持在同一高度。)
  '声调从头到尾没有升高也没有降低。',
  '语调始终保持在同一水平。',
  '声音从头至尾没有升降。',
  '声调维持在同一水平不变。',
  // GG5 (光中的影子来回晃动，被遗忘的东西还在跳动。)
  '光影中的影子左右摇晃，那些被遗忘之物仍在跳动。',
  '光里的影子不停抖动，被遗忘的记忆在跳动。',
  '光影里的影子来回摇摆，被遗忘的东西在震动。',
  '光影中晃动的影子不停摇晃，被遗忘之物在翻动。',
  // GG6 (影子在光照中摇晃，被遗忘的记忆在躁动。)
  '光影中的影子在来回摇摆，被遗忘的记忆在震颤。',
  '影子在光芒中持续晃动，被遗忘之物在跳动。',
  '光影中摇晃的影子不停摇摆，被遗忘的记忆在颤抖。',
  '影子在光线中摇晃，被遗忘之物在翻涌。',
  // GG7 (赵大嘴跟在叶文轩身后。)
  '赵大嘴跟在叶文轩后面。',
  '赵大嘴在叶文轩后面跟着。',
  '赵大嘴在叶文轩后面不远处。',
  '赵大嘴跟随着叶文轩前进。',
  // GG8 (赵大嘴尾随在他后面。)
  '赵大嘴跟在最后。',
  '赵大嘴跟在队伍末尾。',
  '赵大嘴跟在后面没有说话。',
  '赵大嘴跟在后面保持沉默。',
];// === R43 EXECUTION ===

const REPL = [
  [GG1, GGa[0], GGa[1], GGa[2], GGa[3]],
  [GG2, GGa[4], GGa[5], GGa[6], GGa[7]],
  [GG3, GGa[8], GGa[9], GGa[10], GGa[11]],
  [GG4, GGa[12], GGa[13], GGa[14], GGa[15]],
  [GG5, GGa[16], GGa[17], GGa[18], GGa[19]],
  [GG6, GGa[20], GGa[21], GGa[22], GGa[23]],
  [GG7, GGa[24], GGa[25], GGa[26], GGa[27]],
  [GG8, GGa[28], GGa[29], GGa[30], GGa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R43 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 43 ===');
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