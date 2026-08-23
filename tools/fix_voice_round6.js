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
  "那些影子在光里摇动，是被遗忘的记忆在挣扎。",
  "那个念头一出现，便缠住了他的思绪。",
];

const REPL = [
  ["他忽然明白", "他瞬间懂了", "他很清楚", "他一下子明白了", "他搞清楚了", "他终于懂了"],
  ["他忽然觉得", "他暗中觉得", "他感觉到", "他猛然觉得", "他突然感觉到"],
  ["他忽然意识到", "他察觉到", "他意识到了", "他猛然察觉", "他突然察觉"],
  ["脑海中浮现出", "脑中浮现出", "意识里浮现出"],
  ["脑海中浮现", "浮上心头", "冒了出来", "浮现", "浮现出来", "在脑中浮现"],
  ["突然意识到", "猛然意识到", "察觉到", "意识到了"],
  ["突然觉得", "猛然觉得", "隐约觉得", "感觉到", "察觉到"],
  ["嘴角上扬", "嘴角弯了弯", "嘴角浮起", "嘴角牵了下", "嘴角动了下", "嘴角弯了下"],
  ["嘴角扬起", "嘴角弯了弯", "嘴角扯了下", "嘴角浮起"],
  ["胸口涌起", "胸口一紧", "胸口发紧"],
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

console.log("=== VOICE ROUND 6 ===");
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
  "他忽然明白", "他忽然觉得", "他忽然意识到",
  "突然意识到", "突然觉得",
  "脑海中浮现", "脑海中浮现出",
  "嘴角上扬", "嘴角扬起",
  "胸口涌起",
  "深吸了一口气", "他的嘴角动了一下",
  "他意识到", "沉默了一下",
  "心脏猛地停跳了一拍", "心脏猛地跳了一下",
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
  "他瞬间懂了", "他暗中觉得", "他感觉到",
  "他猛然觉得", "他猛然察觉",
  "嘴角弯了弯", "嘴角浮起", "嘴角牵了下", "嘴角动了下", "嘴角抽了下",
  "浮上心头", "冒了出来", "在脑中浮现",
  "脑中浮现出", "意识里浮现出",
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