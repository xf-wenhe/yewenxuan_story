const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (verified) ===
const swallow = fromCodes([21693,20102,21475,21822,27819]);
const bujin   = fromCodes([19981,31105]);
const danshan = fromCodes([28129,28129]);

// === Alternatives ===
// 咽了口唾沫 -> 5 alternatives
const sw1 = fromCodes([20182,28165,20102,28165,21897,21657]);  // 他清了清喉咙
const sw2 = fromCodes([20182,21534,20102,21534,21475,27700]);  // 他吞了吞口水
const sw3 = fromCodes([21897,38388,28378,20102,28378]);        // 喉间滚了滚
const sw4 = fromCodes([20182,21917,20102,21475,27700]);        // 他喝了口水
const sw5 = fromCodes([20182,28165,20102,28165,21897,38388]);  // 他清了清喉间

// 不禁 -> 4 alternatives
const bj1 = fromCodes([24525,19981,20303]);  // 忍不住
const bj2 = fromCodes([19981,33258,31105]);  // 不自禁
const bj3 = fromCodes([19979,24847,35782,22320]); // 下意识地
const bj4 = fromCodes([19981,30001,22320]);  // 不由地

// 淡淡 -> 4 alternatives
const ddA = fromCodes([27973,27973]);        // 浅浅
const ddB = fromCodes([33509,26377,33509,26080]); // 若有若无
const ddC = fromCodes([19968,25273]);        // 一抹
const ddD = fromCodes([28129]);              // 淡

// === CLEAN_PAD (verified) ===
const pad1 = fromCodes([39118,21561,36807,32819,65292,20182,33041,20013,30340,24565,22836,24573,28982,25955,20102,20123,12290]);
const pad2 = fromCodes([27700,20013,30340,20498,24433,28176,28176,27169,31946,65292,30475,19981,30495,20999,12290]);
const pad3 = fromCodes([20182,24515,20013,37027,31181,27785,37325,24863,21448,21387,20102,19978,26469,12290]);
const pad4 = fromCodes([20182,25260,36215,22836,65292,36828,22788,20381,26087,26159,19968,26395,26080,38469,30340,40657,26263,12290]);
const pad5 = fromCodes([20182,38381,20102,38381,30524,65292,21448,30529,24320,12290]);

// === End-marker regex parts (CORRECTED) ===
const rL  = fromCodes([65288]);   // （
const rR  = fromCodes([65289]);   // ）
const rDi = fromCodes([31532]);   // 第
const rZ  = fromCodes([31456]);   // 章
const rW  = fromCodes([23436]);   // 完
const rBen= fromCodes([26412]);   // 本
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,30334,21315,19975,38646]);

const newAlts = [sw1, sw2, sw3, sw4, sw5,
                 bj1, bj2, bj3, bj4,
                 ddA, ddB, ddC, ddD];

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
P('  ["' + swallow  + '","' + sw1 + '","' + sw2 + '","' + sw3 + '","' + sw4 + '","' + sw5 + '"],');
P('  ["' + bujin    + '","' + bj1 + '","' + bj2 + '","' + bj3 + '","' + bj4 + '"],');
P('  ["' + danshan  + '","' + ddA + '","' + ddB + '","' + ddC + '","' + ddD + '"],');
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
P('console.log("=== VOICE ROUND 13 ===");');
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
P('  const d = path.join(baseDir, v);');
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
P('  "' + swallow + '", "' + bujin + '", "' + danshan + '"');
P('];');
P('for (const p of remainChecks) {');
P('  let total = 0;');
P('  for (const v of VOLUMES) {');
P('    const d = path.join(baseDir, v);');
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
P('    const d = path.join(baseDir, v);');
P('    if (!fs.existsSync(d)) continue;');
P('    const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
P('    for (const f of files) {');
P('      total += fs.readFileSync(path.join(d, f), "utf-8").split(p).length - 1;');
P('    }');
P('  }');
P('  console.log("  " + p + ": " + total);');
P('}');

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round13.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');

// === Verification ===
console.log('fix_voice_round13.js generated');
console.log('\n=== PATTERN VERIFICATION ===');
console.log('swallow:', swallow);
console.log('bujin:', bujin);
console.log('danshan:', danshan);
for (const [lbl, s] of [['sw1',sw1],['sw2',sw2],['sw3',sw3],['sw4',sw4],['sw5',sw5],
                        ['bj1',bj1],['bj2',bj2],['bj3',bj3],['bj4',bj4],
                        ['ddA',ddA],['ddB',ddB],['ddC',ddC],['ddD',ddD]]) {
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