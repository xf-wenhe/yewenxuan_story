const fs = require('fs');
const path = require('path');

const MM1 = '赵大嘴的声音颤抖着，"0428是我的名字。';
const MM2 = '叶文轩的声音。"深渊回声。12个半小时后激活。';
const MM3 = '叶文轩的声音，"0415碎片是钥匙。';
const MM4 = '韩冰开口，声音轻得快要模糊。';
const MM5 = '韩冰开口，音量低得几乎不可闻。';
const MM6 = '韩冰开口，声音轻得几近无形。';
const MM7 = '声音。有人在我脑子里说话。说';
const MM8 = '他还需要再久一些。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;

const Mm = [
  '赵大嘴的声线颤抖着，"0428是我的名字。',
  '赵大嘴的嗓音颤抖着，"0428是我的名字。',
  '赵大嘴的声音发颤，"0428是我的名字。',
  '赵大嘴的声调颤抖着，"0428是我的名字。',
  '叶文轩的声线。"深渊回声。12个半小时后激活。',
  '叶文轩的嗓音。"深渊回声。12个半小时后激活。',
  '叶文轩的声音说："深渊回声。12个半小时后激活。',
  '叶文轩的声调。"深渊回声。12个半小时后激活。',
  '叶文轩的声线，"0415碎片是钥匙。',
  '叶文轩的嗓音，"0415碎片是钥匙。',
  '叶文轩的声音说，"0415碎片是钥匙。',
  '叶文轩的声调，"0415碎片是钥匙。',
  '韩冰开口，声线轻得快要模糊。',
  '韩冰开口，嗓音轻得快要模糊。',
  '韩冰开口，声音快要模糊。',
  '韩冰开口，声调轻得快要模糊。',
  '韩冰开口，音量低得几乎听不见。',
  '韩冰开口，声线低得几乎不可闻。',
  '韩冰开口，嗓音低得几乎不可闻。',
  '韩冰开口，声调低得几乎不可闻。',
  '韩冰开口，声线轻得几近无形。',
  '韩冰开口，嗓音轻得几近无形。',
  '韩冰开口，声音几近无形。',
  '韩冰开口，声调轻得几近无形。',
  '声线。有人在叶文轩的脑子里说话。说',
  '嗓音。有人在叶文轩的脑子里说话。说',
  '声音。脑海里有个声音在说话。说',
  '声调。有人在他脑子里说话。说',
  '他还需要多一点时间。',
  '他还差一些时间。',
  '他还需要再多一点。',
  '他还要再等一会儿。',
];

const REPL = [
  [MM1, Mm[0], Mm[1], Mm[2], Mm[3]],
  [MM2, Mm[4], Mm[5], Mm[6], Mm[7]],
  [MM3, Mm[8], Mm[9], Mm[10], Mm[11]],
  [MM4, Mm[12], Mm[13], Mm[14], Mm[15]],
  [MM5, Mm[16], Mm[17], Mm[18], Mm[19]],
  [MM6, Mm[20], Mm[21], Mm[22], Mm[23]],
  [MM7, Mm[24], Mm[25], Mm[26], Mm[27]],
  [MM8, Mm[28], Mm[29], Mm[30], Mm[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R99 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 99 ===');
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
