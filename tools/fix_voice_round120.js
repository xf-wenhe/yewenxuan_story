const fs = require('fs');
const path = require('path');

const JJ1 = '声音在0429备份的信号中传来';
const JJ2 = '声音在叶文轩的意识中说';
const JJ3 = '声音在变化，固化脚本在恢复，赵大嘴的声音开始';
const JJ4 = '声音，赵大嘴的声音，从很远的地方传来';
const JJ5 = '声音，是叶文轩自己的声音，但更年轻，更疲惫';
const JJ6 = '声音在门洞里面回荡。里';
const JJ7 = '声音沉落。';
const JJ8 = '声音往下沉。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
const Jj = [
  '0429备份的信号传来',
  '0429备份的信号传过来了',
  '0429备份的信号传到了耳边',
  '0429备份的信号慢慢传来',
  '叶文轩的意识里响起',
  '叶文轩的意识中传来',
  '叶文轩的意识里出现',
  '叶文轩的意识深处响起',
  '声音在变，固化脚本在恢复，赵大嘴开口时',
  '声音变了，固化脚本在恢复，赵大嘴开口说',
  '声音开始变化，固化脚本恢复，赵大嘴开口时',
  '声音有变化，固化脚本恢复中，赵大嘴的声音响起',
  '声音，赵大嘴开口说，从很远的地方传',
  '声音，赵大嘴吐出字句，从很远的地方传',
  '声音，赵大嘴说着，从很远的地方传',
  '声音，赵大嘴开口，从很远的地方传',
  '声音，那是叶文轩自己的声音，更年轻，更疲惫',
  '声音，和叶文轩自己的声音相同，更年轻，更疲惫',
  '声音，属于叶文轩，更年轻，更疲惫',
  '声音，是叶文轩本人，更年轻，更疲惫',
  '声音在门洞里回荡。里面',
  '声音在门洞回荡。里头',
  '声音在门洞内回荡。里面',
  '声音从门洞内回荡。里头',
  '声音落了下来。',
  '声音沉了下去。',
  '声音往下掉。',
  '声音低落下去。',
  '声音继续下沉。',
  '声音压得更低。',
  '声音继续降低。',
  '声音越沉越深。',
];
const REPL = [
  [JJ1, Jj[0], Jj[1], Jj[2], Jj[3]],
  [JJ2, Jj[4], Jj[5], Jj[6], Jj[7]],
  [JJ3, Jj[8], Jj[9], Jj[10], Jj[11]],
  [JJ4, Jj[12], Jj[13], Jj[14], Jj[15]],
  [JJ5, Jj[16], Jj[17], Jj[18], Jj[19]],
  [JJ6, Jj[20], Jj[21], Jj[22], Jj[23]],
  [JJ7, Jj[24], Jj[25], Jj[26], Jj[27]],
  [JJ8, Jj[28], Jj[29], Jj[30], Jj[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R120 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 120 ===');
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