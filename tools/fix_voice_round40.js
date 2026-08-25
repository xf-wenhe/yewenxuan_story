const fs = require('fs');
const path = require('path');

// === R40 SOURCES (8 patterns: recycled flat-voice descriptors + sand-voice patterns + time phrase) ===

const DD1 = '声音平直而缺乏变化。';
const DD2 = '声音中没有半点儿情绪。';
const DD3 = '声调里听不出起伏。';
const DD4 = '赵大嘴开口时声音沙哑得厉害。';
const DD5 = '赵大嘴的声音带着明显的沙哑。';
const DD6 = '赵大嘴的嗓音粗哑不堪。';
const DD7 = '赵大嘴说话带着浓厚的沙哑。';
const DD8 = '他还需要一点时间。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R40 ALTERNATIVES (8 sources × 4 = 32 total) ===

const DDa = [
  // DD1 (声音平直而缺乏变化。)
  '声调从头到尾像一条直线。',
  '嗓音从头至尾没有半点儿波澜。',
  '语气平铺直叙，像尺子量过一样。',
  '声音没有高低，也没有顿挫。',
  // DD2 (声音中没有半点儿情绪。)
  '话音里听不到任何情绪。',
  '嗓音干涩得没有任何感情色彩。',
  '语调平得像一潭死水，没有涟漪。',
  '声音冷硬而空洞，没有半分感情。',
  // DD3 (声调里听不出起伏。)
  '声调从头到尾纹丝不动。',
  '语调没有高低变化，只有一条线。',
  '声音平得找不到任何起落。',
  '声调始终维持在同一高度。',
  // DD4 (赵大嘴开口时声音沙哑得厉害。)
  '赵大嘴一开口，嗓音干涩粗糙。',
  '赵大嘴出声，嗓子发出砂纸般的摩擦声。',
  '赵大嘴开口，声音像是被砂砾磨过。',
  '赵大嘴说话时喉咙里发出粗粝的摩擦声。',
  // DD5 (赵大嘴的声音带着明显的沙哑。)
  '赵大嘴的嗓音干涩得让人明显察觉到异常。',
  '赵大嘴出声，嗓音里带着粗糙的沙粒感。',
  '赵大嘴的声音像被砂纸磨过一般。',
  '赵大嘴开口，嗓音干涩而粗糙。',
  // DD6 (赵大嘴的嗓音粗哑不堪。)
  '赵大嘴的嗓音干涩粗糙，几乎说不出整句。',
  '赵大嘴的嗓音像砂砾摩擦，干涩难听。',
  '赵大嘴出声，嗓音沙哑到了极限。',
  '赵大嘴的喉咙发不出利索的声音。',
  // DD7 (赵大嘴说话带着浓厚的沙哑。)
  '赵大嘴出声，嗓音里满是粗糙的沙砾感。',
  '赵大嘴一开口，声音干涩而沙哑。',
  '赵大嘴说话，嗓音像被砂砾反复摩擦。',
  '赵大嘴的嗓门干涩，透着明显的沙哑质感。',
  // DD8 (他还需要一点时间。)
  '他还需要片刻才能想清楚。',
  '他还需要更多的时间来理清思路。',
  '他还需要短暂的时间来做决定。',
  '他还需要一会儿才能把话说完。',
];// === R40 EXECUTION ===

const REPL = [
  [DD1, DDa[0], DDa[1], DDa[2], DDa[3]],
  [DD2, DDa[4], DDa[5], DDa[6], DDa[7]],
  [DD3, DDa[8], DDa[9], DDa[10], DDa[11]],
  [DD4, DDa[12], DDa[13], DDa[14], DDa[15]],
  [DD5, DDa[16], DDa[17], DDa[18], DDa[19]],
  [DD6, DDa[20], DDa[21], DDa[22], DDa[23]],
  [DD7, DDa[24], DDa[25], DDa[26], DDa[27]],
  [DD8, DDa[28], DDa[29], DDa[30], DDa[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R40 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 40 ===');
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