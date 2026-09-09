// scan_deai_full.js — comprehensive de-AI pattern scan across all 1000 chapters
// Covers ALL CLAUDE.md banned words and deadly patterns

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'chapters');

// Volume → chapter range mapping
const VOLUMES = {
  'volume-1': { from: 1, to: 100 },
  'volume-2': { from: 101, to: 250 },
  'volume-3': { from: 251, to: 400 },
  'volume-4': { from: 401, to: 550 },
  'volume-5': { from: 551, to: 750 },
  'volume-6': { from: 751, to: 918 },
  'volume-7': { from: 919, to: 1000 },
};

// CJK character regex
const CJK_RE = /[㐀-䶿一-鿿豈-﫿]/g;

function countCJK(text) {
  const m = text.match(CJK_RE);
  return m ? m.length : 0;
}

function chapterFileName(volDir, ch) {
  // V1 uses 2-digit padding (01-100), V2+ uses 3-digit
  if (volDir === 'volume-1') {
    return `chapter-${String(ch).padStart(2, '0')}-polished.md`;
  }
  return `chapter-${String(ch).padStart(3, '0')}-polished.md`;
}

// Pattern groups
const PATTERNS = {
  // "比喻" 四字禁词 (比喻类)
  liu_beyi: [
    { label: '仿佛', re: /仿佛/g },
    { label: '犹如', re: /犹如/g },
    { label: '宛若', re: /宛若/g },
    { label: '如同', re: /如同/g },
  ],
  // 动作描写类
  dongzuo: [
    { label: '深吸一口气', re: /深吸一口气/g },
    { label: '缓缓', re: /缓缓/g },
    { label: '不禁', re: /不禁/g },
    { label: '微微', re: /微微/g },
    { label: '轻轻', re: /轻轻/g },
    { label: '淡淡', re: /淡淡/g },
  ],
  // 表情描写类
  biaojing: [
    { label: '眼中闪过', re: /眼中闪过/g },
    { label: '嘴角勾起', re: /嘴角勾起/g },
    { label: '眉头微皱', re: /眉头微皱/g },
    { label: '心中暗道', re: /心中暗道/g },
  ],
  // 强调类
  qiangdiao: [
    { label: '不容置疑', re: /不容置疑/g },
    { label: '显而易见', re: /显而易见/g },
    { label: '毫无疑问', re: /毫无疑问/g },
  ],
  // 形容词类
  xingrongci: [
    { label: '坚定', re: /坚定/g },
    { label: '深邃', re: /深邃/g },
    { label: '凛冽', re: /凛冽/g },
    { label: '冰冷', re: /冰冷/g },
  ],
  // "不受控制" 类
  bu_zizhu: [
    { label: '不由自主', re: /不由自主/g },
    { label: '情不自禁', re: /情不自禁/g },
  ],
  // 致命句式
  zhimi_jushi: [
    { label: '不是A而是B', re: /不是.{1,20}而是/g },
    { label: '他知道……', re: /他知道/g },
    { label: '眼中闪过一丝', re: /眼中闪过一丝/g },
    { label: '心中涌起一股', re: /心中涌起一股/g },
    { label: '脑中闪过', re: /脑中闪过/g },
    { label: '心中涌起', re: /心中涌起/g },
  ],
  // "心脏在跳" (疑似AI味, V5大量)
  xinzang_tiaojiao: [
    { label: '心脏在跳', re: /心脏在跳/g },
  ],
  // 其他常见AI味
  qi_ta: [
    { label: '能感觉到', re: /能感觉到/g },
    { label: '能感知到', re: /能感知到/g },
  ],
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const cjkCount = countCJK(content);
  const lines = content.split('\n');
  const findings = {};

  for (const [group, patterns] of Object.entries(PATTERNS)) {
    const groupResults = [];
    for (const pat of patterns) {
      const regex = pat.re;
      let match;
      let lineIdx = 0;
      let charIdx = 0;
      for (const line of lines) {
        regex.lastIndex = 0;
        while ((match = regex.exec(line)) !== null) {
          groupResults.push({
            label: pat.label,
            line: lineIdx + 1,
            context: line.trim().substring(Math.max(0, match.index - 10), Math.min(line.length, match.index + pat.label.length + 10)),
          });
        }
        lineIdx++;
      }
      if (groupResults.length > 0) {
        findings[group] = groupResults;
      }
    }
  }

  return { cjkCount, findings };
}

// Main scan
let totalCJK = 0;
let chapterCount = 0;
let below3000 = [];
const allFindings = {}; // group → { label → count, files }

for (const [volDir, range] of Object.entries(VOLUMES)) {
  const volPath = path.join(ROOT, volDir);
  if (!fs.existsSync(volPath)) continue;

  for (let ch = range.from; ch <= range.to; ch++) {
    const fname = chapterFileName(volDir, ch);
    const fpath = path.join(volPath, fname);
    if (!fs.existsSync(fpath)) continue;

    chapterCount++;
    const result = scanFile(fpath);
    totalCJK += result.cjkCount;

    if (result.cjkCount < 3000) {
      below3000.push({ ch, vol: volDir, cjk: result.cjkCount, shortfall: 3000 - result.cjkCount });
    }

    for (const [group, findings] of Object.entries(result.findings)) {
      if (!allFindings[group]) allFindings[group] = {};
      for (const item of findings) {
        if (!allFindings[group][item.label]) {
          allFindings[group][item.label] = { count: 0, files: {} };
        }
        allFindings[group][item.label].count++;
        const key = `${volDir}/ch${ch}`;
        if (!allFindings[group][item.label].files[key]) {
          allFindings[group][item.label].files[key] = [];
        }
        allFindings[group][item.label].files[key].push(item.line);
      }
    }
  }
}

// Output summary
console.log('=== DE-AI FULL SCAN ===');
console.log(`Chapters scanned: ${chapterCount}`);
console.log(`Total CJK: ${totalCJK.toLocaleString()}`);
console.log(`Avg CJK/chapter: ${Math.round(totalCJK / chapterCount)}`);
console.log('');

if (below3000.length > 0) {
  console.log('--- BELOW 3000 CJK ---');
  for (const b of below3000) {
    console.log(`  ${b.vol}/ch${b.ch}: ${b.cjk} CJK (need +${b.shortfall})`);
  }
  console.log('');
}

console.log('--- PATTERN FINDINGS ---');
for (const [group, labels] of Object.entries(allFindings)) {
  console.log(`\n[${group}]`);
  for (const [label, data] of Object.entries(labels)) {
    const fileCount = Object.keys(data.files).length;
    console.log(`  ${label}: ${data.count} occurrences in ${fileCount} files`);
    // Show up to 5 sample files
    const samples = Object.entries(data.files).slice(0, 5);
    for (const [fileKey, lines] of samples) {
      console.log(`    ${fileKey}: lines ${lines.join(',')}`);
    }
    if (Object.keys(data.files).length > 5) {
      console.log(`    ... and ${Object.keys(data.files).length - 5} more files`);
    }
  }
}

// Save full results
const outDir = path.join(__dirname, '..', 'tools');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'scan_deai_full_results.json'),
  JSON.stringify({ totalCJK, chapterCount, below3000, allFindings }, null, 2),
  'utf-8'
);
console.log('\nFull results saved to tools/scan_deai_full_results.json');
