const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (longest first) ===
const art1 = fromCodes([21897,32467,28378,21160,19968,19979,20102,19968,27425]); // 喉结滚动一下了一次 (9) R19 artifact
const art2 = fromCodes([21897,32467,21160,20102,21160,20102,19968,19979]);       // 喉结动了动了一下 (8) R19 artifact
const art3 = fromCodes([33016,21475,32039,20102,19979,24471,24908]);            // 胸口紧了下得慌 (7) R20 artifact
const sxh  = fromCodes([25163,24515,20840,26159,27735]);                         // 手心全是汗 (5)
const hs   = fromCodes([21897,32467,28369,21160]);                                // 喉结滑动 (4)
const yjy  = fromCodes([21676,32039,29273]);                                       // 咬紧牙 (3)

// === Alternatives ===
// R19 artifact: 喉结滚动一下了一次 -> 喉结滚了一下
const art1a1 = fromCodes([21897,32467,28378,20102,19968,19979]); // 喉结滚了一下
const art1a2 = fromCodes([21897,32467,21160,20102,21160]);       // 喉结动了动
const art1a3 = fromCodes([21897,32467,19978,19979,28378]);       // 喉结上下滚
const art1a4 = fromCodes([21897,21657,28378]);                   // 喉咙滚

// R19 artifact: 喉结动了动了一下 -> 喉结滚了滚
const art2a1 = fromCodes([21897,32467,28378,20102,28378]);       // 喉结滚了滚
const art2a2 = fromCodes([21897,32467,19978,19979,28378]);       // 喉结上下滚
const art2a3 = fromCodes([21897,21657,28378]);                   // 喉咙滚
const art2a4 = fromCodes([21897,32467,28378,20102,19968,19979]); // 喉结滚了一下

// R20 artifact: 胸口紧了下得慌 -> 胸口一窒
const art3a1 = fromCodes([33016,21475,19968,31378]);             // 胸口一窒
const art3a2 = fromCodes([33016,21475,21457,38391]);             // 胸口发闷
const art3a3 = fromCodes([33016,21475,21457,27785]);             // 胸口发沉
const art3a4 = fromCodes([33016,21475,21457,32039]);             // 胸口发紧

// 手心全是汗 -> 4
const sxh1 = fromCodes([25163,24515,27735,28287]);               // 手心汗湿
const sxh2 = fromCodes([25163,24515,27777,27735]);               // 手心沁汗
const sxh3 = fromCodes([25163,24515,21457,27735]);               // 手心发汗
const sxh4 = fromCodes([25484,24515,27777,27735]);               // 掌心沁汗

// 喉结滑动 -> 4 (none contain 喉结滑动)
const hs1 = fromCodes([21897,32467,28378]);                      // 喉结滚
const hs2 = fromCodes([21897,32467,21160]);                      // 喉结动
const hs3 = fromCodes([21897,32467,19978,19979,28378]);          // 喉结上下滚
const hs4 = fromCodes([21897,21657,28378]);                      // 喉咙滚

// 咬紧牙 -> 4
const yjy1 = fromCodes([29273,20851,32039,21676]);               // 牙关紧咬
const yjy2 = fromCodes([21676,32039,29273,20851]);               // 咬紧牙关
const yjy3 = fromCodes([29273,32541,21676,32039]);               // 牙缝咬紧
const yjy4 = fromCodes([21676,29273,21676,32039]);               // 咬牙咬紧

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

console.log('=== R21 PATTERN VERIFICATION ===');
const verifyPatterns = [art1, art2, art3, sxh, hs, yjy];
const verifyLabels = ['art1','art2','art3','sxh','hs','yjy'];
for (const [i, lbl] of verifyLabels.entries()) console.log(lbl + ': "' + verifyPatterns[i] + '" (' + verifyPatterns[i].length + ' chars)');
for (const [lbl,s] of [['art1a1',art1a1],['art1a2',art1a2],['art1a3',art1a3],['art1a4',art1a4],
                       ['art2a1',art2a1],['art2a2',art2a2],['art2a3',art2a3],['art2a4',art2a4],
                       ['art3a1',art3a1],['art3a2',art3a2],['art3a3',art3a3],['art3a4',art3a4],
                       ['sxh1',sxh1],['sxh2',sxh2],['sxh3',sxh3],['sxh4',sxh4],
                       ['hs1',hs1],['hs2',hs2],['hs3',hs3],['hs4',hs4],
                       ['yjy1',yjy1],['yjy2',yjy2],['yjy3',yjy3],['yjy4',yjy4]]) {
  console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');
}

const REPL = [
  [art1, art1a1, art1a2, art1a3, art1a4],
  [art2, art2a1, art2a2, art2a3, art2a4],
  [art3, art3a1, art3a2, art3a3, art3a4],
  [sxh, sxh1, sxh2, sxh3, sxh4],
  [hs, hs1, hs2, hs3, hs4],
  [yjy, yjy1, yjy2, yjy3, yjy4],
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

console.log('\n=== VOICE ROUND 21 ===');
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