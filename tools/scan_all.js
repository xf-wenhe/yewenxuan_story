#!/usr/bin/env node
// scan_all.js — Comprehensive in-process scan of all 1000 chapters
// No external scripts — everything runs in-process for reliability

const fs = require('fs');
const path = require('path');

const CHAPTERS = 'D:\\work\\yewenxuan_story\\chapters';

// Volume mapping
function getVolume(ch) {
  if (ch <= 100) return 1;
  if (ch <= 250) return 2;
  if (ch <= 400) return 3;
  if (ch <= 550) return 4;
  if (ch <= 750) return 5;
  if (ch <= 918) return 6;
  return 7;
}

function getFP(ch) {
  const vol = getVolume(ch);
  const pad = ch < 100 ? 2 : 3;
  return path.join(CHAPTERS, 'volume-' + vol, 'chapter-' + ch.toString().padStart(pad, '0') + '-polished.md');
}

// CJK count
function cjkCount(text) {
  let c = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0x4E00 && code <= 0x9FFF) c++;
  }
  return c;
}

// L1 banned words
const L1_WORDS = [
  '仿佛', '犹如', '宛若', '如同',
  '深吸一口气', '缓缓', '不禁', '微微', '轻轻', '淡淡',
  '眼中闪过', '嘴角勾起', '眉头微皱', '心中暗道',
  '不容置疑', '显而易见', '毫无疑问',
  '坚定', '深邃', '凛冽', '冰冷',
  '不由自主', '情不自禁'
];

// Deadly patterns
function checkDeadlyPatterns(text) {
  const findings = [];
  // "不是A而是B"
  let m = text.match(/不是[^，。！？、\n]{0,20}而是/);
  if (m) findings.push('not-is-comparison');
  // 他知道/她知道
  if (/他知道/.test(text)) findings.push('he-knows');
  if (/她知道/.test(text)) findings.push('she-knows');
  // 眼中闪过一丝
  if (/眼中闪过一丝/.test(text)) findings.push('eyes-flash-trace');
  // 心中涌起一股
  if (/心中涌起一股/.test(text)) findings.push('heart-surge');
  // 脑中闪过
  if (/脑中闪过/.test(text)) findings.push('brain-flash');
  return findings;
}

// Check for degeneration patterns
function checkDegeneration(text) {
  const findings = [];
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  // 1. Check for repeated lines (>=12 chars, appearing >=3 times)
  const lineCount = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length >= 12) {
      lineCount[trimmed] = (lineCount[trimmed] || 0) + 1;
    }
  }
  for (const [line, count] of Object.entries(lineCount)) {
    if (count >= 3) {
      findings.push({
        type: 'repeated-line',
        count: count,
        sample: line.substring(0, 60)
      });
    }
  }

  // 2. Check for adjacent identical paragraphs (>=8 chars)
  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i-1].trim();
    const curr = lines[i].trim();
    if (prev.length >= 8 && prev === curr) {
      findings.push({
        type: 'adjacent-identical',
        sample: prev.substring(0, 60)
      });
    }
  }

  // 3. Check for "0428/0429在" overuse
  const fragInCount = (text.match(/0428在/g) || []).length;
  const frag2InCount = (text.match(/0429在/g) || []).length;
  const frag1BkCount = (text.match(/0428备份在/g) || []).length;
  const frag2BkCount = (text.match(/0429备份在/g) || []).length;
  const frag1BackupCount = (text.match(/0428碎片在/g) || []).length;
  const frag2BackupCount = (text.match(/0429碎片在/g) || []).length;
  const totalFragIn = fragInCount + frag2InCount + frag1BkCount + frag2BkCount + frag1BackupCount + frag2BackupCount;
  if (totalFragIn >= 15) {
    findings.push({
      type: 'fragment-repetition',
      count: totalFragIn,
      breakdown: { '0428在': fragInCount, '0429在': frag2InCount, '0428备份在': frag1BkCount, '0429备份在': frag2BkCount, '0428碎片在': frag1BackupCount, '0429碎片在': frag2BackupCount }
    });
  }

  // 4. Check for excessive quote-marked Chinese words
  const quoteMarkedWords = text.match(/["「][\u4e00-\u9fff]{1,6}["」]/g) || [];
  if (quoteMarkedWords.length >= 10) {
    findings.push({
      type: 'excessive-quote-marks',
      count: quoteMarkedWords.length,
      samples: [...new Set(quoteMarkedWords)].slice(0, 10)
    });
  }

  // 5. Check for atmospheric filler (10+ consecutive lines without dialogue/action)
  const allLines = text.split('\n');
  let fillerStart = -1;
  let fillerCount = 0;
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();
    const isFiller = line.length > 0 && !line.startsWith('#') && !line.includes('"') && !line.includes('「') &&
      !line.includes('叶文轩说') && !line.includes('赵大嘴说') && !line.includes('0428说') &&
      !line.includes('0429说') && !line.includes('说。') && !line.includes('说道') &&
      !line.includes('问。') && !line.includes('道。') && !line.includes('（第') &&
      !line.includes('——第') && !line.startsWith('```');

    if (isFiller) {
      if (fillerStart === -1) fillerStart = i;
      fillerCount++;
    } else {
      if (fillerCount >= 10) {
        findings.push({
          type: 'atmospheric-filler',
          count: fillerCount,
          startLine: fillerStart + 1
        });
      }
      fillerStart = -1;
      fillerCount = 0;
    }
  }
  if (fillerCount >= 10) {
    findings.push({
      type: 'atmospheric-filler',
      count: fillerCount,
      startLine: fillerStart + 1
    });
  }

  return findings;
}

// Check for punctuation issues
function checkPunctuation(text) {
  const findings = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // English comma in Chinese text (, instead of ，)
    if (/[一-龥],/.test(line) || /,[一-龥]/.test(line)) {
      findings.push({ type: 'english-comma', line: i + 1 });
    }

    // English period in Chinese text (. instead of 。)
    if (/[一-龥]\./.test(line) || /\.[一-龥]/.test(line)) {
      findings.push({ type: 'english-period', line: i + 1 });
    }

    // Markdown dividers
    if (/^\s*---\s*$/.test(line)) {
      findings.push({ type: 'markdown-divider', line: i + 1 });
    }

    // English double quote marks (should use 「」 for system or "" for dialogue)
    if (/[""]/g.test(line)) {
      findings.push({ type: 'smart-quotes', line: i + 1 });
    }
  }

  // Em dashes / double hyphens in Chinese text
  const emDashCount = (text.match(/——/g) || []).length;
  const doubleHyphenCount = (text.match(/--/g) || []).length;
  if (emDashCount > 0 || doubleHyphenCount > 0) {
    findings.push({ type: 'em-dash-or-double-hyphen', count: emDashCount + doubleHyphenCount });
  }

  return findings;
}

// Collect all chapter files
function getChapterFiles() {
  const files = [];
  const volumes = fs.readdirSync(CHAPTERS);
  for (const vol of volumes.sort()) {
    const volPath = path.join(CHAPTERS, vol);
    if (!fs.statSync(volPath).isDirectory()) continue;
    const chFiles = fs.readdirSync(volPath).filter(f => f.match(/^chapter-\d+-polished\.md$/));
    for (const f of chFiles) {
      const num = parseInt(f.match(/^chapter-(\d+)/)[1]);
      files.push({ num, path: path.join(volPath, f) });
    }
  }
  files.sort((a, b) => a.num - b.num);
  return files;
}

// ============ MAIN ============

const files = getChapterFiles();
console.log(`Total chapter files: ${files.length}`);

const issues = {
  below3000: [],
  degeneration: [],
  aiWords: [],
  deadlyPatterns: [],
  punctuation: []
};

let totalCJK = 0;

for (let i = 0; i < files.length; i++) {
  const f = files[i];
  const text = fs.readFileSync(f.path, 'utf-8');
  const cjk = cjkCount(text);
  totalCJK += cjk;

  // CJK check
  if (cjk < 3000) {
    issues.below3000.push({ ch: f.num, cjk });
  }

  // Degeneration check
  const degFindings = checkDegeneration(text);
  if (degFindings.length > 0) {
    issues.degeneration.push({ ch: f.num, findings: degFindings });
  }

  // L1 words check
  const l1Hits = [];
  for (const word of L1_WORDS) {
    const regex = new RegExp(word, 'g');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      l1Hits.push({ word, count: matches.length });
    }
  }
  if (l1Hits.length > 0) {
    issues.aiWords.push({ ch: f.num, hits: l1Hits });
  }

  // Deadly patterns check
  const deadly = checkDeadlyPatterns(text);
  if (deadly.length > 0) {
    issues.deadlyPatterns.push({ ch: f.num, patterns: deadly });
  }

  // Punctuation check
  const punctFindings = checkPunctuation(text);
  if (punctFindings.length > 0) {
    issues.punctuation.push({ ch: f.num, findings: punctFindings });
  }

  if ((i + 1) % 100 === 0) {
    process.stdout.write(`\rProcessed ${i + 1}/${files.length}...`);
  }
}

console.log(`\n\n=== SCAN RESULTS ===`);
console.log(`Total CJK: ${totalCJK}`);
console.log(`Chapters scanned: ${files.length}`);

// --- Below 3000 ---
console.log(`\n--- Below 3000 CJK (${issues.below3000.length} chapters) ---`);
if (issues.below3000.length > 0) {
  for (const b of issues.below3000) {
    console.log(`  ch${b.ch}: ${b.cjk} CJK`);
  }
} else {
  console.log('  None');
}

// --- Degeneration ---
console.log(`\n--- Degeneration (${issues.degeneration.length} chapters) ---`);
if (issues.degeneration.length > 0) {
  for (const d of issues.degeneration) {
    console.log(`  ch${d.ch}: ${d.findings.length} finding(s)`);
    for (const f of d.findings) {
      const type = f.type;
      const sample = f.sample || '';
      const count = f.count || '';
      console.log(`    - ${type}: ${count ? count + ' occurrences' : ''} ${sample}`);
    }
  }
} else {
  console.log('  None');
}

// --- L1 Words ---
console.log(`\n--- L1 Banned Words (${issues.aiWords.length} chapters) ---`);
if (issues.aiWords.length > 0) {
  for (const a of issues.aiWords) {
    const words = a.hits.map(h => `${h.word}(${h.count})`).join(', ');
    console.log(`  ch${a.ch}: ${words}`);
  }
} else {
  console.log('  None');
}

// --- Deadly Patterns ---
console.log(`\n--- Deadly Patterns (${issues.deadlyPatterns.length} chapters) ---`);
if (issues.deadlyPatterns.length > 0) {
  for (const d of issues.deadlyPatterns) {
    console.log(`  ch${d.ch}: ${d.patterns.join(', ')}`);
  }
} else {
  console.log('  None');
}

// --- Punctuation ---
console.log(`\n--- Punctuation Issues (${issues.punctuation.length} chapters) ---`);
if (issues.punctuation.length > 0) {
  for (const p of issues.punctuation) {
    const types = p.findings.map(f => f.type).join(', ');
    console.log(`  ch${p.ch}: ${types}`);
  }
} else {
  console.log('  None');
}

// Summary
console.log(`\n=== SUMMARY ===`);
console.log(`Below 3000 CJK: ${issues.below3000.length}`);
console.log(`Degeneration: ${issues.degeneration.length}`);
console.log(`L1 banned words: ${issues.aiWords.length}`);
console.log(`Deadly patterns: ${issues.deadlyPatterns.length}`);
console.log(`Punctuation issues: ${issues.punctuation.length}`);
console.log(`Total CJK: ${totalCJK}`);
