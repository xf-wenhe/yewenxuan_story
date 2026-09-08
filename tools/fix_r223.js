// fix_r223.js — Remove duplicate lines from ALL 48 skipped chapters, report CJK deficit
const fs = require("fs"), p = require("path");
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, "0") : String(ch).padStart(3, "0");
  return p.join("chapters", "volume-" + v, "chapter-" + n + "-polished.md");
}
function cjkCount(text) {
  let c = 0;
  for (const ch of text) { const cp = ch.codePointAt(0); if (cp >= 0x4E00 && cp <= 0x9FFF) c++; }
  return c;
}

const MIN_LEN = 15;
const MIN_CJK = 3000;

let fixed = 0, totalRemoved = 0, totalRemovedCJK = 0;
const deficits = [];

for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  let text = fs.readFileSync(fp, "utf-8");
  text = text.replace(/\r\n/g, "\n");

  const lines = text.split("\n");
  const totalCJK = cjkCount(text);

  // Build line map
  const firstOcc = {};
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.length < MIN_LEN) continue;
    if (!firstOcc[t]) firstOcc[t] = i;
  }

  // Find lines to remove
  const toRemove = new Set();
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.length < MIN_LEN) continue;
    if (firstOcc[t] !== undefined && firstOcc[t] !== i) {
      toRemove.add(i);
    }
  }

  if (toRemove.size === 0) continue;

  // Calculate CJK that would be removed
  let removedCJK = 0;
  for (const idx of toRemove) {
    removedCJK += cjkCount(lines[idx]);
  }

  const remainingCJK = totalCJK - removedCJK;
  const deficit = Math.max(0, MIN_CJK - remainingCJK);

  // Remove duplicate lines (even if CJK < 3000)
  const newLines = lines.filter((_, i) => !toRemove.has(i));
  let newText = newLines.join("\n").replace(/\n{3,}/g, "\n\n");

  if (newText !== text) {
    fs.writeFileSync(fp, newText, "utf-8");
    fixed++;
    totalRemoved += toRemove.size;
    totalRemovedCJK += removedCJK;
    console.log("FIXED ch" + ch + ": removed " + toRemove.size + " dup lines (" + removedCJK + " CJK), " + totalCJK + " -> " + remainingCJK + " CJK, deficit=" + deficit);
    if (deficit > 0) {
      deficits.push({ ch, deficit, total: totalCJK, after: remainingCJK });
    }
  }
}

console.log("\n=== Summary ===");
console.log("Chapters fixed: " + fixed);
console.log("Total lines removed: " + totalRemoved);
console.log("Total CJK removed: " + totalRemovedCJK);
console.log("Chapters needing expansion: " + deficits.length);
for (const d of deficits) {
  console.log("  ch" + d.ch + ": " + d.total + " -> " + d.after + " CJK, need +" + d.deficit);
}
