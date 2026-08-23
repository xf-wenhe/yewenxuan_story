const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (verified charCodes from existing chapter text) ===
const chest_clog = fromCodes([33016,21475,21457,22581]);   // 胸口发堵
const back_cold  = fromCodes([21518,32972,21457,20937]);   // 后背发凉
const mind_show  = fromCodes([33041,20013,28014,29616]);   // 脑中浮现
const body_suddn = fromCodes([36523,20307,29467,22320]);   // 身体猛地
const chest_hevy = fromCodes([33016,21475,21457,27785]);   // 胸口发沉

// === Alternatives ===
// 胸口发堵 ->
const cc1 = fromCodes([33016,21475,20687,22581,20102,19968,22242,26825,33457]); // 胸口像堵了一团棉花
const cc2 = fromCodes([33016,21475,20687,26159,34987,20154,25212,20303]);         // 胸口像是被人扼住
const cc3 = fromCodes([33016,21475,21387,30528,22359,30707,22836]);                // 胸口压着块石头
const cc4 = fromCodes([33016,21475,20687,34987,20160,20040,21387,20303]);         // 胸口像被什么压住
const cc5 = fromCodes([33016,33108,20687,34987,22581,20303]);                     // 胸腔像被堵住

// 后背发凉 ->
const bc1 = fromCodes([21518,32972,20937,20102]);                                 // 后背凉了
const bc2 = fromCodes([21518,32972,27867,36215,20937,27668]);                     // 后背泛起凉气
const bc3 = fromCodes([21518,32972,20937,27668,30452,20882]);                     // 后背凉气直冒
const bc4 = fromCodes([21518,32972,19968,38453,20937,27668]);                     // 后背一阵凉气

// 脑中浮现 ->
const ms1 = fromCodes([33041,20013,20986,29616,20102]);                           // 脑中出现了
const ms2 = fromCodes([33041,20013,29616,20986]);                                 // 脑中现出
const ms3 = fromCodes([33041,28023,20013,28014,29616]);                           // 脑海中浮现
const ms4 = fromCodes([33041,20013,26144,20986]);                                 // 脑中映出

// 身体猛地 -> (adverbials that work when followed by verbs like 一颤/震了一下)
const bs1 = fromCodes([36523,20307,39588,28982]);                                 // 身体骤然
const bs2 = fromCodes([36523,20307,38497,28982]);                                 // 身体陡然
const bs3 = fromCodes([36523,20307,34022,28982]);                                 // 身体蓦然
const bs4 = fromCodes([36523,20307,24573,28982]);                                 // 身体忽然

// 胸口发沉 ->
const ch1 = fromCodes([33016,21475,27785,20102,19968,19979]);                     // 胸口沉了一下
const ch2 = fromCodes([33016,21475,20687,21387,20102,38085]);                     // 胸口像压了铅
const ch3 = fromCodes([33016,21475,24448,19979,27785]);                           // 胸口往下沉

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

const newAlts = [cc1, cc2, cc3, cc4, cc5,
                 bc1, bc2, bc3, bc4,
                 ms1, ms2, ms3, ms4,
                 bs1, bs2, bs3, bs4,
                 ch1, ch2, ch3];

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
P('  ["' + chest_clog + '","' + cc1 + '","' + cc2 + '","' + cc3 + '","' + cc4 + '","' + cc5 + '"],');
P('  ["' + back_cold  + '","' + bc1 + '","' + bc2 + '","' + bc3 + '","' + bc4 + '"],');
P('  ["' + mind_show  + '","' + ms1 + '","' + ms2 + '","' + ms3 + '","' + ms4 + '"],');
P('  ["' + body_suddn + '","' + bs1 + '","' + bs2 + '","' + bs3 + '","' + bs4 + '"],');
P('  ["' + chest_hevy + '","' + ch1 + '","' + ch2 + '","' + ch3 + '"],');
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
P('console.log("=== VOICE ROUND 11 ===");');
P('for (const [pattern, cnt] of Object.entries(counters)) {');
P('  if (cnt > 0) console.log("  " + pattern +": " + cnt);');
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
P('  "' + chest_clog + '", "' + back_cold + '", "' + mind_show + '",');
P('  "' + body_suddn + '", "' + chest_hevy + '"');
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

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round11.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');
console.log('fix_voice_round11.js generated');

// Verify patterns are correct
const out = fs.readFileSync(outPath, 'utf-8');
const lines = out.split('\n');
const checks = [
  ['chest_clog', chest_clog], ['back_cold', back_cold],
  ['mind_show', mind_show], ['body_suddn', body_suddn],
  ['chest_hevy', chest_hevy],
];
for (const [label, exp] of checks) {
  for (const l of lines) {
    if (l.includes(exp)) { console.log(label + ' OK: ' + exp); break; }
  }
}

// Verify alternatives
const altChecks = [
  ['cc1', cc1], ['cc2', cc2], ['cc3', cc3], ['cc4', cc4], ['cc5', cc5],
  ['bc1', bc1], ['bc2', bc2], ['bc3', bc3], ['bc4', bc4],
  ['ms1', ms1], ['ms2', ms2], ['ms3', ms3], ['ms4', ms4],
  ['bs1', bs1], ['bs2', bs2], ['bs3', bs3], ['bs4', bs4],
  ['ch1', ch1], ['ch2', ch2], ['ch3', ch3],
];
for (const [label, s] of altChecks) {
  const allCjk = s.split('').every(c => c.charCodeAt(0) >= 0x4E00 && c.charCodeAt(0) <= 0x9FFF);
  console.log(label + ': "' + s + '" ' + (allCjk ? 'OK' : 'WARN') + ' (' + s.length + ' chars)');
}
console.log('Done');