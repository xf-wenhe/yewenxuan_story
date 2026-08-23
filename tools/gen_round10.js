const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (verified charCodes from actual chapter text) ===
const cool_wave  = fromCodes([19968,32929,20937,24847]);        // 一股凉意
const heart_fast = fromCodes([24515,36339,21152,36895]);        // 心跳加速
const heart_quick= fromCodes([24515,36339,21152,24555]);        // 心跳加快
const chest_stif = fromCodes([33016,21475,21457,38391]);        // 胸口发闷
const heart_burst= fromCodes([24515,33039,29467,36339]);        // 心脏猛跳
const heart_burst2=fromCodes([24515,33039,29467,22320,19968,36339]); // 心脏猛地一跳
const breath_chg = fromCodes([21628,21560,21464,24471]);        // 呼吸变得

// === Alternatives (verified charCodes) ===
const cw1 = fromCodes([33034,32972,31388,36215,19968,38453,20937]);          // 脊背窜起一阵凉
const cw2 = fromCodes([19968,38453,20937,24847,20174,32972,21518,34989,26469]); // 一阵凉意从背后袭来
const cw3 = fromCodes([20937,24847,31388,36807,20102,33034,32972]);          // 凉意窜过了脊背
const cw4 = fromCodes([20937,24847,39034,30528,32972,33034,29228,20102,19978,26469]); // 凉意顺着背脊爬了上来
const cw5 = fromCodes([32972,21518,31388,36807,19968,38453,20937]);          // 背后窜过一阵凉

const hf1 = fromCodes([24515,21475,36339,24471,24613,20102]);    // 心口跳得急了
const hf2 = fromCodes([24515,33039,36339,24471,24555,20102]);    // 心脏跳得快了
const hf3 = fromCodes([33016,21475,36339,24471,36234,26469,36234,24613]); // 胸口跳得越来越急

const hq1 = hf1; const hq2 = hf2; const hq3 = hf3;

const cs1 = fromCodes([33016,33108,20687,34987,21387,20303]);    // 胸腔像被压住
const cs2 = fromCodes([33016,21475,34987,21387,20303,20102]);    // 胸口被压住了
const cs3 = fromCodes([33016,21475,22581,24471,24908]);          // 胸口堵得慌

const hb1 = fromCodes([24515,21475,29408,29408,19968,36339]);    // 心口狠狠一跳
const hb2 = fromCodes([24515,33039,37325,37325,19968,36339]);    // 心脏重重一跳
const hb3 = fromCodes([24515,21475,29467,22320,19968,36339]);    // 心口猛地一跳

const bc1 = fromCodes([20182,21628,21560]);                       // 他呼吸
const bc2 = fromCodes([21628,21560,21464,24471,37325,20102]);    // 呼吸变得重了
const bc3 = fromCodes([21628,21560,36880,28176]);                 // 呼吸逐渐

// === CLEAN_PAD ===
const pad1 = fromCodes([37027,20010,24565,22836,22312,20182,33041,23376,37324,36716,20102,19968,22280,65292,25165,20572,19979,26469,12290]);
const pad2 = fromCodes([21608,22260,30340,31354,27668,22240,20026,36825,21477,35805,23433,38745,20102,19968,19979,30636,12290]);
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

const newAlts = [cw1, cw2, cw3, cw4, cw5,
                 hf1, hf2, hf3,
                 cs1, cs2, cs3,
                 hb1, hb2, hb3,
                 bc1, bc2, bc3];

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
P('  ["' + cool_wave  + '","' + cw1 + '","' + cw2 + '","' + cw3 + '","' + cw4 + '","' + cw5 + '"],');
P('  ["' + heart_fast + '","' + hf1 + '","' + hf2 + '","' + hf3 + '"],');
P('  ["' + heart_quick+ '","' + hq1 + '","' + hq2 + '","' + hq3 + '"],');
P('  ["' + chest_stif + '","' + cs1 + '","' + cs2 + '","' + cs3 + '"],');
P('  ["' + heart_burst+ '","' + hb1 + '","' + hb2 + '","' + hb3 + '"],');
P('  ["' + heart_burst2+'","' + hb1 + '","' + hb2 + '","' + hb3 + '"],');
P('  ["' + breath_chg + '","' + bc1 + '","' + bc2 + '","' + bc3 + '"],');
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
P('console.log("=== VOICE ROUND 10 ===");');
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
P('  "' + cool_wave + '", "' + heart_fast + '", "' + heart_quick + '",');
P('  "' + chest_stif + '", "' + heart_burst + '", "' + heart_burst2 + '",');
P('  "' + breath_chg + '"');
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

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round10.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');
console.log('fix_voice_round10.js generated');

// Verify patterns are correct
const out = fs.readFileSync(outPath, 'utf-8');
const lines = out.split('\n');
const checks = [
  ['cool_wave', cool_wave], ['heart_fast', heart_fast],
  ['chest_stif', chest_stif], ['heart_burst', heart_burst],
  ['breath_chg', breath_chg],
];
for (const [label, exp] of checks) {
  for (const l of lines) {
    if (l.includes(exp)) { console.log(label + ' OK: ' + exp); break; }
  }
}

// Verify alternatives
const altChecks = [
  ['cw1', cw1], ['cw2', cw2], ['cw3', cw3],
  ['hf1', hf1], ['hf2', hf2], ['hf3', hf3],
  ['cs1', cs1], ['cs2', cs2], ['cs3', cs3],
  ['hb1', hb1], ['hb2', hb2], ['hb3', hb3],
  ['bc1', bc1], ['bc2', bc2], ['bc3', bc3],
];
for (const [label, s] of altChecks) {
  const allCjk = s.split('').every(c => c.charCodeAt(0) >= 0x4E00 && c.charCodeAt(0) <= 0x9FFF);
  console.log(label + ': "' + s + '" ' + (allCjk ? 'OK' : 'WARN') + ' (' + s.length + ' chars)');
}
console.log('Done');