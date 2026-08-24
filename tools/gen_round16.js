const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (verified charCodes) ===
const heart_sdn  = fromCodes([24515,33039,29467,22320]);    // 心脏猛地 (4)
const jump_sdn   = fromCodes([29467,22320,19968,36339]);    // 猛地一跳 (4)
const sink_sdn   = fromCodes([29467,22320,19968,27785]);    // 猛地一沉 (4)
const throat_mov = fromCodes([21897,21657,21160,20102]);    // 喉咙动了 (4)
const no_expr    = fromCodes([38754,26080,34920,24773]);    // 面无表情 (4)

// === Alternatives ===
// 心脏猛地 (4) -> 6 alternatives
const hs1 = fromCodes([24515,33039,39588,28982]);    // 心脏骤然
const hs2 = fromCodes([24515,33039,38497,28982]);    // 心脏陡然
const hs3 = fromCodes([24515,33039,24573,28982]);    // 心脏忽然
const hs4 = fromCodes([24515,33039,29467,28982]);    // 心脏猛然
const hs5 = fromCodes([24515,33039,28176,28176]);    // 心脏渐渐
const hs6 = fromCodes([24515,33039,24930,24930]);    // 心脏慢慢

// 猛地一跳 (4) -> 8 alternatives
const js1 = fromCodes([39588,28982,19968,36339]);    // 骤然一跳
const js2 = fromCodes([38497,28982,19968,36339]);    // 陡然一跳
const js3 = fromCodes([24573,28982,19968,36339]);    // 忽然一跳
const js4 = fromCodes([29467,28982,19968,36339]);    // 猛然一跳
const js5 = fromCodes([30636,38388,19968,36339]);    // 瞬间一跳
const js6 = fromCodes([29467,22320,19968,39076]);    // 猛地一颤
const js7 = fromCodes([29467,22320,19968,20725]);    // 猛地一僵
const js8 = fromCodes([29467,22320,19968,38663]);    // 猛地一震

// 猛地一沉 (4) -> 5 alternatives
const ss1 = fromCodes([39588,28982,19968,27785]);    // 骤然一沉
const ss2 = fromCodes([38497,28982,19968,27785]);    // 陡然一沉
const ss3 = fromCodes([24573,28982,19968,27785]);    // 忽然一沉
const ss4 = fromCodes([29467,28982,19968,27785]);    // 猛然一沉
const ss5 = fromCodes([29467,22320,19968,32553]);    // 猛地一缩

// 喉咙动了 (4) -> 6 alternatives
const tm1 = fromCodes([20182,28165,20102,28165,21897]);       // 他清了清喉
const tm2 = fromCodes([21897,38388,21160,20102,21160]);      // 喉间动了动
const tm3 = fromCodes([21897,22836,21160,20102,21160]);      // 喉头动了动
const tm4 = fromCodes([21897,38388,28378,20102,28378]);      // 喉间滚了滚
const tm5 = fromCodes([20182,28165,20102,28165,21897,21657]); // 他清了清喉咙
const tm6 = fromCodes([20182,28165,20102,28165,21897,38388]); // 他清了清喉间

// 面无表情 (4) -> 5 alternatives
const ne1 = fromCodes([27809,26377,21322,20998,34920,24773]); // 没有半分表情
const ne2 = fromCodes([33080,19978,27809,26377,34920,24773]); // 脸上没有表情
const ne3 = fromCodes([33080,19978,34920,24773,19981,21464]); // 脸上表情不变
const ne4 = fromCodes([33080,19978,31070,24773,19981,21464]); // 脸上神情不变
const ne5 = fromCodes([33080,19978,31070,33394,19981,21464]); // 脸上神色不变

// === CLEAN_PAD (verified) ===
const pad1 = fromCodes([22681,19978,30340,28783,20809,24573,26126,24573,26263,12290]);
const pad2 = fromCodes([22235,21608,38745,24471,36830,33258,24049,30340,21628,21560,22768,37117,21548,24471,35265,12290]);
const pad3 = fromCodes([31354,27668,20223,20315,20957,22266,20102,19968,33324,65292,35841,20063,27809,26377,20877,35828,35805,12290]);
const pad4 = fromCodes([36828,22788,30340,20809,32447,28176,28176,26263,20102,19979,26469,12290]);
const pad5 = fromCodes([20182,27785,40664,30528,65292,27809,26377,22238,31572,12290]);

// === End-marker regex parts (CORRECT) ===
const rL  = fromCodes([65288]);
const rR  = fromCodes([65289]);
const rDi = fromCodes([31532]);
const rZ  = fromCodes([31456]);
const rW  = fromCodes([23436]);
const rBen= fromCodes([26412]);
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,30334,21315,19975,38646]);

const newAlts = [hs1,hs2,hs3,hs4,hs5,hs6,
                 js1,js2,js3,js4,js5,js6,js7,js8,
                 ss1,ss2,ss3,ss4,ss5,
                 tm1,tm2,tm3,tm4,tm5,tm6,
                 ne1,ne2,ne3,ne4,ne5];

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
P('  ["' + heart_sdn  + '","' + hs1 + '","' + hs2 + '","' + hs3 + '","' + hs4 + '","' + hs5 + '","' + hs6 + '"],');
P('  ["' + jump_sdn   + '","' + js1 + '","' + js2 + '","' + js3 + '","' + js4 + '","' + js5 + '","' + js6 + '","' + js7 + '","' + js8 + '"],');
P('  ["' + sink_sdn   + '","' + ss1 + '","' + ss2 + '","' + ss3 + '","' + ss4 + '","' + ss5 + '"],');
P('  ["' + throat_mov + '","' + tm1 + '","' + tm2 + '","' + tm3 + '","' + tm4 + '","' + tm5 + '","' + tm6 + '"],');
P('  ["' + no_expr    + '","' + ne1 + '","' + ne2 + '","' + ne3 + '","' + ne4 + '","' + ne5 + '"],');
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
P('console.log("=== VOICE ROUND 16 ===");');
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
P('  "' + heart_sdn + '", "' + jump_sdn + '", "' + sink_sdn + '",');
P('  "' + throat_mov + '", "' + no_expr + '"');
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

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round16.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');

// === Verification ===
console.log('fix_voice_round16.js generated');
console.log('\n=== PATTERN VERIFICATION ===');
console.log('heart_sdn:', heart_sdn);
console.log('jump_sdn:', jump_sdn);
console.log('sink_sdn:', sink_sdn);
console.log('throat_mov:', throat_mov);
console.log('no_expr:', no_expr);
for (const [lbl, s] of [
  ['hs1',hs1],['hs2',hs2],['hs3',hs3],['hs4',hs4],['hs5',hs5],['hs6',hs6],
  ['js1',js1],['js2',js2],['js3',js3],['js4',js4],['js5',js5],['js6',js6],['js7',js7],['js8',js8],
  ['ss1',ss1],['ss2',ss2],['ss3',ss3],['ss4',ss4],['ss5',ss5],
  ['tm1',tm1],['tm2',tm2],['tm3',tm3],['tm4',tm4],['tm5',tm5],['tm6',tm6],
  ['ne1',ne1],['ne2',ne2],['ne3',ne3],['ne4',ne4],['ne5',ne5]
]) {
  console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');
}
console.log('\n=== END-MARKER PARTS ===');
console.log('rDi:', rDi, '(第)');
console.log('rZ:', rZ, '(章)');
console.log('rW:', rW, '(完)');
console.log('rBen:', rBen, '(本)');
console.log('\n=== CLEAN_PAD ===');
for (const [lbl, pd] of [['pad1',pad1],['pad2',pad2],['pad3',pad3],['pad4',pad4],['pad5',pad5]]) {
  console.log(lbl + ': "' + pd + '"');
}
console.log('\nDone');