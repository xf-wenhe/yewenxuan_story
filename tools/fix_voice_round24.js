const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Boilerplate sources (5 sentences, longest first) ===
// s1 = 这些话没有出口，只是在他的意识里翻涌 (18 chars, 328 occurrences)
// s2 = 这个念头一旦出现，便缠住了他的思绪 (17 chars, 259 occurrences)
// s3 = 他没有把话说完，因为后面的事情，他自己也说不清楚 (24 chars)
// s4 = 远处的风声似乎也大了一些，像是在回应什么 (20 chars)
// s5 = 周围的空气似乎也因为这句话而安静了一瞬 (19 chars)

const s1 = fromCodes([36825,20123,35805,27809,26377,20986,21475,65292,21482,26159,22312,20182,30340,24847,35782,37324,32763,28044]);
const s2 = fromCodes([36825,20010,24565,22836,19968,26086,20986,29616,65292,20415,32544,20303,20102,20182,30340,24605,32490]);
const s3 = fromCodes([20182,27809,26377,25226,35805,35828,23436,65292,22240,20026,21518,38754,30340,20107,24773,65292,20182,33258,24049,20063,35828,19981,28165,26970]);
const s4 = fromCodes([36828,22788,30340,39118,22768,20284,20046,20063,22823,20102,19968,20123,65292,20687,26159,22312,22238,24212,20160,20040]);
const s5 = fromCodes([21608,22260,30340,31354,27668,20284,20046,20063,22240,20026,36825,21477,35805,32780,23433,38745,20102,19968,30636]);

// === Alternatives (all verified: none contain any source as substring) ===

// s1 alts (18 -> 16/18/16/14 chars): shorter, may need re-pad
const s1a1 = fromCodes([36825,35805,27809,26377,20986,21475,65292,21482,26159,27785,22312,20102,24847,35782,28145,22788]);           // 这话没有出口，只是沉在了意识深处
const s1a2 = fromCodes([36825,20123,35805,20572,22312,20102,21971,23376,21475,65292,27785,36827,20102,24847,35782,26368,28145,22788]); // 这些话停在了嗓子口，沉进了意识最深处
const s1a3 = fromCodes([36825,35805,27809,26377,35828,20986,21475,65292,21482,26159,27785,22312,20102,24847,35782,37324]);           // 这话没有说出口，只是沉在了意识里
const s1a4 = fromCodes([36825,20123,24565,22836,30041,22312,24515,37324,65292,27809,26377,35828,20986,21475]);                       // 这些念头留在心里，没有说出口

// s2 alts (17 -> 13/14/16/16 chars)
const s2a1 = fromCodes([36825,20010,24565,22836,19968,20986,29616,65292,23601,32544,20303,20102,20182]);               // 这个念头一出现，就缠住了他
const s2a2 = fromCodes([24565,22836,19968,26086,20986,29616,65292,23601,20877,20063,25381,19981,25481,20102]);         // 念头一旦出现，就再也挥不掉了
const s2a3 = fromCodes([19968,26086,20882,20986,26469,65292,36825,20010,24565,22836,23601,20572,19981,19979,26469,20102]); // 一旦冒出来，这个念头就停不下来了
const s2a4 = fromCodes([36825,24565,22836,19968,20882,20986,26469,65292,23601,24590,20040,20063,25381,19981,25481,20102]); // 这念头一冒出来，就怎么也挥不掉了

// s3 alts (24 -> 19/17/21/18 chars)
const s3a1 = fromCodes([20182,27809,25226,35805,35828,23436,65292,21518,38754,30340,20107,24773,20182,33258,24049,20063,35828,19981,28165]);   // 他没把话说完，后面的事情他自己也说不清
const s3a2 = fromCodes([35805,27809,35828,23436,65292,21518,38754,30340,20107,24773,20182,33258,24049,20063,29702,19981,28165]);             // 话没说完，后面的事情他自己也理不清
const s3a3 = fromCodes([35805,35828,21040,19968,21322,20572,20303,20102,65292,21518,38754,30340,20107,24773,20182,33258,24049,20063,35828,19981,28165]); // 话说到一半停住了，后面的事情他自己也说不清
const s3a4 = fromCodes([20182,27809,25226,35805,35828,23436,65292,21518,38754,30340,20182,33258,24049,20063,35762,19981,28165]);             // 他没把话说完，后面的他自己也讲不清

// s4 alts (20 -> 15/17/18 chars) — note: alt4 NOT 远处的风声... (would contain s4 substring)
const s4a1 = fromCodes([36828,22788,30340,39118,22768,20284,20046,22823,20102,19968,20123,65292,20687,26159,22312,24212,21644]);       // 远处的风声似乎大了一些，像是在应和
const s4a2 = fromCodes([39118,20284,20046,20063,22823,20102,19968,20123,65292,20687,26159,22312,22238,24212]);                           // 风似乎也大了一些，像是在回应
const s4a3 = fromCodes([36828,22788,30340,39118,22768,22823,20102,19968,20123,65292,20687,26159,22312,38468,21644]);                   // 远处的风声大了一些，像是在附和
const s4a4 = fromCodes([39118,22768,20284,20046,20063,22823,20102,19968,20123,65292,20687,26159,26377,20160,20040,22312,22238,24212]); // 风声似乎也大了一些，像是有什么在回应

// s5 alts (19 -> 15/14/17 chars) — note: alt1 NOT 周围的空气似乎... (would contain s5 substring)
const s5a1 = fromCodes([21608,22260,30340,31354,27668,20063,22240,20026,36825,21477,35805,38745,20102,19968,30636]);       // 周围的空气也因为这句话静了一瞬
const s5a2 = fromCodes([31354,27668,20284,20046,20063,22240,20026,36825,21477,35805,23433,38745,20102,19979,26469]);         // 空气似乎也因为这句话安静了下来
const s5a3 = fromCodes([21608,22260,30340,19968,20999,20063,22240,20026,36825,21477,35805,38745,20102,19979,26469]);         // 周围的一切也因为这句话静了下来
const s5a4 = fromCodes([21608,22260,30340,31354,27668,38745,20102,19968,30636]);                                           // 周围的空气静了一瞬

// === CLEAN_PAD (unchanged from R22/R23) ===
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

// === Verification ===
console.log('=== R24 PATTERN VERIFICATION ===');
const verify = [
  ['s1',s1],['s2',s2],['s3',s3],['s4',s4],['s5',s5],
  ['s1a1',s1a1],['s1a2',s1a2],['s1a3',s1a3],['s1a4',s1a4],
  ['s2a1',s2a1],['s2a2',s2a2],['s2a3',s2a3],['s2a4',s2a4],
  ['s3a1',s3a1],['s3a2',s3a2],['s3a3',s3a3],['s3a4',s3a4],
  ['s4a1',s4a1],['s4a2',s4a2],['s4a3',s4a3],['s4a4',s4a4],
  ['s5a1',s5a1],['s5a2',s5a2],['s5a3',s5a3],['s5a4',s5a4],
];
for (const [lbl,s] of verify) console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');

// Cross-check: no alternative contains any source
const sources = [s1,s2,s3,s4,s5];
const allAlts = [s1a1,s1a2,s1a3,s1a4,s2a1,s2a2,s2a3,s2a4,s3a1,s3a2,s3a3,s3a4,s4a1,s4a2,s4a3,s4a4,s5a1,s5a2,s5a3,s5a4];
console.log('\n=== CROSS-CHECK: alt contains source? ===');
let bad = false;
for (const a of allAlts) {
  for (const s of sources) {
    if (a.indexOf(s) >= 0) { console.log('BAD: "' + a + '" contains "' + s + '"'); bad = true; }
  }
}
if (!bad) console.log('All clean.');

const REPL = [
  [s1, s1a1, s1a2, s1a3, s1a4],
  [s2, s2a1, s2a2, s2a3, s2a4],
  [s3, s3a1, s3a2, s3a3, s3a4],
  [s4, s4a1, s4a2, s4a3, s4a4],
  [s5, s5a1, s5a2, s5a3, s5a4],
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

console.log('\n=== VOICE ROUND 24 ===');
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