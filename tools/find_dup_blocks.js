// find_dup_blocks.js — Find contiguous duplicate blocks across all chapters
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

const results = [];
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), "utf-8");
  const lines = text.split("\n");
  const totalCJK = cjkCount(text);

  // Build line map with exact match, lines >20 chars only
  const lineMap = {};
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.length < 20) continue;
    if (!lineMap[t]) lineMap[t] = [];
    lineMap[t].push(i);
  }

  // Find duplicate line indices (second+ occurrences)
  const dupIndices = new Set();
  const dupSets = Object.entries(lineMap).filter(([k, v]) => v.length > 1);
  for (const [line, idxs] of dupSets) {
    for (let i = 1; i < idxs.length; i++) dupIndices.add(idxs[i]);
  }

  if (dupIndices.size === 0) continue;

  // Find contiguous blocks of duplicates (>=3 consecutive dup lines)
  const dupLines = [...dupIndices].sort((a, b) => a - b);
  const blocks = [];
  let block = [];
  for (const idx of dupLines) {
    if (block.length === 0 || idx === block[block.length - 1] + 1) {
      block.push(idx);
    } else {
      if (block.length >= 3) blocks.push(block);
      block = [idx];
    }
  }
  if (block.length >= 3) blocks.push(block);

  for (const block of blocks) {
    const blockStart = block[0];
    const blockEnd = block[block.length - 1];
    const blockCJK = cjkCount(lines.slice(blockStart, blockEnd + 1).join("\n"));

    results.push({
      ch, total: totalCJK, dupCJK: blockCJK,
      blockStart: blockStart + 1, blockEnd: blockEnd + 1,
      blockLen: block.length,
      pct: (blockCJK / totalCJK * 100).toFixed(1)
    });
  }
}

// Sort by percentage descending
results.sort((a, b) => b.pct - a.pct);
for (const r of results) {
  console.log("ch" + r.ch + ": " + r.total + " CJK, dup block lines " + r.blockStart + "-" + r.blockEnd + " (" + r.blockLen + " lines, " + r.dupCJK + " CJK, " + r.pct + "%)");
}
console.log("\nTotal chapters with contiguous dup blocks: " + new Set(results.map(r => r.ch)).size);
