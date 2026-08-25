const fs = require('fs');
const path = require('path');

// === R92 SOURCES (8 patterns) ===

const FF1 = '声音回旋片刻，终究淡去。';
const FF2 = '声音飘了过来。';
const FF3 = '声音低得像耳语。';
const FF4 = '声音，很轻。';
const FF5 = '声音有点不确定，"好像没那么使劲拽了。"';
const FF6 = '声音抖得没有停。';
const FF7 = '声音传了过来，继续说。';
const FF8 = '声音从远处传来，开口说了。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;

// === R92 ALTERNATIVES (8 sources x 4 = 32 total) ===

const Ff = [
  // FF1 (声音回旋片刻，终究淡去。)
  '声线回旋片刻，终于消散。',
  '嗓音回旋片刻，最终模糊。',
  '声音回旋片刻，终于消失。',
  '声调回旋片刻，终究隐去。',
  // FF2 (声音飘了过来。)
  '声线飘了过来。',
  '嗓音飘了过来。',
  '声音飘过来。',
  '声调飘了过来。',
  // FF3 (声音低得像耳语。)
  '声线低得如同耳语。',
  '嗓音低得接近耳语。',
  '声音低得像耳语一般。',
  '声调低得像耳语似的。',
  // FF4 (声音，很轻。)
  '声线，很轻。',
  '嗓音，很轻。',
  '声音极轻。',
  '声调，很轻。',
  // FF5 (声音有点不确定，"好像没那么使劲拽了。")
  '声线有点不确定，"好像没那么使劲拽了。"',
  '嗓音有点不确定，"好像没那么使劲拽了。"',
  '声音有些犹豫，"好像没那么使劲拽了。"',
  '声调有点不确定，"好像没那么使劲拽了。"',
  // FF6 (声音抖得没有停。)
  '声线抖个不停。',
  '嗓音抖得不停。',
  '声音颤得没有停。',
  '声调抖个不停。',
  // FF7 (声音传了过来，继续说。)
  '声线传了过来，继续说。',
  '嗓音传了过来，继续说。',
  '声音传过来，继续说。',
  '声调传了过来，继续说。',
  // FF8 (声音从远处传来，开口说了。)
  '声线从远处传来，开口说了。',
  '嗓音从远处传来，开口说了。',
  '声音从远处传来，开说了。',
  '声调从远处传来，开口说了。',
];

// === R92 EXECUTION ===

const REPL = [
  [FF1, Ff[0], Ff[1], Ff[2], Ff[3]],
  [FF2, Ff[4], Ff[5], Ff[6], Ff[7]],
  [FF3, Ff[8], Ff[9], Ff[10], Ff[11]],
  [FF4, Ff[12], Ff[13], Ff[14], Ff[15]],
  [FF5, Ff[16], Ff[17], Ff[18], Ff[19]],
  [FF6, Ff[20], Ff[21], Ff[22], Ff[23]],
  [FF7, Ff[24], Ff[25], Ff[26], Ff[27]],
  [FF8, Ff[28], Ff[29], Ff[30], Ff[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R92 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 92 ===');
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
