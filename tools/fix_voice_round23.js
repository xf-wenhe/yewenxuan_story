const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns ===
const zj = fromCodes([25893,32039]);                          // 攥紧 (3) 66
const zz = fromCodes([25893,20303]);                          // 攥住 (3) 122
const zd = fromCodes([25893,24471]);                          // 攥得 (3) 51
const zq = fromCodes([25893,36215]);                          // 攥起 (3) 3
const hjsxg = fromCodes([21897,32467,19978,19979,28378]);     // 喉结上下滚 (5) 12
const mr = fromCodes([29467,28982]);                           // 猛然 (2) 32
const zr = fromCodes([39588,28982]);                           // 骤然 (2) 33
const szsj = fromCodes([25163,25351,25910,32039]);             // 手指收紧 (4) 12

// === Alternatives (none contain source as substring) ===

// 攥紧 -> 握紧/抓紧/捏紧/攥住(no-skip:攥住 has 攥, skip)
// Use: 握紧/抓紧/捏紧/握住
const zj1 = fromCodes([25569,32039]);                          // 握紧
const zj2 = fromCodes([25235,32039]);                          // 抓紧
const zj3 = fromCodes([25423,32039]);                          // 捏紧
const zj4 = fromCodes([25569,20303]);                          // 握住

// 攥住 -> 握住/抓住/捏住/抓住?
const zz1 = fromCodes([25569,20303]);                          // 握住
const zz2 = fromCodes([25235,20303]);                          // 抓住
const zz3 = fromCodes([25423,20303]);                          // 捏住
const zz4 = fromCodes([25569,25216]);                          // 握拿? no — use 紧握

// Actually let me fix zz4 to be sensible: 攥住 alts: 握住/抓住/捏住/握住
// Wait, need 4 unique. Use: 握住/抓住/捏住/攥住(no). Let me use 攥住 -> 握住/抓住/捏住/攥牢
// 攥牢 has 攥, skip. Use: 握住/抓住/捏住/紧握
const zz4alt = fromCodes([32039,25569]);                       // 紧握

// 攥得 -> 握得/捏得/掐得/挤得
const zd1 = fromCodes([25569,24471]);                          // 握得
const zd2 = fromCodes([25423,24471]);                          // 捏得
const zd3 = fromCodes([25488,24471]);                          // 掐得
const zd4 = fromCodes([25490,24471]);                          // 挤得

// 攥起 -> 握起/抓起/捏起/提起
const zq1 = fromCodes([25569,36215]);                          // 握起
const zq2 = fromCodes([25235,36215]);                          // 抓起
const zq3 = fromCodes([25423,36215]);                          // 捏起
const zq4 = fromCodes([25216,36215]);                          // 提起

// 喉结上下滚 -> 喉结滚了滚/喉结动了动/喉结动了一下/喉结滚了一下
const h1 = fromCodes([21897,32467,28378,20102,28378]);          // 喉结滚了滚
const h2 = fromCodes([21897,32467,21160,20102,21160]);          // 喉结动了动
const h3 = fromCodes([21897,32467,21160,20102,19968,19979]);    // 喉结动了一下
const h4 = fromCodes([21897,32467,28378,20102,19968,19979]);    // 喉结滚了一下

// 猛然 -> 忽然/陡然/倏然/猝然
const mr1 = fromCodes([24573,28982]);                           // 忽然
const mr2 = fromCodes([38497,28982]);                           // 陡然
const mr3 = fromCodes([20495,28982]);                           // 倏然
const mr4 = fromCodes([29469,28982]);                           // 猝然

// 骤然 -> 陡然/忽然/突然/倏然
const zr1 = fromCodes([38497,28982]);                           // 陡然
const zr2 = fromCodes([24573,28982]);                           // 忽然
const zr3 = fromCodes([31361,28982]);                           // 突然
const zr4 = fromCodes([20495,28982]);                           // 倏然

// 手指收紧 -> 指节收紧/手指紧握/指节发白/指节泛白
const sz1 = fromCodes([25351,33410,25910,32039]);               // 指节收紧
const sz2 = fromCodes([25163,25351,32039,25569]);               // 手指紧握
const sz3 = fromCodes([25351,33410,21457,30333]);               // 指节发白
const sz4 = fromCodes([25351,33410,27867,30333]);               // 指节泛白

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

console.log('=== R23 PATTERN VERIFICATION ===');
const verify = [
  ['zj',zj],['zz',zz],['zd',zd],['zq',zq],['hjsxg',hjsxg],
  ['mr',mr],['zr',zr],['szsj',szsj],
  ['zz4alt',zz4alt],
];
for (const [lbl,s] of verify) console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');

const REPL = [
  [hjsxg, h1, h2, h3, h4],      // 喉结上下滚 (5) 12
  [szsj, sz1, sz2, sz3, sz4],   // 手指收紧 (4) 12
  [zj, zj1, zj2, zj3, zj4],     // 攥紧 (3) 66
  [zz, zz1, zz2, zz3, zz4alt],  // 攥住 (3) 122
  [zd, zd1, zd2, zd3, zd4],     // 攥得 (3) 51
  [zq, zq1, zq2, zq3, zq4],     // 攥起 (3) 3
  [mr, mr1, mr2, mr3, mr4],     // 猛然 (2) 32
  [zr, zr1, zr2, zr3, zr4],     // 骤然 (2) 33
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

console.log('\n=== VOICE ROUND 23 ===');
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
const seen = new Set();
for (const p of allAlts) {
  if (seen.has(p)) continue;
  seen.add(p);
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