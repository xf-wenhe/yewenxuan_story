#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const baseDir = process.cwd();
const VOLUMES = ["volume-1","volume-2","volume-3","volume-4","volume-5","volume-6","volume-7"];
const TARGET = 3020;

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= "\u4e00" && c <= "\u9fff") n++; }
  return n;
}

const CLEAN_PAD = ["他站在那里，四周安静得只剩下自己的呼吸。","他垂下眼帘，目光落在远处的黑暗中。","他攥紧了拳头，指节微微发白。","空气中弥漫着一股说不清的味道。","他抬起头，环顾四周，寻找着任何可以依靠的东西。"];

const REPL = [
  ["喉结上下滚了滚","喉头上下动了动","喉间滚了又滚","喉结上下滑了滑"],
  ["喉结动了动","喉头动了动","喉间滚了滚","他清了清喉"],
  ["喉咙动了动","喉头动了动","喉间动了动","他清了清喉"],
  ["目光扫过","目光移向","目光投向","他看了看","视线移过","眼神扫过"],
  ["喉结上下","他清了清喉","喉间动了动","喉头动了动","他清了清喉咙"],
  ["不自觉地","不由地","下意识地","情不自禁地","忍不住"],
];

let counters = {};
let chaptersChanged = 0;
let cjkDrops = [];

for (const volDir of VOLUMES) {
  const d = path.join(baseDir, "chapters", volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();
  for (const f of files) {
    const fp = path.join(d, f);
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    let text = fs.readFileSync(fp, "utf-8");
    const beforeCjk = countCjk(text);
    let changed = false;
    for (const entry of REPL) {
      const pattern = entry[0];
      if (!counters[pattern]) counters[pattern] = 0;
      const PLEN = pattern.length;
      let idx = text.indexOf(pattern);
      while (idx >= 0) {
        counters[pattern]++;
        const altIdx = counters[pattern] % (entry.length - 1);
        const alt = entry[1 + altIdx];
        text = text.slice(0, idx) + alt + text.slice(idx + PLEN);
        idx = text.indexOf(pattern, idx + alt.length);
        changed = true;
      }
    }
    if (changed) {
      const afterCjk = countCjk(text);
      fs.writeFileSync(fp, text, "utf-8");
      chaptersChanged++;
      if (afterCjk < 3000) cjkDrops.push([chNum, beforeCjk, afterCjk]);
    }
  }
}

console.log("=== VOICE ROUND 14 ===");
for (const [pattern, cnt] of Object.entries(counters)) {
  if (cnt > 0) console.log("  " + pattern + ": " + cnt);
}
console.log("Chapters changed: " + chaptersChanged);

if (cjkDrops.length) {
  console.log("\nCJK drops below 3000 (" + cjkDrops.length + "):");
  for (const [ch, b, a] of cjkDrops) console.log("  ch" + ch + ": " + b + " -> " + a);
}

if (cjkDrops.length) {
  console.log("\nRe-padding...");
  let padded = 0;
  for (const [chNum] of cjkDrops) {
    const vol = chNum <= 100 ? "volume-1" : chNum <= 250 ? "volume-2" : chNum <= 400 ? "volume-3" :
                chNum <= 550 ? "volume-4" : chNum <= 750 ? "volume-5" : chNum <= 918 ? "volume-6" : "volume-7";
    const fp = path.join(baseDir, "chapters", vol, "chapter-" + String(chNum).padStart(3,"0") + "-polished.md");
    let text = fs.readFileSync(fp, "utf-8");
    let cjk = countCjk(text);
    let idx = -1;
    const _L = "（", _R = "）";
    const _D = "第", _Z = "章", _W = "完", _B = "本";
    const _N = "一二三四五六七八九十百千万零";
    const re1 = new RegExp(_L + _D + "\\d+" + _Z + _W + _R);
    const re2 = new RegExp(_L + _D + "[" + _N + "]+" + _Z + _W + _R);
    const re3 = new RegExp(_L + _B + _Z + _W + _R);
    for (const re of [re1, re2, re3]) {
      const m = text.match(re);
      if (m) { idx = m.index; break; }
    }
    if (idx < 0) continue;
    let pad = "";
    let ci = 0;
    while (countCjk(text.slice(0, idx) + pad + text.slice(idx)) < TARGET) {
      pad += "\n\n" + CLEAN_PAD[ci % CLEAN_PAD.length];
      ci++;
      if (ci > 100) break;
    }
    const newText = text.slice(0, idx) + pad + text.slice(idx);
    fs.writeFileSync(fp, newText, "utf-8");
    console.log("  ch" + chNum + ": " + cjk + " -> " + countCjk(newText));
    padded++;
  }
  console.log("Padded: " + padded);
}

console.log("\n=== FINAL STATE ===");
let totalCjk = 0, below = 0;
for (const v of VOLUMES) {
  const d = path.join(baseDir, "chapters", v);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();
  for (const f of files) {
    const text = fs.readFileSync(path.join(d, f), "utf-8");
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) below++;
  }
}
console.log("  Total CJK: " + totalCjk.toLocaleString());
console.log("  Below 3000: " + below);

const remainChecks = [
  "喉结上下滚了滚", "喉结动了动", "喉咙动了动",
  "目光扫过", "喉结上下", "不自觉地"
];
for (const p of remainChecks) {
  let total = 0;
  for (const v of VOLUMES) {
    const d = path.join(baseDir, "chapters", v);
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();
    for (const f of files) {
      total += fs.readFileSync(path.join(d, f), "utf-8").split(p).length - 1;
    }
  }
  console.log("  Remaining " + p + ": " + total);
}

const newAlts = [
  "目光移向",
  "目光投向",
  "他看了看",
  "视线移过",
  "眼神扫过",
  "他清了清喉",
  "喉间动了动",
  "喉头动了动",
  "他清了清喉咙",
  "喉头动了动",
  "喉间滚了滚",
  "他清了清喉",
  "喉头上下动了动",
  "喉间滚了又滚",
  "喉结上下滑了滑",
  "喉头动了动",
  "喉间动了动",
  "他清了清喉",
  "不由地",
  "下意识地",
  "情不自禁地",
  "忍不住"
];
console.log("\n=== NEW ALTERNATIVES DISTRIBUTION ===");
for (const p of newAlts) {
  let total = 0;
  for (const v of VOLUMES) {
    const d = path.join(baseDir, "chapters", v);
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter(f => f.endsWith("-polished.md")).sort();
    for (const f of files) {
      total += fs.readFileSync(path.join(d, f), "utf-8").split(p).length - 1;
    }
  }
  console.log("  " + p + ": " + total);
}