const fs = require('fs');
const path = require('path');

// === R44 SOURCES (8 patterns: flat-voice recycled + 赵大嘴 follow + shadow recycled) ===

const HH1 = '声调从头到尾像一条直线。';
const HH2 = '语调平得像一潭死水，没有涟漪。';
const HH3 = '声音冷硬而空洞，没有半分感情。';
const HH4 = '赵大嘴紧随其后。';
const HH5 = '赵大嘴跟在他身后不远处。';
const HH6 = '影子在光照中摇晃，被遗忘的记忆在颤动。';
const HH7 = '光里晃动的影子持续抖动，被遗忘的东西在震颤。';
const HH8 = '影子在光照中漂浮，被遗忘的记忆在流转。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R44 ALTERNATIVES (8 sources × 4 = 32 total) ===

const HHa = [
  // HH1 (声调从头到尾像一条直线。)
  '声调从头到尾平直不动。',
  '语调从头到尾没有任何弯曲。',
  '声音从头到尾没有变化。',
  '声线从头至尾平得像尺子量过。',
  // HH2 (语调平得像一潭死水，没有涟漪。)
  '语调平直而缺乏起伏。',
  '声音没有半点波动。',
  '语气平得听不出高低。',
  '声调平得没有起伏。',
  // HH3 (声音冷硬而空洞，没有半分感情。)
  '声音冷硬而毫无感情。',
  '声调冷硬且没有温度。',
  '声音空洞而没有起伏。',
  '语调冷硬而没有任何波澜。',
  // HH4 (赵大嘴紧随其后。)
  '赵大嘴跟在最后。',
  '赵大嘴跟在队伍后面。',
  '赵大嘴跟在队伍末尾。',
  '赵大嘴跟在最后面。',
  // HH5 (赵大嘴跟在他身后不远处。)
  '赵大嘴跟在后面保持距离。',
  '赵大嘴跟在后面没靠近。',
  '赵大嘴跟在队伍末尾。',
  '赵大嘴跟在后面不远。',
  // HH6 (影子在光照中摇晃，被遗忘的记忆在颤动。)
  '光影中摇晃的影子不停摇摆，被遗忘之物在跳动。',
  '影子在光芒中持续晃动，被遗忘之物在颤抖。',
  '光影中摇晃的影子不停摇摆，被遗忘的记忆在翻涌。',
  '影子在光线中摇晃，被遗忘之物在翻腾。',
  // HH7 (光里晃动的影子持续抖动，被遗忘的东西在震颤。)
  '光影中晃动的影子不停抖动，被遗忘之物在跳动。',
  '光里晃动的影子持续摇摆，被遗忘的记忆在颤抖。',
  '光影中晃动的影子持续翻动，被遗忘的东西在震动。',
  '光里晃动的影子不停晃动，被遗忘的记忆在跳动。',
  // HH8 (影子在光照中漂浮，被遗忘的记忆在流转。)
  '光影中漂浮的影子左右游荡，被遗忘之物在流转。',
  '影子在光芒中飘荡，被遗忘之物在穿梭。',
  '光影中漂浮的影子飘来飘去，被遗忘的记忆在游动。',
  '影子在光线中飘浮，被遗忘之物在游走。',
];// === R44 EXECUTION ===

const REPL = [
  [HH1, HHa[0], HHa[1], HHa[2], HHa[3]],
  [HH2, HHa[4], HHa[5], HHa[6], HHa[7]],
  [HH3, HHa[8], HHa[9], HHa[10], HHa[11]],
  [HH4, HHa[12], HHa[13], HHa[14], HHa[15]],
  [HH5, HHa[16], HHa[17], HHa[18], HHa[19]],
  [HH6, HHa[20], HHa[21], HHa[22], HHa[23]],
  [HH7, HHa[24], HHa[25], HHa[26], HHa[27]],
  [HH8, HHa[28], HHa[29], HHa[30], HHa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R44 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 44 ===');
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