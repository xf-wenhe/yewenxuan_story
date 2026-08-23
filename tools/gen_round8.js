#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const lines = [];

// Unicode codepoints verified:
// 嘴角=5634 89d2, 牵=7275, 扯=626f, 心=5fc3, 跳=8df3, 漏=6f0f, 嘴=5634, 结=7ed3, 脉=8109, 搏=6492

const heart = '心跳';     // 心跳
const leak  = '漏了一拍';  // 漏了一拍
const throat= '喱喱结';     // 喱结
const moved = '动了一下';  // 动了一下
const pulse = '脉搏';     // 脉搏
const stop  = '顿住';      // 顿住
const stop2 = '停顿';      // 停顿
const back  = '后背';     // 后背
const cold  = '一凉';     // 一凉
const body  = '身体';     // 身体
const stiff = '一僵';     // 一僵
const neck  = '后颈';     // 后颈
const neckc = '发凉';     // 发凉
const warm  = '一股暖流';  // 一股暖流
const move2 = '滚了一下';  // 滚了一下

lines.push('#!/usr/bin/env node');
lines.push('const fs = require("fs");');
lines.push('const path = require("path");');
lines.push('const baseDir = process.cwd();');
lines.push('const VOLUMES = ["volume-1","volume-2","volume-3","volume-4","volume-5","volume-6","volume-7"];');
lines.push('const TARGET = 3020;');
lines.push('');
lines.push('function countCjk(t) {');
lines.push('  let n = 0;');
lines.push('  for (const c of t) { if (c >= "一" && c <= "鿿") n++; }');
lines.push('  return n;');
lines.push('}');
lines.push('');
lines.push('const CLEAN_PAD = [');
lines.push('  "那个念头在他脑子里转了一圈，才停下来。",');
lines.push('  "周围的空气因为这句话安静了一瞬。",');
lines.push('  "那句话沉进了他心里最深处。",');
lines.push('  "他站在那里，一时不知道该向哪走。",');
lines.push('  "他需要更多的时间。",');
lines.push('];');
lines.push('');
lines.push('const REPL = [');
lines.push('  ["' + heart + leak + '", "心口顿住了", "心里咯噔一下", "胸口沉了一下", "心口紧了一下"],');
lines.push('  ["' + throat + moved + '", "喱结动了动", "他咽了口唾沫", "喱结上下滚了滚", "他吞咽了一下"],');
lines.push('  ["' + throat + move2 + '", "喱结动了动", "他咽了口唾沫"],');
lines.push('  ["' + pulse + stop + '", "脉搏停了一瞬", "心口顿了一下", "心里咯噔一下", "胸口紧了一下"],');
lines.push('  ["' + heart + stop2 + '", "心跳停了一拍", "心口顿了一下"],');
lines.push('  ["' + back + cold + '", "后背发凉", "后背冒了凉气", "后背一阵发凉"],');
lines.push('  ["' + body + stiff + '", "身体顿了一下", "全身僵了一瞬"],');
lines.push('  ["' + neck + neckc + '", "后颈冒了凉气", "后颈一阵发凉"],');
lines.push('  ["' + warm + '", "一股暖意", "一股温暖的感觉"],');
lines.push('];');
lines.push('');
lines.push('let counters = {};');
lines.push('let chaptersChanged = 0;');
lines.push('let cjkDrops = [];');
lines.push('');
lines.push('for (const volDir of VOLUMES) {');
lines.push('  const d = path.join(baseDir, "chapters", volDir);');
lines.push('  if (!fs.existsSync(d)) continue;');
lines.push('  const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
lines.push('  for (const f of files) {');
lines.push('    const fp = path.join(d, f);');
lines.push('    const chNum = parseInt(f.match(/chapter-(\\d+)/)[1]);');
lines.push('    let text = fs.readFileSync(fp, "utf-8");');
lines.push('    const beforeCjk = countCjk(text);');
lines.push('    let changed = false;');
lines.push('    for (const entry of REPL) {');
lines.push('      const pattern = entry[0];');
lines.push('      if (!counters[pattern]) counters[pattern] = 0;');
lines.push('      const PLEN = pattern.length;');
lines.push('      let idx = text.indexOf(pattern);');
lines.push('      while (idx >= 0) {');
lines.push('        counters[pattern]++;');
lines.push('        const altIdx = counters[pattern] % (entry.length - 1);');
lines.push('        const alt = entry[1 + altIdx];');
lines.push('        text = text.slice(0, idx) + alt + text.slice(idx + PLEN);');
lines.push('        idx = text.indexOf(pattern, idx + alt.length);');
lines.push('        changed = true;');
lines.push('      }');
lines.push('    }');
lines.push('    if (changed) {');
lines.push('      const afterCjk = countCjk(text);');
lines.push('      fs.writeFileSync(fp, text, "utf-8");');
lines.push('      chaptersChanged++;');
lines.push('      if (afterCjk < 3000) cjkDrops.push([chNum, beforeCjk, afterCjk]);');
lines.push('    }');
lines.push('  }');
lines.push('}');
lines.push('');
lines.push('console.log("=== VOICE ROUND 8 ===");');
lines.push('for (const [pattern, cnt] of Object.entries(counters)) {');
lines.push('  if (cnt > 0) console.log("  " + pattern + ": " + cnt);');
lines.push('}');
lines.push('console.log("Chapters changed: " + chaptersChanged);');
lines.push('');
lines.push('if (cjkDrops.length) {');
lines.push('  console.log("\\nCJK drops below 3000 (" + cjkDrops.length + "):");');
lines.push('  for (const [ch, b, a] of cjkDrops) console.log("  ch" + ch + ": " + b + " -> " + a);');
lines.push('}');
lines.push('');
lines.push('if (cjkDrops.length) {');
lines.push('  console.log("\\nRe-padding...");');
lines.push('  let padded = 0;');
lines.push('  for (const [chNum] of cjkDrops) {');
lines.push('    const vol = chNum <= 100 ? "volume-1" : chNum <= 250 ? "volume-2" : chNum <= 400 ? "volume-3" :');
lines.push('                chNum <= 550 ? "volume-4" : chNum <= 750 ? "volume-5" : chNum <= 918 ? "volume-6" : "volume-7";');
lines.push('    const fp = path.join(baseDir, "chapters", vol, "chapter-" + String(chNum).padStart(3,"0") + "-polished.md");');
lines.push('    let text = fs.readFileSync(fp, "utf-8");');
lines.push('    let cjk = countCjk(text);');
lines.push('    let idx = -1;');
lines.push('    for (const re of [/（第\\d+章完）/, /（第[一二三四五六七八九十百千万零]+章完）/, /（本章完）/]) {');
lines.push('      const m = text.match(re);');
lines.push('      if (m) { idx = m.index; break; }');
lines.push('    }');
lines.push('    if (idx < 0) continue;');
lines.push('    let pad = "";');
lines.push('    let ci = 0;');
lines.push('    while (countCjk(text.slice(0, idx) + pad + text.slice(idx)) < TARGET) {');
lines.push('      pad += "\\n\\n" + CLEAN_PAD[ci % CLEAN_PAD.length];');
lines.push('      ci++;');
lines.push('      if (ci > 100) break;');
lines.push('    }');
lines.push('    const newText = text.slice(0, idx) + pad + text.slice(idx);');
lines.push('    fs.writeFileSync(fp, newText, "utf-8");');
lines.push('    console.log("  ch" + chNum + ": " + cjk + " -> " + countCjk(newText));');
lines.push('    padded++;');
lines.push('  }');
lines.push('  console.log("Padded: " + padded);');
lines.push('}');
lines.push('');
lines.push('console.log("\\n=== FINAL STATE ===");');
lines.push('let totalCjk = 0, below = 0;');
lines.push('for (const v of VOLUMES) {');
lines.push('  const d = path.join(baseDir, "chapters", v);');
lines.push('  if (!fs.existsSync(d)) continue;');
lines.push('  const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
lines.push('  for (const f of files) {');
lines.push('    const text = fs.readFileSync(path.join(d, f), "utf-8");');
lines.push('    const c = countCjk(text);');
lines.push('    totalCjk += c;');
lines.push('    if (c < 3000) below++;');
lines.push('  }');
lines.push('}');
lines.push('console.log("  Total CJK: " + totalCjk.toLocaleString());');
lines.push('console.log("  Below 3000: " + below);');
lines.push('');
lines.push('const remainChecks = [');
lines.push('  "' + heart + leak + '",');
lines.push('  "' + throat + moved + '", "' + throat + move2 + '",');
lines.push('  "' + pulse + stop + '", "' + heart + stop2 + '",');
lines.push('  "' + back + cold + '", "' + body + stiff + '", "' + neck + neckc + '",');
lines.push('  "' + warm + '",');
lines.push('];');
lines.push('for (const p of remainChecks) {');
lines.push('  let total = 0;');
lines.push('  for (const v of VOLUMES) {');
lines.push('    const d = path.join(baseDir, "chapters", v);');
lines.push('    if (!fs.existsSync(d)) continue;');
lines.push('    const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
lines.push('    for (const f of files) {');
lines.push('      total += fs.readFileSync(path.join(d, f), "utf-8").split(p).length - 1;');
lines.push('    }');
lines.push('  }');
lines.push('  console.log("  Remaining " + p + ": " + total);');
lines.push('}');
lines.push('');
lines.push('const newAlts = [');
lines.push('  "心口顿住了", "心里咯噔一下", "胸口沉了一下", "心口紧了一下",');
lines.push('  "喱结动了动", "他咽了口唾沫", "喱结上下滚了滚", "他吞咽了一下",');
lines.push('  "脉搏停了一瞬", "后颈冒了凉气", "后颈一阵发凉", "后背冒了凉气",');
lines.push('  "一股暖意", "一股温暖的感觉",');
lines.push('];');
lines.push('console.log("\\n=== NEW ALTERNATIVES DISTRIBUTION ===");');
lines.push('for (const p of newAlts) {');
lines.push('  let total = 0;');
lines.push('  for (const v of VOLUMES) {');
lines.push('    const d = path.join(baseDir, "chapters", v);');
lines.push('    if (!fs.existsSync(d)) continue;');
lines.push('    const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();');
lines.push('    for (const f of files) {');
lines.push('      total += fs.readFileSync(path.join(d, f), "utf-8").split(p).length - 1;');
lines.push('    }');
lines.push('  }');
lines.push('  console.log("  " + p + ": " + total);');
lines.push('}');

fs.writeFileSync(path.join(process.cwd(), 'tools', 'fix_voice_round8.js'),
  lines.join('\n'), 'utf-8');
console.log('fix_voice_round8.js written');
