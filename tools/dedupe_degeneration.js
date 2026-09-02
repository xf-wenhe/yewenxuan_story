// dedupe_degeneration.js v4 — Combined: verbatim-duplicate removal + system-narration filtering
// Step 1: Remove exact duplicate sentences (global dedup)
// Step 2: Remove system narration sentences (0428/0429/0415/0427 operational descriptions)
// Step 3: Remove empty/collapsed paragraphs
// Quote-aware sentence splitting to preserve dialogue integrity
const fs = require('fs');
const path = require('path');

const ROOT = 'D:/work/yewenxuan_story';

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

// Normalize a sentence for dedup comparison (strip all punctuation)
function normalizeSentence(sent) {
  return sent.trim().replace(/[。！？，、；：""「」【】『』（）()''\"''\"]/g, '').replace(/\s+/g, '');
}

// Quote-aware sentence splitting
// Splits on 。！？ but respects "..." and "..." quote boundaries
function splitSentences(text) {
  const sentences = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    current += ch;

    if (!inQuote && (ch === '"' || ch === '"' || ch === '"' || ch === '"' || ch === '「' || ch === '『')) {
      inQuote = true;
      quoteChar = ch;
      // Continue scanning — don't split inside quotes
      continue;
    }

    if (inQuote) {
      // Look for matching close quote
      const openClose = {'"': ['"', '"', '"'], '"': ['"', '"', '"'], '「': '」', '『': '』'};
      const closers = openClose[quoteChar];
      if (closers && (Array.isArray(closers) ? closers : [closers]).includes(ch)) {
        inQuote = false;
        quoteChar = '';
      }
      continue;
    }

    // Outside quotes — split on 。！？
    if (ch === '。' || ch === '！' || ch === '？') {
      sentences.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) sentences.push(current.trim());
  return sentences.filter(s => s.length > 0);
}

// Check if a sentence is "system narration" — pure degeneration about fragment operations
function isSystemSentence(sent) {
  const s = sent.trim();
  if (!s) return false;
  if (s.length < 10) return false;

  // Dialogue or direct quotes: never system narration
  if (/^["「『'"\u201c]/.test(s)) return false;
  if (s.match(/^["][^"]*["]/)) return false; // fully quoted dialogue

  // Must contain a fragment number to be system narration
  const hasFragment = /0428|0429|0415|0427|0424/.test(s);
  if (!hasFragment) return false;

  // Check for system verbs (operations, not narrative)
  const systemVerbs = [
    '运行', '信号', '振动', '共振', '感知', '意识', '备份', '副本', '碎片',
    '传递', '坐标', '桥梁', '脉动', '发出微光', '散发光芒', '正常工作',
    '持续运转', '执行运算', '释放出光线', '融合了原始意识', '第零次',
    '球在等你', '在说',
  ];

  // Check for narrative actions (indicates this is a narrative sentence, not pure system narration)
  const narrativeVerbs = [
    '门', '房间', '画', '阳光', '手', '眼睛', '摸', '走', '拿', '放',
    '坐', '站', '抬头', '低头', '笑', '哭', '说', '看', '画', '写',
    '转身', '点头', '握', '拍', '扶', '推', '拉', '转身', '回头',
    '走廊', '窗户', '桌子', '椅子', '床', '药', '食物', '水',
    '头发', '肩膀', '背', '腿', '脚', '指甲', '脸', '嘴',
  ];

  let systemHits = 0;
  for (const v of systemVerbs) {
    if (s.includes(v)) systemHits++;
  }

  let narrativeHits = 0;
  for (const v of narrativeVerbs) {
    if (s.includes(v)) narrativeHits++;
  }

  // System narration: has fragment + many system verbs + few/no narrative verbs
  if (systemHits >= 3 && narrativeHits <= 1) return true;
  if (systemHits >= 4 && narrativeHits <= 2) return true;

  return false;
}

// Process a chapter: dedup + system-narration filter
function processChapter(text) {
  const lines = text.split('\n');
  const result = [];
  const seenSentences = new Set();
  let prevEmpty = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!prevEmpty) { result.push(''); prevEmpty = true; }
      continue;
    }
    prevEmpty = false;

    // Preserve structural elements
    if (trimmed.startsWith('# ') || trimmed.match(/^（第.*章完）/) || trimmed.match(/^——.*——$/)) {
      result.push(line);
      continue;
    }

    // Quote-aware sentence split
    const sentences = splitSentences(trimmed);
    const kept = [];

    for (const sent of sentences) {
      const t = sent.trim();
      if (!t) continue;

      // Check for duplicates (normalize for comparison)
      const norm = normalizeSentence(t);

      // Skip exact duplicates globally
      if (seenSentences.has(norm)) continue;
      // Skip very short fragments (likely remnants of broken sentences)
      if (norm.length < 3 && !/[！？]$/.test(t)) continue;

      // Check for system narration (near-duplicate degeneration)
      if (isSystemSentence(t)) continue;

      seenSentences.add(norm);
      kept.push(t);
    }

    if (kept.length === 0) continue;
    result.push(kept.join(''));
  }

  return result.join('\n');
}

// Count CJK characters
function countCJK(text) {
  return (text.match(/[一-鿿]/g) || []).length;
}

// Main processing
const degenerationData = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tools', 'scan_output', 'degeneration_results.json'), 'utf8')
);

const report = { total: 0, below3000: [], autoFixed: [], fileResults: {} };

for (const entry of degenerationData.chapters) {
  const ch = entry.ch;
  if (!entry.findings.some(f => f.type === 'verbatim-repeat')) continue;

  report.total++;
  const filePath = getChapterPath(ch);
  const content = fs.readFileSync(filePath, 'utf8');
  const cleaned = processChapter(content);
  const cjkClean = countCJK(cleaned);
  const cjkOrig = countCJK(content);
  const saved = cjkOrig - cjkClean;

  if (cjkClean < 3000) {
    report.below3000.push({ ch, cjk: cjkClean, orig: cjkOrig, saved });
  } else {
    report.autoFixed.push({ ch, cjk: cjkClean, orig: cjkOrig, saved });
  }

  // Save cleaned version
  const outDir = path.join(ROOT, 'tools', 'dedup_output');
  fs.mkdirSync(outDir, { recursive: true });
  const vol = getVol(ch);
  const numStr = ch <= 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  const outPath = path.join(outDir, `chapter-${numStr}-cleaned.md`);
  fs.writeFileSync(outPath, cleaned, 'utf8');
}

console.log('=== v4 Degeneration Dedup Report ===');
console.log(`Chapters with verbatim-repeat: ${report.total}`);
console.log(`Auto-fixed (>=3000 CJK after dedup+filter): ${report.autoFixed.length}`);
console.log(`Need rewrite (below 3000 CJK): ${report.below3000.length}`);

console.log('\nChapters needing rewrite:');
for (const c of report.below3000) {
  console.log(`  Ch.${c.ch}: ${c.cjk} CJK (was ${c.orig}, removed ${c.saved})`);
}

fs.writeFileSync(path.join(ROOT, 'tools', 'dedup_report_v4.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('\nReport saved to tools/dedup_report_v4.json');
console.log('Cleaned files saved to tools/dedup_output/');
