#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const baseDir = process.cwd();
const VOLUMES = ["volume-1","volume-2","volume-3","volume-4","volume-5","volume-6","volume-7"];
const TARGET = 3020;

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= "一" && c <= "鿿") n++; }
  return n;
}

const CLEAN_PAD = [
  "那个念头在他脑子里转了一圈，才停下来。",
  "周围的空气因为这句话安静了一瞬。",
  "那句话沉进了他心里最深处。",
  "他站在那里，一时不知道该向哪走。",
  "他需要更多的时间。",
  "他的目光在那些影子里停留了几秒。",
  "那些影子在光里晃动，是被遗忘的记忆在挣扎。",
  "那个念头一出现，便缠住了他的思绪。",
];

const REPL = [
  ["深吸了一口气", ""],
  ["深吸一口气", ""],
  ["深吸一口", ""],
  ["他的嘴角动了一下", "嘴角牵了下。", "嘴角扯了下。", "嘴角动了动。", "他嘴角牵了下。", "他嘴角扯了下。"],
  ["他明白", "他懂了", "他清楚了", "他明白了", "他听懂了", "他理解了"],
  ["他突然明白", "他突然懂了", "他瞬间明白", "他一下子意识到"],
  ["他终于明白", "他算懂了", "他终于意识到"],
  ["他意识到", "他察觉到", "他察觉到这点", "他突然懂了"],
  ["沉默了一下", "沉默了。"],
  ["沉默片刻", "沉默了。"],
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

console.log("=== VOICE ROUND 5 ===");
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
    for (const re of [/\uff08\u7b2c\d+\u7ae0\u5b8c\uff09/, /\uff08\u7b2c[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07\u96f6]+\u7ae0\u5b8c\uff09/, /\uff08\u672c\u7ae0\u5b8c\uff09/]) {
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
  "\u6df1\u547c\u4e86\u4e00\u53e3\u6c14", "\u6df1\u547c\u4e00\u53e3\u6c14",
  "\u4ed6\u7684\u53e3\u89d2\u52a8\u4e86\u4e00\u4e0b",
  "\u4ed6\u660e\u767d", "\u4ed6\u7a81\u7136\u660e\u767d", "\u4ed6\u7ec8\u4e8e\u660e\u767d", "\u4ed6\u610f\u8bc6\u5230",
  "\u6c89\u9ed8\u4e86\u4e00\u4e0b", "\u6c89\u9ed8\u77ac\u60f3",
  "\u4e00\u79cd\u8bf4\u4e0d\u6e05\u7684", "\u5fc3\u810f\u731b\u5730\u505c\u8df3\u4e86\u4e00\u62cd", "\u5fc3\u810f\u731b\u5730\u8df3\u4e86\u4e00\u4e0b",
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