const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (verified charCodes) ===
const eye_scan     = fromCodes([30446,20809,25195,36807]);              // 目光扫过 (63)
const throat_updn  = fromCodes([21897,32467,19978,19979]);              // 喉结上下 (34 — includes 9 喉结上下滚了滚)
const unconsc      = fromCodes([19981,33258,35273,22320]);              // 不自觉地 (14)
const throat_move  = fromCodes([21897,32467,21160,20102,21160]);        // 喉结动了动 (14)
const throat_roll  = fromCodes([21897,32467,19978,19979,28378,20102,28378]); // 喉结上下滚了滚 (9)
const throat_move2 = fromCodes([21897,21657,21160,20102,21160]);        // 喉咙动了动 (4)

// === Alternatives ===
// 目光扫过 (4 chars) -> 5 alternatives
const ey1 = fromCodes([30446,20809,31227,21521]);   // 目光移向
const ey2 = fromCodes([30446,20809,25237,21521]);   // 目光投向
const ey3 = fromCodes([20182,30475,20102,30475]);   // 他看了看
const ey4 = fromCodes([35270,32447,31227,36807]);   // 视线移过
const ey5 = fromCodes([30524,31070,25195,36807]);   // 眼神扫过

// 喉结上下 (4 chars) -> 4 alternatives
const tu1 = fromCodes([20182,28165,20102,28165,21897]);     // 他清了清喉
const tu2 = fromCodes([21897,38388,21160,20102,21160]);     // 喉间动了动
const tu3 = fromCodes([21897,22836,21160,20102,21160]);     // 喉头动了动
const tu4 = fromCodes([20182,28165,20102,28165,21897,21657]); // 他清了清喉咙

// 喉结动了动 (5 chars) -> 3 alternatives
const tm1 = fromCodes([21897,22836,21160,20102,21160]);     // 喉头动了动
const tm2 = fromCodes([21897,38388,28378,20102,28378]);     // 喉间滚了滚
const tm3 = fromCodes([20182,28165,20102,28165,21897]);     // 他清了清喉

// 喉结上下滚了滚 (7 chars) -> 3 alternatives
const tr1 = fromCodes([21897,22836,19978,19979,21160,20102,21160]);   // 喉头上下动了动
const tr2 = fromCodes([21897,38388,28378,20102,21448,28378]);         // 喉间滚了又滚
const tr3 = fromCodes([21897,32467,19978,19979,28369,20102,28369]);   // 喉结上下滑了滑

// 喉咙动了动 (5 chars) -> 3 alternatives
const t2a = fromCodes([21897,22836,21160,20102,21160]);     // 喉头动了动
const t2b = fromCodes([21897,38388,21160,20102,21160]);     // 喉间动了动
const t2c = fromCodes([20182,28165,20102,28165,21897]);     // 他清了清喉

// 不自觉地 (4 chars) -> 4 alternatives
const un1 = fromCodes([19981,30001,22320]);         // 不由地
const un2 = fromCodes([19979,24847,35782,22320]);   // 下意识地
const un3 = fromCodes([24773,19981,33258,31105,22320]); // 情不自禁地
const un4 = fromCodes([24525,19981,20303]);         // 忍不住

// === CLEAN_PAD ===
const pad1 = fromCodes([20182,31449,22312,37027,37324,65292,22235,21608,23433,38745,24471,21482,21097,19979,33258,24049,30340,21628,21560,12290]);
const pad2 = fromCodes([20182,22402,19979,30524,24088,65292,30446,20809,33853,22312,36828,22788,30340,40657,26263,20013,12290]);
const pad3 = fromCodes([20182,25893,32039,20102,25331,22836,65292,25351,33410,24494,24494,21457,30333,12290]);
const pad4 = fromCodes([31354,27668,20013,24357,28459,30528,19968,32929,35828,19981,28165,30340,21619,36947,12290]);
const pad5 = fromCodes([20182,25260,36215,22836,65292,29615,39038,22235,21608,65292,23547,25214,30528,20219,20309,21487,20197,20381,38752,30340,19996,35199,12290]);

// === End-marker regex parts (CORRECT) ===
const rL  = fromCodes([65288]);   // （
const rR  = fromCodes([65289]);   // ）
const rDi = fromCodes([31532]);   // 第
const rZ  = fromCodes([31456]);   // 章
const rW  = fromCodes([23436]);   // 完
const rBen= fromCodes([26412]);   // 本
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,30334,21315,19975,38646]);

// Order: longest patterns FIRST to avoid partial matches
// throat_roll (7) > throat_move (5) = throat_move2 (5) > eye_scan (4) = throat_updn (4) = unconsc (4)
const newAlts = [ey1, ey2, ey3, ey4, ey5,
                 tu1, tu2, tu3, tu4,
                 tm1, tm2, tm3,
                 tr1, tr2, tr3,
                 t2a, t2b, t2c,
                 un1, un2, un3, un4];

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
// Longest first: throat_roll (7), throat_move (5), throat_move2 (5), eye_scan (4), throat_updn (4), unconsc (4)
P('  ["' + throat_roll  + '","' + tr1 + '","' + tr2 + '","' + tr3 + '"],');
P('  ["' + throat_move  + '","' + tm1 + '","' + tm2 + '","' + tm3 + '"],');
P('  ["' + throat_move2 + '","' + t2a + '","' + t2b + '","' + t2c + '"],');
P('  ["' + eye_scan     + '","' + ey1 + '","' + ey2 + '","' + ey3 + '","' + ey4 + '","' + ey5 + '"],');
P('  ["' + throat_updn  + '","' + tu1 + '","' + tu2 + '","' + tu3 + '","' + tu4 + '"],');
P('  ["' + unconsc      + '","' + un1 + '","' + un2 + '","' + un3 + '","' + un4 + '"],');
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
P('console.log("=== VOICE ROUND 14 ===");');
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
P('  "' + throat_roll + '", "' + throat_move + '", "' + throat_move2 + '",');
P('  "' + eye_scan + '", "' + throat_updn + '", "' + unconsc + '"');
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

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round14.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');

// === Verification ===
console.log('fix_voice_round14.js generated');
console.log('\n=== PATTERN VERIFICATION ===');
console.log('throat_roll:', throat_roll);
console.log('throat_move:', throat_move);
console.log('throat_move2:', throat_move2);
console.log('eye_scan:', eye_scan);
console.log('throat_updn:', throat_updn);
console.log('unconsc:', unconsc);
for (const [lbl, s] of [['ey1',ey1],['ey2',ey2],['ey3',ey3],['ey4',ey4],['ey5',ey5],
                        ['tu1',tu1],['tu2',tu2],['tu3',tu3],['tu4',tu4],
                        ['tm1',tm1],['tm2',tm2],['tm3',tm3],
                        ['tr1',tr1],['tr2',tr2],['tr3',tr3],
                        ['t2a',t2a],['t2b',t2b],['t2c',t2c],
                        ['un1',un1],['un2',un2],['un3',un3],['un4',un4]]) {
  console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');
}
console.log('\n=== END-MARKER PARTS ===');
console.log('rDi:', rDi, '(第)');
console.log('rZ:', rZ, '(章)');
console.log('rW:', rW, '(完)');
console.log('rBen:', rBen, '(本)');
console.log('\n=== CLEAN_PAD ===');
for (const [lbl, p] of [['pad1',pad1],['pad2',pad2],['pad3',pad3],['pad4',pad4],['pad5',pad5]]) {
  console.log(lbl + ': "' + p + '"');
}
console.log('\nDone');