// fix_r222.js — Remove exact duplicate lines (>15 chars) across all chapters
// Strategy: For each line that appears more than once, remove all but the first occurrence
// Only remove if remaining CJK > 3000
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

const MIN_LEN = 15; // Only consider lines >15 chars
const MIN_CJK = 3000;

let fixed = 0, totalRemoved = 0, totalRemovedCJK = 0;
const skipped = [];

for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  let text = fs.readFileSync(fp, "utf-8");
  text = text.replace(/\r\n/g, "\n"); // Normalize line endings

  const lines = text.split("\n");
  const totalCJK = cjkCount(text);

  // Build line map: line content -> first occurrence index
  const firstOcc = {};
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.length < MIN_LEN) continue;
    if (!firstOcc[t]) firstOcc[t] = i;
  }

  // Find lines to remove (second+ occurrences)
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
  if (remainingCJK < MIN_CJK) {
    skipped.push({ ch, total: totalCJK, dup: removedCJK, remaining: remainingCJK, lines: toRemove.size });
    continue;
  }

  // Remove duplicate lines
  const newLines = lines.filter((_, i) => !toRemove.has(i));

  // Collapse 3+ blank lines to 2
  let newText = newLines.join("\n").replace(/\n{3,}/g, "\n\n");

  if (newText !== text) {
    fs.writeFileSync(fp, newText, "utf-8");
    fixed++;
    totalRemoved += toRemove.size;
    totalRemovedCJK += removedCJK;
    console.log("FIXED ch" + ch + ": removed " + toRemove.size + " dup lines (" + removedCJK + " CJK), " + totalCJK + " -> " + remainingCJK + " CJK");
  }
}

console.log("\n=== Summary ===");
console.log("Chapters fixed: " + fixed);
console.log("Total lines removed: " + totalRemoved);
console.log("Total CJK removed: " + totalRemovedCJK);
console.log("Skipped (CJK < 3000): " + skipped.length);
for (const s of skipped) {
  console.log("  SKIP ch" + s.ch + ": " + s.total + " -> " + s.remaining + " CJK (" + s.lines + " dup lines, " + s.dup + " dup CJK)");
}
