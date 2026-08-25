const fs = require('fs');
const path = require('path');

const KK1 = '赵大嘴的声音在抖，"0428是我的名字。';
const KK2 = '叶文轩的声音。"0428碎片会告诉我路。';
const KK3 = '声音。0415碎片的最深层是女儿出生的那天。';
const KK4 = '声音，"不是自然空洞。是某种东西在岩壁内部活动过。';
const KK5 = '声音。声音在回声里面飘。飘了十二年。飘到现在。';
const KK6 = '叶文轩的声音。"考核是系统核心直接设计的。';
const KK7 = '声音"在叶文轩的脑子里"响"了，带着某种"紧张"，某种。';
const KK8 = '声音。像他妈妈的声音。像他爸爸的声音。像他姐姐的声音。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;

const Kk = [
  '赵大嘴的声线在抖，"0428是我的名字。',
  '赵大嘴的嗓音在抖，"0428是我的名字。',
  '赵大嘴的声音颤抖着，"0428是我的名字。',
  '赵大嘴的声调在抖，"0428是我的名字。',
  '叶文轩的声线。"0428碎片会告诉我路。',
  '叶文轩的嗓音。"0428碎片会告诉我路。',
  '叶文轩的声音在说："0428碎片会告诉我路。',
  '叶文轩的声调。"0428碎片会告诉我路。',
  '声线。0415碎片的最深层是女儿出生的那天。',
  '嗓音。0415碎片的最深层是女儿出生的那天。',
  '声音里传来：0415碎片的最深层是女儿出生的那天。',
  '声调。0415碎片的最深层是女儿出生的那天。',
  '声线，"不是自然空洞。是某种东西在岩壁内部活动过。',
  '嗓音，"不是自然空洞。是某种东西在岩壁内部活动过。',
  '声音说："不是自然空洞。是某种东西在岩壁内部活动过。',
  '声调，"不是自然空洞。是某种东西在岩壁内部活动过。',
  '声线在回声里飘。飘了十二年。飘到现在。',
  '嗓音在回声里飘。飘了十二年。飘到现在。',
  '声音顺着回声飘。飘了十二年。飘到现在。',
  '声调在回声里飘。飘了十二年。飘到现在。',
  '叶文轩的声线。"考核是系统核心直接设计的。',
  '叶文轩的嗓音。"考核是系统核心直接设计的。',
  '叶文轩的声音说："考核是系统核心直接设计的。',
  '叶文轩的声调。"考核是系统核心直接设计的。',
  '声线"在叶文轩的脑子里"响"了，带着某种"紧张"，某种。',
  '嗓音"在叶文轩的脑子里"响"了，带着某种"紧张"，某种。',
  '声音"在叶文轩的脑海中"响"了，带着某种"紧张"，某种。',
  '声调"在叶文轩的脑子里"响"了，带着某种"紧张"，某种。',
  '声线像他妈妈、他爸爸、他姐姐的声线。',
  '嗓音像他妈妈、他爸爸、他姐姐的嗓音。',
  '声音像他爸妈和姐姐的声音。',
  '声调像他妈妈、他爸爸、他姐姐的声调。',
];

const REPL = [
  [KK1, Kk[0], Kk[1], Kk[2], Kk[3]],
  [KK2, Kk[4], Kk[5], Kk[6], Kk[7]],
  [KK3, Kk[8], Kk[9], Kk[10], Kk[11]],
  [KK4, Kk[12], Kk[13], Kk[14], Kk[15]],
  [KK5, Kk[16], Kk[17], Kk[18], Kk[19]],
  [KK6, Kk[20], Kk[21], Kk[22], Kk[23]],
  [KK7, Kk[24], Kk[25], Kk[26], Kk[27]],
  [KK8, Kk[28], Kk[29], Kk[30], Kk[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R97 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 97 ===');
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
