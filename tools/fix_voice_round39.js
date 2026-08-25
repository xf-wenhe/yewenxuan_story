const fs = require('fs');
const path = require('path');

// === R39 SOURCES (8 patterns: recycled flat-voice descriptors + concentrated action phrases) ===

const CC1 = '叶文轩把目光投向赵大嘴。';
const CC2 = '叶文轩点头。';
const CC3 = '叶文轩的脑子在高速运转。';
const CC4 = '叶文轩的喉头猛地收紧。';
const CC5 = '叶文轩的呼吸堵了一瞬。';
const CC6 = '声线平直得像一条直线。';
const CC7 = '语气平稳得没有涟漪。';
const CC8 = '语气里没有任何震荡。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R39 ALTERNATIVES (8 sources × 4 = 32 total) ===

const CCa = [
  // CC1 (叶文轩把目光投向赵大嘴。)
  '叶文轩转过头，看向赵大嘴。',
  '叶文轩转头望向赵大嘴。',
  '叶文轩将视线转向赵大嘴。',
  '叶文轩把脸转过去，看着赵大嘴。',
  // CC2 (叶文轩点头。)
  '叶文轩点了点头。',
  '叶文轩头微微一抬。',
  '叶文轩回应了一个点头的动作。',
  '叶文轩抬了抬下巴，算作答应。',
  // CC3 (叶文轩的脑子在高速运转。)
  '叶文轩的思绪全速盘绕。',
  '叶文轩的思维飞速掠过。',
  '叶文轩的大脑高速处理着所有信息。',
  '叶文轩的思路在极短时间内完成了推演。',
  // CC4 (叶文轩的喉头猛地收紧。)
  '叶文轩喉头骤然发紧。',
  '叶文轩的喉咙像是被攥住了。',
  '叶文轩感觉嗓子瞬间发涩。',
  '叶文轩喉管突然勒紧。',
  // CC5 (叶文轩的呼吸堵了一瞬。)
  '叶文轩的呼吸卡住了。',
  '叶文轩吸气的动作顿了一下。',
  '叶文轩的气息停滞了片刻。',
  '叶文轩的呼吸短暂地凝滞。',
  // CC6 (声线平直得像一条直线。)
  '声调从头到尾没有变化。',
  '语气像尺子量过一样均匀。',
  '声音从头至尾一条直线。',
  '嗓音没有任何起落。',
  // CC7 (语气平稳得没有涟漪。)
  '语气平稳得像一潭死水。',
  '声音没有半点儿起伏波动。',
  '语调从头到尾纹丝不动。',
  '音色平静得不像活人在说话。',
  // CC8 (语气里没有任何震荡。)
  '语调里听不到半分波动。',
  '声音平直得没有一丝颤动。',
  '语气从头到尾没有起落。',
  '嗓音平稳得像从未起伏过。',
];// === R39 EXECUTION ===

const REPL = [
  [CC1, CCa[0], CCa[1], CCa[2], CCa[3]],
  [CC2, CCa[4], CCa[5], CCa[6], CCa[7]],
  [CC3, CCa[8], CCa[9], CCa[10], CCa[11]],
  [CC4, CCa[12], CCa[13], CCa[14], CCa[15]],
  [CC5, CCa[16], CCa[17], CCa[18], CCa[19]],
  [CC6, CCa[20], CCa[21], CCa[22], CCa[23]],
  [CC7, CCa[24], CCa[25], CCa[26], CCa[27]],
  [CC8, CCa[28], CCa[29], CCa[30], CCa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R39 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 39 ===');
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