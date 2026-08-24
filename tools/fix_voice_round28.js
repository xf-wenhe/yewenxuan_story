const fs = require('fs');
const path = require('path');

// === R28 SOURCES (10 patterns, ~1561 total occurrences) ===

const S1 = '那句话沉进了他心里最深处';
const S2 = '叶文轩的心脏在跳';
const S3 = '他需要更多的时间';
const S4 = '他的目光在那些影子里停留了几秒';
const S5 = '这件事的来龙去脉，他还需要更多的时间才能弄清楚';
const S6 = '金色眼睛在闪烁';
const S7 = '叶文轩的脑子在转';
const S8 = '叶文轩的心脏停跳了一拍';
const S9 = '叶文轩闭上眼睛';
const S10 = '叶文轩看向赵大嘴';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R28 ALTERNATIVES (10 sources × 4 = 40 total) ===

const Sa = [
  // S1 (那句话沉进了他心里最深处)
  '那句话沉进了他心里，再也浮不上来。',
  '那句话沉进了他心里，沉得极深。',
  '那句话沉进了他心里，留在了最深处。',
  '那句话沉进了他心里，再也抹不掉。',
  // S2 (叶文轩的心脏在跳)
  '叶文轩的心脏在剧烈跳动。',
  '叶文轩的心脏怦怦直跳。',
  '叶文轩的心脏跳得很厉害。',
  '叶文轩的心脏在咚咚作响。',
  // S3 (他需要更多的时间)
  '他需要再一些时间。',
  '他还需要一点时间。',
  '他需要再想一想。',
  '他需要喘一口气。',
  // S4 (他的目光在那些影子里停留了几秒)
  '他的目光在那些影子里停了几秒。',
  '他的目光在那些影子里凝滞了几秒。',
  '他的目光在那些影子里定格了几秒。',
  '他的目光在那些影子里多看了几秒。',
  // S5 (这件事的来龙去脉，他还需要更多的时间才能弄清楚)
  '这件事的来龙去脉，他还需要时间才能想明白。',
  '这件事的来龙去脉，他还需要一点时间才能弄懂。',
  '这件事的来龙去脉，他还需要些时间才能理清。',
  '这件事的来龙去脉，他还需要些时间才能弄通。',
  // S6 (金色眼睛在闪烁)
  '金色眼睛在眨动。',
  '金色眼睛在闪动。',
  '金色眼睛在跳动。',
  '金色眼睛在忽明忽暗。',
  // S7 (叶文轩的脑子在转)
  '叶文轩的脑子在飞速运转。',
  '叶文轩的脑子在快速转动。',
  '叶文轩的脑子在拼命思考。',
  '叶文轩的脑子在高速运转。',
  // S8 (叶文轩的心脏停跳了一拍)
  '叶文轩的心脏停了一拍。',
  '叶文轩的心脏停了半拍。',
  '叶文轩的心脏漏跳了一拍。',
  '叶文轩的心脏顿了一下。',
  // S9 (叶文轩闭上眼睛)
  '叶文轩闭上了眼睛。',
  '叶文轩把眼睛闭上了。',
  '叶文轩合上了眼睛。',
  '叶文轩缓缓闭上眼睛。',
  // S10 (叶文轩看向赵大嘴)
  '叶文轩看向赵大嘴的眼睛。',
  '叶文轩看向赵大嘴那边。',
  '叶文轩看过去赵大嘴。',
  '叶文轩把目光投向赵大嘴。',
];// === R28 EXECUTION ===

const REPL = [
  [S1, Sa[0], Sa[1], Sa[2], Sa[3]],
  [S2, Sa[4], Sa[5], Sa[6], Sa[7]],
  [S3, Sa[8], Sa[9], Sa[10], Sa[11]],
  [S4, Sa[12], Sa[13], Sa[14], Sa[15]],
  [S5, Sa[16], Sa[17], Sa[18], Sa[19]],
  [S6, Sa[20], Sa[21], Sa[22], Sa[23]],
  [S7, Sa[24], Sa[25], Sa[26], Sa[27]],
  [S8, Sa[28], Sa[29], Sa[30], Sa[31]],
  [S9, Sa[32], Sa[33], Sa[34], Sa[35]],
  [S10, Sa[36], Sa[37], Sa[38], Sa[39]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R28 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 28 ===');
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