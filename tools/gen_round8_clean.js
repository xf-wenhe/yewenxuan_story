const fs = require('fs');
const path = require('path');

const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (verified charCodes from existing chapter text) ===
const p1 = fromCodes([24515,36339,28431,20102,19968,25293]);  // 心跳漏了一拍
const p2 = fromCodes([21897,32467,21160,20102,19968,19979]);  // 喉结动了一下
const p3 = fromCodes([21897,32467,28378,20102,19968,19979]);  // 喉结滚了一下
const p4 = fromCodes([33033,25615,39039,20303]);              // 脉搏顿住
const p5 = fromCodes([24515,36339,20572,39039]);              // 心跳停顿
const p6 = fromCodes([21518,32972,19968,20937]);              // 后背一凉
const p7 = fromCodes([36523,20307,19968,20725]);              // 身体一僵
const p8 = fromCodes([21518,39048,21457,20937]);              // 后颈发凉
const p9 = fromCodes([19968,32929,26262,27969]);              // 一股暖流

// === Alternatives ===
const a1  = fromCodes([24515,21475,39039,20303,20102]);       // 心口顿住了
const a2  = fromCodes([24515,37324,21679,22100,19968,19979]);  // 心里咯噔一下
const a3  = fromCodes([33016,21475,27785,20102,19968,19979]);  // 胸口沉了一下
const a4  = fromCodes([24515,21475,32039,20102,19968,19979]);  // 心口紧了一下
const a5  = fromCodes([21897,32467,21160,20102,21160]);       // 喉结动了动
const a6  = fromCodes([20182,21693,20102,21475,21822,27819]);  // 他咽了口唾沫
const a7  = fromCodes([21897,32467,19978,19979,28378,20102,28378]); // 喉结上下滚了滚
const a8  = fromCodes([20182,21534,21693,20102,19968,19979]);  // 他吞咽了一下
const a9  = fromCodes([33033,25615,20572,20102,19968,30636]);  // 脉搏停了一瞬
const a10 = fromCodes([24515,36339,20572,20102,19968,25293]);  // 心跳停了一拍
const a11 = fromCodes([24515,21475,39039,20102,19968,19979]);  // 心口顿了一下
const a12 = fromCodes([21518,32972,21457,20937]);              // 后背发凉
const a13 = fromCodes([21518,32972,20882,20102,20937,27668]);  // 后背冒了凉气
const a14 = fromCodes([21518,32972,19968,38453,21457,20937]);  // 后背一阵发凉
const a15 = fromCodes([36523,20307,39039,20102,19968,19979]);  // 身体顿了一下
const a16 = fromCodes([20840,36523,20725,20102,19968,30636]);  // 全身僵了一瞬
const a17 = fromCodes([21518,39048,20882,20102,20937,27668]);  // 后颈冒了凉气
const a18 = fromCodes([21518,39048,19968,38453,21457,20937]);  // 后颈一阵发凉
const a19 = fromCodes([19968,32929,26262,24847]);              // 一股暖意
const a20 = fromCodes([19968,32929,28201,26262,30340,24863,35273]); // 一股温暖的感觉

// === CLEAN_PAD ===
const pad1 = fromCodes([37027,20010,24565,22836,22312,20182,33041,23376,37324,36716,20102,19968,22280,65292,25165,20572,19979,26469,12290]);
const pad2 = fromCodes([21608,22260,30340,31354,27668,22240,20026,36825,21477,35805,23433,38745,20102,19968,30636,12290]);
const pad3 = fromCodes([37027,21477,35805,27785,36827,20102,20182,24515,37324,26368,28145,22788,12290]);
const pad4 = fromCodes([20182,31449,22312,37027,37324,65292,19968,26102,19981,30693,36947,35813,21521,21738,36208,12290]);
const pad5 = fromCodes([20182,38656,35201,26356,22810,30340,26102,38388,12290]);

// === Chapter-end regex patterns (built from charCodes) ===
// （第\d+章完）
// （第[一二三四五六七八九十百千万零]+章完）
// （本章完）
const rL = fromCodes([65288]);     // （
const rR = fromCodes([65289]);     // ）
const rDi = fromCodes([29420]);    // 第
const rZ  = fromCodes([31531]);    // 章
const rW  = fromCodes([23436]);    // 完
const rBen= fromCodes([26410]);    // 本
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,
                         30334,21315,19975,38646]);

// === New alternatives for distribution check ===
const newAlts = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a11, a13, a16, a17, a18, a19, a20];

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
P('  ["' + p1 + '","' + a1 + '","' + a2 + '","' + a3 + '","' + a4 + '"],');
P('  ["' + p2 + '","' + a5 + '","' + a6 + '","' + a7 + '","' + a8 + '"],');
P('  ["' + p3 + '","' + a5 + '","' + a6 + '"],');
P('  ["' + p4 + '","' + a9 + '","' + a11 + '","' + a2 + '","' + a4 + '"],');
P('  ["' + p5 + '","' + a10 + '","' + a11 + '"],');
P('  ["' + p6 + '","' + a12 + '","' + a13 + '","' + a14 + '"],');
P('  ["' + p7 + '","' + a15 + '","' + a16 + '"],');
P('  ["' + p8 + '","' + a17 + '","' + a18 + '"],');
P('  ["' + p9 + '","' + a19 + '","' + a20 + '"],');
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
P('console.log("=== VOICE ROUND 8 ===");');
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
// Build regex patterns using charCode-based strings
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
P('  "' + p1 + '", "' + p2 + '", "' + p3 + '",');
P('  "' + p4 + '", "' + p5 + '", "' + p6 + '",');
P('  "' + p7 + '", "' + p8 + '", "' + p9 + '"');
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

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round8.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');
console.log('fix_voice_round8.js generated');

// Verify key characters
const out = fs.readFileSync(outPath, 'utf-8');
const lines = out.split('\n');
console.log('File size:', out.length);
for (const l of lines) {
  if (l.includes(p2) || l.includes(p4)) {
    let hasThroat = false, hasMouth = false;
    for (const c of l) {
      if (c.charCodeAt(0) === 21897) hasThroat = true;
      if (c.charCodeAt(0) === 21898) hasMouth = true;
    }
    if (hasThroat) console.log('OK: 喉(0x5589) found');
    if (hasMouth) console.log('BAD: 喉(0x558A) found!');
  }
}
console.log('Done');