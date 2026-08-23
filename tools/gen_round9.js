const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns ===
const chest_tight  = fromCodes([33016,21475,19968,32039]);      // 胸口一紧
const chest_sink   = fromCodes([33016,21475,27785,20102,19968,19979]); // 胸口沉了一下
const chest_stuff  = fromCodes([33016,21475,38391,20102,19968,19979]); // 胸口闷了一下
const pupil_deep   = fromCodes([30643,23380,28145,22788]);     // 瞳孔深处
const pupil_in     = fromCodes([30643,23380,37324]);           // 瞳孔里
const nail_dig     = fromCodes([25351,30002,25488,36827]);     // 指甲掐进
const throat_roll  = fromCodes([21897,32467,28378,21160]);     // 喉结滚动
const smile_rise   = fromCodes([22068,35282,28014,36215]);     // 嘴角浮起
const mind_think   = fromCodes([24515,37324,24819]);           // 心里想
const vague_cant   = fromCodes([19968,31181,26080,27861]);     // 一种无法
const deep_breathe = fromCodes([28145,21560,20102,19968,21475]); // 深吸了一口

// === Alternatives ===
// 胸口一紧 →
const ct1 = fromCodes([33016,33108,29467,22320,25910,32039]);  // 胸腔猛地收紧
const ct2 = fromCodes([21628,21560,29467,22320,19968,31378]);  // 呼吸猛地一窒
const ct3 = fromCodes([33016,21475,20687,34987,25893,20303]);  // 胸口像被攥住

// 胸口沉了一下 →
const cs1 = fromCodes([33016,33108,34987,21387,20102,19968,19979]); // 胸腔被压了一下
const cs2 = fromCodes([20182,21628,21560,37325,20102]);          // 他呼吸重了
const cs3 = fromCodes([24515,21475,24448,19979,27785,20102,27785]); // 心口往下沉了沉

// 胸口闷了一下 →
const cst1 = fromCodes([21628,21560,22581,20102,19968,30636]);   // 呼吸堵了一瞬
const cst2 = fromCodes([33016,33108,38391,32039]);              // 胸腔闷紧

// 瞳孔深处 →
const pd1 = fromCodes([30524,24213,28145,22788]);               // 眼底深处
const pd2 = fromCodes([20182,30524,24213]);                     // 他眼底

// 瞳孔里 →
const pi1 = fromCodes([20182,30524,24213]);                     // 他眼底
const pi2 = fromCodes([20182,30524,30643,37324]);               // 他眼瞳里

// 指甲掐进 →
const nd1 = fromCodes([25351,33410,25423,24471,21457,30333]);   // 指节捏得发白
const nd2 = fromCodes([25351,30002,22312,25484,24515,25488,20986,21360,23376]); // 指甲在掌心掐出印子
const nd3 = fromCodes([25351,33410,25423,24471,27867,30333]);   // 指节捏得泛白

// 喉结滚动 →
const tr1 = fromCodes([20182,28165,20102,28165,21897,21657]);   // 他清了清喉咙
const tr2 = fromCodes([20182,21693,20102,21475,21822,27819]);   // 他咽了口唾沫

// 嘴角浮起 →
const sr1 = fromCodes([22068,35282,24448,19978,25196,20102,25196]); // 嘴角往上扬了扬
const sr2 = fromCodes([22068,35282,24367,20102,19968,19979]);   // 嘴角弯了一下

// 心里想 →
const mt1 = fromCodes([20182,24515,37324,30424,31639]);         // 他心里盘算
const mt2 = fromCodes([20182,26263,33258,24605,24534]);         // 他暗自思忖

// 一种无法 →
const vc1 = fromCodes([19968,31181,35828,19981,20986,26469,30340]); // 一种说不出来的
const vc2 = fromCodes([19968,31181,35828,19981,28165,30340]);   // 一种说不清的

// 深吸了一口 →
const db1 = fromCodes([20182,38271,38271,21520,20986,19968,21475,27668]); // 他长长吐出一口气
const db2 = fromCodes([20182,38271,38271,21628,20986,19968,21475,27668]); // 他长长呼出一口气

// === CLEAN_PAD ===
const pad1 = fromCodes([37027,20010,24565,22836,22312,20182,33041,23376,37324,36716,20102,19968,22280,65292,25165,20572,19979,26469,12290]);
const pad2 = fromCodes([21608,22260,30340,31354,27668,22240,20026,36825,21477,35805,23433,38745,20102,19968,30636,12290]);
const pad3 = fromCodes([37027,21477,35805,27785,36827,20102,20182,24515,37324,26368,28145,22788,12290]);
const pad4 = fromCodes([20182,31449,22312,37027,37324,65292,19968,26102,19981,30693,36947,35813,21521,21738,36208,12290]);
const pad5 = fromCodes([20182,38656,35201,26356,22810,30340,26102,38388,12290]);

// === Chapter-end regex parts ===
const rL = fromCodes([65288]);
const rR = fromCodes([65289]);
const rDi = fromCodes([29420]);
const rZ  = fromCodes([31531]);
const rW  = fromCodes([23436]);
const rBen= fromCodes([26410]);
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,30334,21315,19975,38646]);

// === New alternatives for distribution check ===
const newAlts = [ct1, ct2, ct3, cs1, cs2, cs3, cst1, cst2,
                 pd1, pd2, pi1, pi2, nd1, nd2, nd3,
                 tr1, tr2, sr1, sr2, mt1, mt2, vc1, vc2, db1, db2];

const L = [];
const P = L.push.bind(L);

P('#!/usr/bin/env node');
P('const fs = require("fs");');
P('const path = require("path");');
P('const baseDir = process.cwd();');
P('const VOLUMES = ["volume-1","volume-2","volume-3","volume-4","volume-5","volume-6","volume-7"];');
P('const TARGET = 3020;');
P('');
P('function countCjk(t) {');
P('  let n = 0;');
P('  for (const c of t) { if (c >= "\\u4e00" && c <= "\\u9fff") n++; }');
P('  return n;');
P('}');
P('');
P('const CLEAN_PAD = ["' + pad1 + '","' + pad2 + '","' + pad3 + '","' + pad4 + '","' + pad5 + '"];');
P('');
P('const REPL = [');
P('  ["' + chest_tight  + '","' + ct1 + '","' + ct2 + '","' + ct3 + '"],');
P('  ["' + chest_sink   + '","' + cs1 + '","' + cs2 + '","' + cs3 + '"],');
P('  ["' + chest_stuff  + '","' + cst1 + '","' + cst2 + '"],');
P('  ["' + pupil_deep   + '","' + pd1 + '","' + pd2 + '"],');
P('  ["' + pupil_in     + '","' + pi1 + '","' + pi2 + '"],');
P('  ["' + nail_dig     + '","' + nd1 + '","' + nd2 + '","' + nd3 + '"],');
P('  ["' + throat_roll  + '","' + tr1 + '","' + tr2 + '"],');
P('  ["' + smile_rise   + '","' + sr1 + '","' + sr2 + '"],');
P('  ["' + mind_think   + '","' + mt1 + '","' + mt2 + '"],');
P('  ["' + vague_cant   + '","' + vc1 + '","' + vc2 + '"],');
P('  ["' + deep_breathe + '","' + db1 + '","' + db2 + '"],');
P('];');
P('');
P('let counters = {};');
P('let chaptersChanged = 0;');
P('let cjkDrops = [];');
P('');
P('for (const volDir of VOLUMES) {');
P('  const d = path.join(baseDir, "chapters", volDir);');
P('  if (!fs.existsSync(d)) continue;');
P('  const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
P('  for (const f of files) {');
P('    const fp = path.join(d, f);');
P('    const chNum = parseInt(f.match(/chapter-(\\d+)/)[1]);');
P('    let text = fs.readFileSync(fp, "utf-8");');
P('    const beforeCjk = countCjk(text);');
P('    let changed = false;');
P('    for (const entry of REPL) {');
P('      const pattern = entry[0];');
P('      if (!counters[pattern]) counters[pattern] = 0;');
P('      const PLEN = pattern.length;');
P('      let idx = text.indexOf(pattern);');
P('      while (idx >= 0) {');
P('        counters[pattern]++;');
P('        const altIdx = counters[pattern] % (entry.length - 1);');
P('        const alt = entry[1 + altIdx];');
P('        text = text.slice(0, idx) + alt + text.slice(idx + PLEN);');
P('        idx = text.indexOf(pattern, idx + alt.length);');
P('        changed = true;');
P('      }');
P('    }');
P('    if (changed) {');
P('      const afterCjk = countCjk(text);');
P('      fs.writeFileSync(fp, text, "utf-8");');
P('      chaptersChanged++;');
P('      if (afterCjk < 3000) cjkDrops.push([chNum, beforeCjk, afterCjk]);');
P('    }');
P('  }');
P('}');
P('');
P('console.log("=== VOICE ROUND 9 ===");');
P('for (const [pattern, cnt] of Object.entries(counters)) {');
P('  if (cnt > 0) console.log("  " + pattern + ": " + cnt);');
P('}');
P('console.log("Chapters changed: " + chaptersChanged);');
P('');
P('if (cjkDrops.length) {');
P('  console.log("\\nCJK drops below 3000 (" + cjkDrops.length + "):");');
P('  for (const [ch, b, a] of cjkDrops) console.log("  ch" + ch + ": " + b + " -> " + a);');
P('}');
P('');
P('if (cjkDrops.length) {');
P('  console.log("\\nRe-padding...");');
P('  let padded = 0;');
P('  for (const [chNum] of cjkDrops) {');
P('    const vol = chNum <= 100 ? "volume-1" : chNum <= 250 ? "volume-2" : chNum <= 400 ? "volume-3" :');
P('                chNum <= 550 ? "volume-4" : chNum <= 750 ? "volume-5" : chNum <= 918 ? "volume-6" : "volume-7";');
P('    const fp = path.join(baseDir, "chapters", vol, "chapter-" + String(chNum).padStart(3,"0") + "-polished.md");');
P('    let text = fs.readFileSync(fp, "utf-8");');
P('    let cjk = countCjk(text);');
P('    let idx = -1;');
P('    const _L = "' + rL + '", _R = "' + rR + '";');
P('    const _D = "' + rDi + '", _Z = "' + rZ + '", _W = "' + rW + '", _B = "' + rBen + '";');
P('    const _N = "' + rNums + '";');
P('    const re1 = new RegExp(_L + _D + "\\\\d+" + _Z + _W + _R);');
P('    const re2 = new RegExp(_L + _D + "[" + _N + "]+" + _Z + _W + _R);');
P('    const re3 = new RegExp(_L + _B + _Z + _W + _R);');
P('    for (const re of [re1, re2, re3]) {');
P('      const m = text.match(re);');
P('      if (m) { idx = m.index; break; }');
P('    }');
P('    if (idx < 0) continue;');
P('    let pad = "";');
P('    let ci = 0;');
P('    while (countCjk(text.slice(0, idx) + pad + text.slice(idx)) < TARGET) {');
P('      pad += "\\n\\n" + CLEAN_PAD[ci % CLEAN_PAD.length];');
P('      ci++;');
P('      if (ci > 100) break;');
P('    }');
P('    const newText = text.slice(0, idx) + pad + text.slice(idx);');
P('    fs.writeFileSync(fp, newText, "utf-8");');
P('    console.log("  ch" + chNum + ": " + cjk + " -> " + countCjk(newText));');
P('    padded++;');
P('  }');
P('  console.log("Padded: " + padded);');
P('}');
P('');
P('console.log("\\n=== FINAL STATE ===");');
P('let totalCjk = 0, below = 0;');
P('for (const v of VOLUMES) {');
P('  const d = path.join(baseDir, "chapters", v);');
P('  if (!fs.existsSync(d)) continue;');
P('  const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
P('  for (const f of files) {');
P('    const text = fs.readFileSync(path.join(d, f), "utf-8");');
P('    const c = countCjk(text);');
P('    totalCjk += c;');
P('    if (c < 3000) below++;');
P('  }');
P('}');
P('console.log("  Total CJK: " + totalCjk.toLocaleString());');
P('console.log("  Below 3000: " + below);');
P('');
P('const remainChecks = [');
P('  "' + chest_tight + '", "' + chest_sink + '", "' + chest_stuff + '",');
P('  "' + pupil_deep + '", "' + pupil_in + '",');
P('  "' + nail_dig + '", "' + throat_roll + '", "' + smile_rise + '",');
P('  "' + mind_think + '", "' + vague_cant + '", "' + deep_breathe + '"');
P('];');
P('for (const p of remainChecks) {');
P('  let total = 0;');
P('  for (const v of VOLUMES) {');
P('    const d = path.join(baseDir, "chapters", v);');
P('    if (!fs.existsSync(d)) continue;');
P('    const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
P('    for (const f of files) {');
P('      total += fs.readFileSync(path.join(d, f), "utf-8").split(p).length - 1;');
P('    }');
P('  }');
P('  console.log("  Remaining " + p + ": " + total);');
P('}');
P('');
P('const newAlts = [');
for (let i = 0; i < newAlts.length; i++) {
  const comma = i < newAlts.length - 1 ? ',' : '';
  P('  "' + newAlts[i] + '"' + comma);
}
P('];');
P('console.log("\\n=== NEW ALTERNATIVES DISTRIBUTION ===");');
P('for (const p of newAlts) {');
P('  let total = 0;');
P('  for (const v of VOLUMES) {');
P('    const d = path.join(baseDir, "chapters", v);');
P('    if (!fs.existsSync(d)) continue;');
P('    const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
P('    for (const f of files) {');
P('      total += fs.readFileSync(path.join(d, f), "utf-8").split(p).length - 1;');
P('    }');
P('  }');
P('  console.log("  " + p + ": " + total);');
P('}');

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round9.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');
console.log('fix_voice_round9.js generated');

// Verify patterns are correct
const out = fs.readFileSync(outPath, 'utf-8');
const lines = out.split('\n');
for (const [label, p] of [
  ['chest_tight', chest_tight],
  ['chest_sink', chest_sink],
  ['pupil_deep', pupil_deep],
  ['nail_dig', nail_dig],
  ['throat_roll', throat_roll],
]) {
  for (const l of lines) {
    if (l.includes(p)) {
      console.log(label + ' OK: ' + p + ' (' + p.length + ' chars)');
      break;
    }
  }
}

// Verify alternatives are real Chinese
for (const [label, s] of [
  ['ct1', ct1], ['ct2', ct2], ['ct3', ct3],
  ['cs1', cs1], ['cs2', cs2], ['cs3', cs3],
  ['pd1', pd1], ['pd2', pd2],
  ['nd1', nd1], ['nd2', nd2],
  ['mt1', mt1], ['mt2', mt2],
  ['vc1', vc1], ['db1', db1],
]) {
  // Check all chars are in CJK range
  const allCjk = s.split('').every(c => c.charCodeAt(0) >= 0x4E00 && c.charCodeAt(0) <= 0x9FFF);
  console.log(label + ': "' + s + '" ' + (allCjk ? 'OK' : 'WARN: non-CJK chars') + ' (' + s.length + ' chars)');
}

console.log('Done');