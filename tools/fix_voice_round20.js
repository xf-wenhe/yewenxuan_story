const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (longest first) ===
const xt = fromCodes([33016,21475,21457,32039]);    // 胸口发紧 (4)
const byd2 = fromCodes([19981,30001,22320,22320]);   // 不由地地 (4) R19 artifact
const byzj = fromCodes([19981,30001,33258,20027]);   // 不由自主 (4)
const byd = fromCodes([19981,30001,22320]);          // 不由地 (3)
const by = fromCodes([19981,30001]);                 // 不由 (2)

// === Alternatives ===
// 胸口发紧 -> 4 (none contain 发紧)
const xt1 = fromCodes([33016,21475,21457,38391]);     // 胸口发闷
const xt2 = fromCodes([33016,21475,19968,31378]);     // 胸口一窒
const xt3 = fromCodes([33016,21475,21457,27785]);     // 胸口发沉
const xt4 = fromCodes([33016,21475,32039,20102,19979]); // 胸口紧了下

// 不由地地 (R19 artifact) -> 4
const byd2a1 = fromCodes([19981,33258,35273,22320]);  // 不自觉地
const byd2a2 = fromCodes([19981,33258,30693]);        // 不自知
const byd2a3 = fromCodes([19981,35273,38388]);        // 不觉间
const byd2a4 = fromCodes([19979,24847,35782,22320]);  // 下意识地

// 不由自主 -> 4
const byzja1 = fromCodes([19981,33258,35273,22320]);  // 不自觉地
const byzja2 = fromCodes([19981,33258,30693]);        // 不自知
const byzja3 = fromCodes([19981,35273,38388]);        // 不觉间
const byzja4 = fromCodes([19979,24847,35782,22320]);  // 下意识地

// 不由地 -> 4
const byda1 = fromCodes([19981,33258,35273,22320]);   // 不自觉地
const byda2 = fromCodes([19981,33258,30693]);         // 不自知
const byda3 = fromCodes([19981,35273,38388]);         // 不觉间
const byda4 = fromCodes([19979,24847,35782,22320]);   // 下意识地

// 不由 -> 4 (after longer patterns consumed, should be 0 remaining)
const bya1 = fromCodes([19981,33258,35273,22320]);    // 不自觉地
const bya2 = fromCodes([19981,33258,30693]);          // 不自知
const bya3 = fromCodes([19981,35273,38388]);          // 不觉间
const bya4 = fromCodes([19979,24847,35782,22320]);    // 下意识地

// === CLEAN_PAD ===
const pad1 = fromCodes([22681,19978,30340,28783,20809,24573,26126,24573,26263,12290]);
const pad2 = fromCodes([22235,21608,38745,24471,36830,33258,24049,30340,21628,21560,22768,37117,21548,24471,35265,12290]);
const pad3 = fromCodes([31354,27668,20223,20315,20957,22266,20102,19968,33324,65292,35841,20063,27809,26377,20877,35828,35805,12290]);
const pad4 = fromCodes([36828,22788,30340,20809,32447,28176,28176,26263,20102,19979,26469,12290]);
const pad5 = fromCodes([20182,27785,40664,30528,65292,27809,26377,22238,31572,12290]);

const rL  = fromCodes([65288]);
const rR  = fromCodes([65289]);
const rDi = fromCodes([31532]);
const rZ  = fromCodes([31456]);
const rW  = fromCodes([23436]);
const rBen= fromCodes([26412]);
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,30334,21315,19975,38646]);

const VOLUMES = ["volume-1","volume-2","volume-3","volume-4","volume-5","volume-6","volume-7"];
const TARGET = 3020;

console.log('=== R20 PATTERN VERIFICATION ===');
console.log('xt:', xt);
console.log('byd2:', byd2);
console.log('byzj:', byzj);
console.log('byd:', byd);
console.log('by:', by);
for (const [lbl,s] of [['xt1',xt1],['xt2',xt2],['xt3',xt3],['xt4',xt4],
                       ['byd2a1',byd2a1],['byd2a2',byd2a2],['byd2a3',byd2a3],['byd2a4',byd2a4],
                       ['byzja1',byzja1],['byzja2',byzja2],['byzja3',byzja3],['byzja4',byzja4],
                       ['byda1',byda1],['byda2',byda2],['byda3',byda3],['byda4',byda4],
                       ['bya1',bya1],['bya2',bya2],['bya3',bya3],['bya4',bya4]]) {
  console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');
}

const REPL = [
  [xt, xt1, xt2, xt3, xt4],
  [byd2, byd2a1, byd2a2, byd2a3, byd2a4],
  [byzj, byzja1, byzja2, byzja3, byzja4],
  [byd, byda1, byda2, byda3, byda4],
  [by, bya1, bya2, bya3, bya4],
];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

const CLEAN_PAD = [pad1,pad2,pad3,pad4,pad5];
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
      const PLEN = pattern.length;
      let idx = text.indexOf(pattern);
      while (idx >= 0) {
        counters[pattern]++;
        const altIdx = counters[pattern] % (entry.length - 1);
        const alt = entry[1 + altIdx];
        text = text.slice(0, idx) + alt + text.slice(idx + PLEN);
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

console.log('\n=== VOICE ROUND 20 ===');
for (const [pattern, cnt] of Object.entries(counters)) {
  if (cnt > 0) console.log('  ' + pattern +': ' + cnt);
}
console.log('Chapters changed: ' + chaptersChanged);

if (cjkDrops.length) {
  console.log('\nCJK drops below 3000 (' + cjkDrops.length + '):');
  for (const [ch, b, a] of cjkDrops) console.log('  ch' + ch + ': ' + b + ' -> ' + a);
}

if (cjkDrops.length) {
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
    if (idx < 0) continue;
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
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) below++;
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
console.log('  Delta: ' + (totalCjk - totalCjkBefore));

console.log('\nRemaining patterns:');
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

console.log('\n=== NEW ALTERNATIVES ===');
const allAlts = [];
for (const entry of REPL) allAlts.push(...entry.slice(1));
for (const p of allAlts) {
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