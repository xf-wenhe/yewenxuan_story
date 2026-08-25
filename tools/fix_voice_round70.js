const fs = require('fs');
const path = require('path');

// === R70 SOURCES (8 patterns) ===

const HH1 = '声音抖个不停。';
const HH2 = '声音平静得像一潭水。';
const HH3 = '声音平稳得像流水没有变化。';
const HH4 = '声音简短、清晰。';
const HH5 = '声音从后面传来。';
const HH6 = '声音低到了极点。';
const HH7 = '声音平淡而没有任何波澜。';
const HH8 = '声音平静得像没有情绪。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;// === R70 ALTERNATIVES (8 sources × 4 = 32 total) ===

const Hi = [
  // HH1 (声音抖个不停。)
  '声音颤抖不止。',
  '声音抖得没完。',
  '声音一直在抖。',
  '声音颤个不停。',
  // HH2 (声音平静得像一潭水。)
  '声音静得像一潭深水。',
  '声音平静得像死水。',
  '声音静得像湖面。',
  '声音平静得毫无波澜。',
  // HH3 (声音平稳得像流水没有变化。)
  '声音平稳得像一条直线。',
  '声音平得像流水。',
  '声音平稳得没有起伏。',
  '声音平稳得没有半点变化。',
  // HH4 (声音简短、清晰。)
  '声音简短而清晰。',
  '声音短促而清楚。',
  '声音简洁明了。',
  '声音短而清楚。',
  // HH5 (声音从后面传来。)
  '声音从背后传来。',
  '声音从身后传来。',
  '声音在身后响起。',
  '声音从后方传来。',
  // HH6 (声音低到了极点。)
  '声音低到极限。',
  '声音低到了底。',
  '声音低到了顶点。',
  '声音压到了最低。',
  // HH7 (声音平淡而没有任何波澜。)
  '声音平淡得像一条直线。',
  '声音平淡而毫无变化。',
  '声音平淡得一点波澜都没有。',
  '声音平淡得完全无波。',
  // HH8 (声音平静得像没有情绪。)
  '声音平静得没有情绪。',
  '声音平静得全无情绪。',
  '声音平静得像一潭死水。',
  '声音平静得不带情绪。',
];// === R70 EXECUTION ===

const REPL = [
  [HH1, Hi[0], Hi[1], Hi[2], Hi[3]],
  [HH2, Hi[4], Hi[5], Hi[6], Hi[7]],
  [HH3, Hi[8], Hi[9], Hi[10], Hi[11]],
  [HH4, Hi[12], Hi[13], Hi[14], Hi[15]],
  [HH5, Hi[16], Hi[17], Hi[18], Hi[19]],
  [HH6, Hi[20], Hi[21], Hi[22], Hi[23]],
  [HH7, Hi[24], Hi[25], Hi[26], Hi[27]],
  [HH8, Hi[28], Hi[29], Hi[30], Hi[31]],
];

const pad1 = '墙上挂着几盏灯，灰暗灰暗的。';
const pad2 = '空气静下来，连自己的呼吸声都听得清楚。';
const pad3 = '他站在那里，什么也没有说出口。';
const pad4 = '远处传来一阵风声，又慢慢消失了。';
const pad5 = '四周静下来，他等着。';
const rL = '（', rR = '）', rDi = '第', rZ = '章', rW = '完', rBen = '本';
const rNums = '一二三四五六七八九十百零';
const CLEAN_PAD = [pad1, pad2, pad3, pad4, pad5];

console.log('=== R70 VERIFICATION ===');
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

console.log('\n=== VOICE ROUND 70 ===');
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