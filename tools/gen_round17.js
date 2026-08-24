const fs = require('fs');
const path = require('path');
const fromCodes = (cs) => cs.map(c => String.fromCharCode(c)).join('');

// === Patterns (verified via get_r17_codes.js) ===
const joints_white = fromCodes([25351,33410,21457,30333]);    // 指节发白
const joints_pale  = fromCodes([25351,33410,27867,30333]);    // 指节泛白
const chest_dull   = fromCodes([33016,21475,38391]);          // 胸口闷
const corner_slightly = fromCodes([22068,35282,24494,24494]); // 嘴角微微
const corner_gently  = fromCodes([22068,35282,36731,36731]);  // 嘴角轻轻
const before_appear  = fromCodes([30524,21069,28014,29616]);  // 眼前浮现
const nail_squeeze   = fromCodes([25351,30002,25488]);        // 指甲掐
const palm_seep      = fromCodes([25484,24515,28183,20986]);  // 掌心渗出
const voice_tremble  = fromCodes([22768,38899,26377,20123,39076,25238]); // 声音有些颤抖

// === Alternatives ===
// 指节发白 -> 6
const jw1 = fromCodes([25351,33410,21676,32039]);           // 指节咬紧
const jw2 = fromCodes([25351,33410,29983,30140]);           // 指节生疼
const jw3 = fromCodes([25351,33410,21457,20725]);           // 指节发僵
const jw4 = fromCodes([25351,20851,33410,21457,30333]);     // 指关节发白
const jw5 = fromCodes([25351,30002,38519,36827,32905,37324]); // 指甲陷进肉里
const jw6 = fromCodes([25163,25351,25893,24471,21457,20725]); // 手指攥得发僵

// 指节泛白 -> 5
const jp1 = fromCodes([25351,33410,21676,32039]);           // 指节咬紧
const jp2 = fromCodes([25351,33410,29983,30140]);           // 指节生疼
const jp3 = fromCodes([25351,20851,33410,27867,30333]);     // 指关节泛白
const jp4 = fromCodes([25351,30002,38519,36827,32905,37324]); // 指甲陷进肉里
const jp5 = fromCodes([25163,25351,25893,24471,21457,20725]); // 手指攥得发僵

// 胸口闷 -> 6
const cd1 = fromCodes([24515,21475,22581]);                 // 心口堵
const cd2 = fromCodes([24515,21475,32039]);                 // 心口紧
const cd3 = fromCodes([33016,33108,22581]);                 // 胸腔堵
const cd4 = fromCodes([33016,21475,21457,22581]);           // 胸口发堵
const cd5 = fromCodes([33016,21475,21457,32039]);           // 胸口发紧
const cd6 = fromCodes([24515,21475,21457,27785]);           // 心口发沉

// 嘴角微微 -> 4
const cs1 = fromCodes([22068,35282,25277,21160]);           // 嘴角抽动
const cs2 = fromCodes([22068,35282,19968,25277]);           // 嘴角一抽
const cs3 = fromCodes([22068,35282,21160,20102,21160]);     // 嘴角动了动
const cs4 = fromCodes([22068,35282,25199,20102,25199]);     // 嘴角扯了扯

// 嘴角轻轻 -> 4
const cg1 = fromCodes([22068,35282,25277,21160]);           // 嘴角抽动
const cg2 = fromCodes([22068,35282,19968,25277]);           // 嘴角一抽
const cg3 = fromCodes([22068,35282,21160,20102,21160]);     // 嘴角动了动
const cg4 = fromCodes([22068,35282,25199,20102,25199]);     // 嘴角扯了扯

// 眼前浮现 -> 5
const ba1 = fromCodes([30524,21069,20986,29616]);           // 眼前出现
const ba2 = fromCodes([30524,21069,23637,24320]);           // 眼前展开
const ba3 = fromCodes([30524,21069,26174,29616]);           // 眼前显现
const ba4 = fromCodes([30524,21069,21576,29616]);           // 眼前呈现
const ba5 = fromCodes([30524,21069,26144,20986]);           // 眼前映出

// 指甲掐 -> 4
const ns1 = fromCodes([25351,30002,25248]);                 // 指甲抠
const ns2 = fromCodes([25351,30002,25235]);                 // 指甲抓
const ns3 = fromCodes([25351,30002,25488,20837]);           // 指甲掐入
const ns4 = fromCodes([25351,30002,25488,36827]);           // 指甲掐进

// 掌心渗出 -> 4
const ps1 = fromCodes([25484,24515,20882,20986]);           // 掌心冒出
const ps2 = fromCodes([25484,24515,20882,27735]);           // 掌心冒汗
const ps3 = fromCodes([25484,24515,21457,27735]);           // 掌心发汗
const ps4 = fromCodes([25484,24515,20986,32454,27735]);     // 掌心出细汗

// 声音有些颤抖 -> 4
const vt1 = fromCodes([22768,38899,21457,39076]);           // 声音发颤
const vt2 = fromCodes([22768,38899,39076,25238]);           // 声音颤抖
const vt3 = fromCodes([22768,38899,21457,25238]);           // 声音发抖
const vt4 = fromCodes([22768,38899,25238,36215,26469]);     // 声音抖起来

// === CLEAN_PAD ===
const pad1 = fromCodes([22681,19978,30340,28783,20809,24573,26126,24573,26263,12290]);
const pad2 = fromCodes([22235,21608,38745,24471,36830,33258,24049,30340,21628,21560,22768,37117,21548,24471,35265,12290]);
const pad3 = fromCodes([31354,27668,20223,20315,20957,22266,20102,19968,33324,65292,35841,20063,27809,26377,20877,35828,35805,12290]);
const pad4 = fromCodes([36828,22788,30340,20809,32447,28176,28176,26263,20102,19979,26469,12290]);
const pad5 = fromCodes([20182,27785,40664,30528,65292,27809,26377,22238,31572,12290]);

// === End-marker regex parts ===
const rL  = fromCodes([65288]);
const rR  = fromCodes([65289]);
const rDi = fromCodes([31532]);
const rZ  = fromCodes([31456]);
const rW  = fromCodes([23436]);
const rBen= fromCodes([26412]);
const rNums = fromCodes([19968,20108,19977,22235,20116,20845,19971,20843,20061,21313,30334,21315,19975,38646]);

const newAlts = [jw1,jw2,jw3,jw4,jw5,jw6,
                 jp1,jp2,jp3,jp4,jp5,
                 cd1,cd2,cd3,cd4,cd5,cd6,
                 cs1,cs2,cs3,cs4,
                 cg1,cg2,cg3,cg4,
                 ba1,ba2,ba3,ba4,ba5,
                 ns1,ns2,ns3,ns4,
                 ps1,ps2,ps3,ps4,
                 vt1,vt2,vt3,vt4];

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
P('  ["' + voice_tremble + '","' + vt1 + '","' + vt2 + '","' + vt3 + '","' + vt4 + '"],');
P('  ["' + joints_white + '","' + jw1 + '","' + jw2 + '","' + jw3 + '","' + jw4 + '","' + jw5 + '","' + jw6 + '"],');
P('  ["' + joints_pale  + '","' + jp1 + '","' + jp2 + '","' + jp3 + '","' + jp4 + '","' + jp5 + '"],');
P('  ["' + corner_slightly + '","' + cs1 + '","' + cs2 + '","' + cs3 + '","' + cs4 + '"],');
P('  ["' + corner_gently  + '","' + cg1 + '","' + cg2 + '","' + cg3 + '","' + cg4 + '"],');
P('  ["' + before_appear  + '","' + ba1 + '","' + ba2 + '","' + ba3 + '","' + ba4 + '","' + ba5 + '"],');
P('  ["' + palm_seep      + '","' + ps1 + '","' + ps2 + '","' + ps3 + '","' + ps4 + '"],');
P('  ["' + chest_dull     + '","' + cd1 + '","' + cd2 + '","' + cd3 + '","' + cd4 + '","' + cd5 + '","' + cd6 + '"],');
P('  ["' + nail_squeeze   + '","' + ns1 + '","' + ns2 + '","' + ns3 + '","' + ns4 + '"],');
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
P('console.log("=== VOICE ROUND 17 ===");');
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
P('  "' + joints_white + '", "' + joints_pale + '", "' + chest_dull + '",');
P('  "' + corner_slightly + '", "' + corner_gently + '",');
P('  "' + before_appear + '", "' + nail_squeeze + '", "' + palm_seep + '",');
P('  "' + voice_tremble + '"');
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

const outPath = path.join(process.cwd(), 'tools', 'fix_voice_round17.js');
fs.writeFileSync(outPath, L.join('\n'), 'utf-8');

// === Verification ===
console.log('fix_voice_round17.js generated');
console.log('\n=== PATTERN VERIFICATION ===');
console.log('joints_white:', joints_white);
console.log('joints_pale:', joints_pale);
console.log('chest_dull:', chest_dull);
console.log('corner_slightly:', corner_slightly);
console.log('corner_gently:', corner_gently);
console.log('before_appear:', before_appear);
console.log('nail_squeeze:', nail_squeeze);
console.log('palm_seep:', palm_seep);
console.log('voice_tremble:', voice_tremble);
for (const [lbl, s] of [
  ['jw1',jw1],['jw2',jw2],['jw3',jw3],['jw4',jw4],['jw5',jw5],['jw6',jw6],
  ['jp1',jp1],['jp2',jp2],['jp3',jp3],['jp4',jp4],['jp5',jp5],
  ['cd1',cd1],['cd2',cd2],['cd3',cd3],['cd4',cd4],['cd5',cd5],['cd6',cd6],
  ['cs1',cs1],['cs2',cs2],['cs3',cs3],['cs4',cs4],
  ['cg1',cg1],['cg2',cg2],['cg3',cg3],['cg4',cg4],
  ['ba1',ba1],['ba2',ba2],['ba3',ba3],['ba4',ba4],['ba5',ba5],
  ['ns1',ns1],['ns2',ns2],['ns3',ns3],['ns4',ns4],
  ['ps1',ps1],['ps2',ps2],['ps3',ps3],['ps4',ps4],
  ['vt1',vt1],['vt2',vt2],['vt3',vt3],['vt4',vt4]
]) {
  console.log(lbl + ': "' + s + '" (' + s.length + ' chars)');
}
console.log('\n=== CLEAN_PAD ===');
for (const [lbl, pd] of [['pad1',pad1],['pad2',pad2],['pad3',pad3],['pad4',pad4],['pad5',pad5]]) {
  console.log(lbl + ': "' + pd + '"');
}
console.log('\nDone');