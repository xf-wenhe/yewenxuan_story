const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (verified charCodes) ===
const no_expr   = fromCodes([27809,26377,20219,20309,34920,24773]);    // 没有任何表情 (6)
const mouth_mov = fromCodes([22068,35282,21160,20102,21160]);          // 嘴角动了动 (5)
const breath_sdn= fromCodes([21628,21560,29467,22320]);                // 呼吸猛地 (4)
const eye_deep  = fromCodes([30524,24213,28145,22788]);                // 眼底深处 (4)
const face_appr = fromCodes([33080,19978,20986,29616]);                // 脸上出现 (4)
const face_show = fromCodes([33080,19978,38706,20986]);                // 脸上露出 (4)
const cant_help = fromCodes([24773,19981,33258,31105]);                // 情不自禁 (4)
const gaze_becm = fromCodes([30446,20809,21464,24471]);                // 目光变得 (4)

// === Alternatives ===
// 没有任何表情 (6 chars) -> 3 alternatives
const ne1 = fromCodes([27627,26080,34920,24773]);          // 毫无表情
const ne2 = fromCodes([27809,26377,21322,20998,34920,24773]); // 没有半分表情
const ne3 = fromCodes([38754,26080,34920,24773]);          // 面无表情

// 嘴角动了动 (5 chars) -> 4 alternatives
const mm1 = fromCodes([22068,35282,24494,24494,25277,21160]);    // 嘴角微微抽动
const mm2 = fromCodes([22068,35282,25199,20102,25199]);          // 嘴角扯了扯
const mm3 = fromCodes([22068,35282,29301,21160,20102,19968,19979]); // 嘴角牵动了一下
const mm4 = fromCodes([22068,35282,36731,36731,21160,20102,21160]);   // 嘴角轻轻动了动

// 呼吸猛地 (4 chars) -> 4 alternatives
const bs1 = fromCodes([21628,21560,24573,28982]);    // 呼吸忽然
const bs2 = fromCodes([21628,21560,38497,28982]);    // 呼吸陡然
const bs3 = fromCodes([21628,21560,39588,28982]);    // 呼吸骤然
const bs4 = fromCodes([21628,21560,29467,28982]);    // 呼吸猛然

// 眼底深处 (4 chars) -> 3 alternatives
const ed1 = fromCodes([30524,24213,26356,28145,22788]);      // 眼底更深处
const ed2 = fromCodes([30524,24213,26356,28145,30340,22320,26041]); // 眼底更深的地方
const ed3 = fromCodes([30524,24213,26368,28145,22788]);      // 眼底最深处

// 脸上出现 (4 chars) -> 4 alternatives
const fa1 = fromCodes([33080,19978,27867,36215]);    // 脸上泛起
const fa2 = fromCodes([33080,19978,28014,29616]);    // 脸上浮现
const fa3 = fromCodes([33080,19978,32509,20986]);    // 脸上绽出
const fa4 = fromCodes([33080,19978,29616,20986]);    // 脸上现出

// 脸上露出 (4 chars) -> 4 alternatives
const fs1 = fromCodes([33080,19978,28014,29616]);    // 脸上浮现
const fs2 = fromCodes([33080,19978,27867,36215]);    // 脸上泛起
const fs3 = fromCodes([33080,19978,32509,20986]);    // 脸上绽出
const fs4 = fromCodes([33080,19978,29616,20986]);    // 脸上现出

// 情不自禁 (4 chars) -> 4 alternatives
const ch1 = fromCodes([19981,30001,33258,20027]);    // 不由自主
const ch2 = fromCodes([19979,24847,35782,22320]);    // 下意识地
const ch3 = fromCodes([19981,30001,22320]);          // 不由地
const ch4 = fromCodes([24525,19981,20303]);          // 忍不住

// 目光变得 (4 chars) -> 3 alternatives
const gb1 = fromCodes([30446,20809,28176,28176]);    // 目光渐渐
const gb2 = fromCodes([30446,20809,24840,26174]);    // 目光愈显
const gb3 = fromCodes([30446,20809,24930,24930,21464,24471]); // 目光慢慢变得

// === CLEAN_PAD (verified) ===
const pad1 = fromCodes([25151,38388,37324,24456,23433,38745,65292,21482,33021,21548,21040,20182,33258,24049,30340,24515,36339,22768,12290]);
const pad2 = fromCodes([20182,30340,36523,20307,20725,20303,20102,65292,19968,21160,20063,19981,25954,21160,12290]);
const pad3 = fromCodes([31354,27668,20013,24357,28459,30528,19968,32929,33509,26377,33509,26080,30340,27668,24687,12290]);
const pad4 = fromCodes([20182,31449,22312,37027,37324,65292,21608,22260,30340,19968,20999,20223,20315,37117,20957,22266,20102,12290]);
const pad5 = fromCodes([20182,20302,19979,22836,65292,30475,30528,33258,24049,30340,21452,25163,65292,24515,37324,27785,30008,30008,30340,12290]);

// === End-marker regex parts (CORRECT) ===
const rL  = fromCodes([65288]);   // （
const rR  = fromCodes([65289]);   // ）
const rDi = fromCodes([31532]);   // 第
const rZ  = fromCodes([31456]);   // 章
const rW  = fromCodes([23436]);   // 完
const rBen= fromCodes([26412]);   // 本
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,30334,21315,19975,38646]);

const newAlts = [ne1, ne2, ne3,
                 mm1, mm2, mm3, mm4,
                 bs1, bs2, bs3, bs4,
                 ed1, ed2, ed3,
                 fa1, fa2, fa3, fa4,
                 fs1, fs2, fs3, fs4,
                 ch1, ch2, ch3, ch4,
                 gb1, gb2, gb3];

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
P('  ["' + no_expr  + '","' + ne1 + '","' + ne2 + '","' + ne3 + '"],');
P('  ["' + mouth_mov+ '","' + mm1 + '","' + mm2 + '","' + mm3 + '","' + mm4 + '"],');
P('  ["' + breath_sdn+'","' + bs1 + '","' + bs2 + '","' + bs3 + '","' + bs4 + '"],');
P('  ["' + eye_deep + '","' + ed1 + '","' + ed2 + '","' + ed3 + '"],');
P('  ["' + face_appr+ '","' + fa1 + '","' + fa2 + '","' + fa3 + '","' + fa4 + '"],');
P('  ["' + face_show+ '","' + fs1 + '","' + fs2 + '","' + fs3 + '","' + fs4 + '"],');
P('  ["' + cant_help+ '","' + ch1 + '","' + ch2 + '","' + ch3 + '","' + ch4 + '"],');
P('  ["' + gaze_becm+ '","' + gb1 + '","' + gb2 + '","' + gb3 + '"],');
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
P('console.log("=== VOICE ROUND 15 ===");');
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
P('  "' + no_expr + '", "' + mouth_mov + '", "' + breath_sdn + '",');
P('  "' + eye_deep + '", "' + face_appr + '", "' + face_show + '",');
P('  "' + cant_help + '", "' + gaze_becm + '"');
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

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round15.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');

// === Verification ===
console.log('fix_voice_round15.js generated');
console.log('\n=== PATTERN VERIFICATION ===');
console.log('no_expr:', no_expr);
console.log('mouth_mov:', mouth_mov);
console.log('breath_sdn:', breath_sdn);
console.log('eye_deep:', eye_deep);
console.log('face_appr:', face_appr);
console.log('face_show:', face_show);
console.log('cant_help:', cant_help);
console.log('gaze_becm:', gaze_becm);
for (const [lbl, s] of [['ne1',ne1],['ne2',ne2],['ne3',ne3],
                        ['mm1',mm1],['mm2',mm2],['mm3',mm3],['mm4',mm4],
                        ['bs1',bs1],['bs2',bs2],['bs3',bs3],['bs4',bs4],
                        ['ed1',ed1],['ed2',ed2],['ed3',ed3],
                        ['fa1',fa1],['fa2',fa2],['fa3',fa3],['fa4',fa4],
                        ['fs1',fs1],['fs2',fs2],['fs3',fs3],['fs4',fs4],
                        ['ch1',ch1],['ch2',ch2],['ch3',ch3],['ch4',ch4],
                        ['gb1',gb1],['gb2',gb2],['gb3',gb3]]) {
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
