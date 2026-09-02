// scan_l1_words.js — Scan all 1000 chapters for L1 banned words + deadly patterns
const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\work\\yewenxuan_story';

// L1_WORDS from polish_pipeline.py
const L1_WORDS = [
  '仿佛', '犹如', '宛若', '如同',
  '深吸一口气', '缓缓', '不禁', '微微', '轻轻', '淡淡',
  '眼中闪过', '嘴角勾起', '眉头微皱', '眉眼低垂', '瞳孔微缩',
  '心中暗道', '不由得',
  '不容置疑', '不容置喙', '不易察觉', '显而易见', '毫无疑问', '不可否认',
  '坚定', '闪烁着光芒', '狡黠', '深邃', '凛冽', '冰冷',
  '不由自主', '情不自禁', '自然而然'
];

// DEADLY_PATTERNS from polish_pipeline.py
const DEADLY_PATTERNS = [
  { name: 'not_a_but', re: /不是([^，。]{1,10})[，———]而是/ },
  { name: 'with_complement', re: /带着([^，。]{1,10})的/ },
  { name: 'voice_pattern', re: /声音不大[，———]却/ },
  { name: 'he_knows', re: /他知道([^。]{0,30})[。\n]/ },
  { name: 'she_knows', re: /她知道([^。]{0,30})[。\n]/ },
  { name: 'like_pattern', re: /仿佛([^，。]{1,10})一般/ },
  { name: 'eye_flash', re: /眼中闪过一丝([^，。]{1,6})/ },
  { name: 'heart_surge', re: /心中涌起一股([^，。]{1,6})/ },
  { name: 'brain_running', re: /脑子在运转/ },
  { name: 'mind_flash', re: /脑中闪过([^，。]{1,8})/ },
  { name: 'heart_response', re: /心中一([^，。]{1,4})/ },
];

function getVol(ch) {
  if (ch <= 100) return 1;
  if (ch <= 250) return 2;
  if (ch <= 400) return 3;
  if (ch <= 550) return 4;
  if (ch <= 750) return 5;
  if (ch <= 918) return 6;
  return 7;
}

function getChapterPath(ch) {
  const vol = getVol(ch);
  const numStr = ch <= 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return path.join(ROOT, 'chapters', `volume-${vol}`, `chapter-${numStr}-polished.md`);
}

const results = [];
let clean = 0;
const total = 1000;
const globalWordCount = {};
const globalPatternCount = {};

for (let ch = 1; ch <= total; ch++) {
  const filePath = getChapterPath(ch);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  const chapterHits = [];

  // L1 words
  for (const word of L1_WORDS) {
    const matches = content.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
    if (matches && matches.length > 0) {
      chapterHits.push({ type: 'l1-word', item: word, count: matches.length });
      globalWordCount[word] = (globalWordCount[word] || 0) + matches.length;
    }
  }

  // Deadly patterns
  for (const { name, re } of DEADLY_PATTERNS) {
    const matches = content.match(re);
    if (matches && matches.length > 0) {
      chapterHits.push({ type: 'deadly-pattern', item: name, count: matches.length });
      globalPatternCount[name] = (globalPatternCount[name] || 0) + matches.length;
    }
  }

  if (chapterHits.length > 0) {
    results.push({ ch, hits: chapterHits });
  } else {
    clean++;
  }

  if (ch % 50 === 0 || ch === total) {
    console.log(`Scanned ${ch}/${total} (hit: ${results.length}, clean: ${clean})`);
  }
}

const outputDir = path.join(ROOT, 'tools', 'scan_output');
fs.mkdirSync(outputDir, { recursive: true });

const report = {
  total,
  clean,
  affected: results.length,
  globalWordCount: Object.entries(globalWordCount).sort((a,b) => b[1]-a[1]),
  globalPatternCount: Object.entries(globalPatternCount).sort((a,b) => b[1]-a[1]),
  chapters: results
};

fs.writeFileSync(path.join(outputDir, 'l1_words_results.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(`\n=== L1 Words / Deadly Patterns Scan ===`);
console.log(`Total: ${total}, Clean: ${clean}, Affected: ${results.length}`);

console.log(`\nTop L1 words (global):`);
for (const [word, count] of Object.entries(globalWordCount).sort((a,b) => b[1]-a[1]).slice(0, 20)) {
  console.log(`  "${word}": ${count}`);
}

console.log(`\nTop deadly patterns (global):`);
for (const [name, count] of Object.entries(globalPatternCount).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${name}: ${count}`);
}

console.log(`\nChapters by total hit count (top 30):`);
const sorted = results.map(r => ({ ch: r.ch, total: r.hits.reduce((s,h) => s+h.count, 0) }))
  .sort((a,b) => b.total - a.total).slice(0, 30);
for (const r of sorted) {
  console.log(`  Ch.${r.ch}: ${r.total} hits`);
}