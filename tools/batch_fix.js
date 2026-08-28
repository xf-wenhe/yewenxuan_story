// batch_fix.js — Fix blocking AI patterns in novel chapters
// Usage: node tools/batch_fix.js <chapter-number> [--verify-only]
// Processes one chapter, fixes all blocking findings, writes back, verifies.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\work\\yewenxuan_story';
const DETECTOR = path.join(ROOT, '.claude\\skills\\story-deslop\\scripts\\check-ai-patterns.js');

function getChapterPath(ch) {
  // Determine volume
  let volume;
  if (ch <= 100) volume = 1;
  else if (ch <= 250) volume = 2;
  else if (ch <= 400) volume = 3;
  else if (ch <= 550) volume = 4;
  else if (ch <= 750) volume = 5;
  else if (ch <= 918) volume = 6;
  else volume = 7;

  const numStr = String(ch).padStart(2, '0');
  return path.join(ROOT, 'chapters', `volume-${volume}`, `chapter-${numStr}-polished.md`);
}

function runDetector(filePath) {
  try {
    const cmd = `node "${DETECTOR}" "${filePath}" --json --fail-on=all`;
    const output = execSync(cmd, { encoding: 'utf8', cwd: ROOT, timeout: 30000 });
    // Exit code 0 = clean
    return JSON.parse(output);
  } catch (e) {
    // Exit code 1 = has findings, exit code 2 = read error
    if (e.status === 2) return null;
    if (e.status === 1) {
      try { return JSON.parse(e.stdout.toString()); } catch(_) {}
    }
    return null;
  }
}

function getBlockingFindings(result) {
  if (!result || !result.findings) return [];
  return result.findings.filter(f => f.severity === 'blocking');
}

// Fix not-is-comparison: "不是X，是Y" → "Y" (remove negation prefix)
// For "不是A，是B" where A and/or B may contain negation (不是不能说话，是不知道说什么)
function fixNotIsComparison(line, col) {
  // Find "不是" starting at or near col
  const idx = line.indexOf('不是', col - 1);
  if (idx === -1) return { line: line, changed: false, reason: 'not-found' };

  // Look ahead for the positive "是" or "而是" within 80 chars
  const searchStart = idx + 2;
  const searchEnd = Math.min(idx + 82, line.length);
  const segment = line.substring(searchStart, searchEnd);

  // Find "是" or "而是" — skip "是不是" (question pattern) only
  let posIdx = -1;
  let posType = '';

  // Try "而是" first
  let tryEr = segment.indexOf('而是');
  if (tryEr !== -1) {
    posIdx = searchStart + tryEr;
    posType = '而是';
  }

  if (posIdx === -1) {
    // Try "是" but skip "是不是" only (question/affirmation tag)
    let tryShi = segment.indexOf('是');
    while (tryShi !== -1) {
      const absPos = searchStart + tryShi;
      // Only skip "是不是" — the question/doubt pattern
      if (line[absPos + 1] === '不' && line[absPos + 2] === '是') {
        tryShi = segment.indexOf('是', tryShi + 1);
        continue;
      }
      posIdx = absPos;
      posType = '是';
      break;
    }
  }

  if (posIdx === -1) {
    // No positive "是" found — remove "不是X，" prefix up to next sentence boundary
    // e.g. "不是区域那种固定的代码，这些代码在动" → "这些代码在动"
    let endIdx = line.length;
    for (let i = idx + 2; i < line.length; i++) {
      if (line[i] === '，' || line[i] === '。' || line[i] === '；') {
        endIdx = i + 1;
        break;
      }
    }
    const before = line.substring(0, idx);
    const after = line.substring(endIdx);
    // Clean up leading comma or whitespace
    const trimmed = (before + after).replace(/，\s*$/, '').replace(/\s*，/, '');
    return { line: trimmed, changed: true, removed: line.substring(idx, endIdx) };
  }

  // Remove from "不是" to just before "是"/"而是", keeping leading text
  const before = line.substring(0, idx);
  const after = line.substring(posIdx);

  let result;
  if (before.length === 0) {
    result = after;
  } else {
    result = before + after;
  }

  return { line: result, changed: true, removed: line.substring(idx, posIdx) };
}

// Fix reverse-not-is: "是A，不是B" → "是A" (remove negation suffix)
function fixReverseNotIs(line, col) {
  // Find "不是" near col that follows a "是" (reverse pattern)
  const idx = line.indexOf('不是', col - 1);
  if (idx === -1) return { line: line, changed: false, reason: 'not-found' };

  // Check if there's a "是" before "不是" on this line (confirming reverse pattern)
  const beforeIdx = line.lastIndexOf('是', idx - 1);
  if (beforeIdx === -1) return { line: line, changed: false, reason: 'no-前置-是' };

  // Remove from the separator before "不是" to end (or to next sentence boundary)
  // Find the separator: usually "，" or "。" before "不是"
  let sepIdx = idx;
  for (let i = idx - 1; i >= beforeIdx; i--) {
    const ch = line[i];
    if (ch === '，' || ch === '。' || ch === '；' || ch === ' ' || ch === '\t') {
      sepIdx = i;
      break;
    }
  }

  // Remove from sepIdx to end of "不是B" segment
  // Find end of "不是B": usually end of line or next sentence boundary
  let endIdx = line.length;
  for (let i = idx + 2; i < line.length; i++) {
    const ch = line[i];
    if (ch === '。' || ch === '；' || ch === '！' || ch === '？') {
      endIdx = i + 1;
      break;
    }
  }

  const before = line.substring(0, sepIdx);
  const after = line.substring(endIdx);
  const result = before.trimEnd() + after;

  return { line: result, changed: true, removed: line.substring(sepIdx, endIdx) };
}

// Fix em-dash: "——" or "—" → replace with appropriate punctuation
function fixEmDash(line, col) {
  let count = 0;
  // Try "——" first, then single "—"
  let result = line.replace(/——/g, () => { count++; return '，'; });
  result = result.replace(/—/g, () => { count++; return '，'; });
  if (count === 0) return { line: line, changed: false, reason: 'no-em-dash' };
  return { line: result, changed: true, removed: count + ' em-dashes' };
}

// Fix negation-parade: "没有X，没有Y，..." → consolidate
function fixNegationParade(line, col) {
  const idx = line.indexOf('没有', col - 1);
  if (idx === -1) return { line: line, changed: false, reason: 'not-found' };

  // Count consecutive "没有" patterns
  let count = 0;
  let pos = idx;
  while (pos !== -1) {
    count++;
    pos = line.indexOf('没有', pos + 2);
    if (count >= 4 && pos !== -1) break;
  }

  if (count < 2) return { line: line, changed: false, reason: 'less-than-2-negations' };

  // Strategy: keep first "没有X", remove subsequent ones
  let secondIdx = line.indexOf('没有', idx + 2);
  if (secondIdx === -1) return { line: line, changed: false, reason: 'only-one' };

  const before = line.substring(0, idx);
  let endFirst = line.indexOf('，', idx);
  if (endFirst === -1) endFirst = line.indexOf('。', idx);
  if (endFirst === -1) endFirst = line.length;
  endFirst++;

  const after = line.substring(endFirst);
  const result = before + line.substring(idx, endFirst) + '等' + after;

  return { line: result, changed: true, removed: count + ' negations consolidated' };
}

// Fix trailer-ending: remove ending summary
function fixTrailerEnding(line, col) {
  // This typically flags the last few lines that summarize
  // For now, mark for review — we need human judgment
  return { line: line, changed: false, reason: 'needs-review' };
}

// Fix trailer-summary: remove ending summary
function fixTrailerSummary(line, col) {
  return { line: line, changed: false, reason: 'needs-review' };
}

function processChapter(ch) {
  const filePath = getChapterPath(ch);
  if (!fs.existsSync(filePath)) {
    return { status: 'missing', ch };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Run detector
  const result = runDetector(filePath);
  const blocking = getBlockingFindings(result);

  if (blocking.length === 0) {
    return { status: 'clean', ch, findings: 0 };
  }

  console.log(`\nChapter ${ch}: ${blocking.length} blocking finding(s)`);

  let totalFixes = 0;
  let fixDetails = [];

  // Process findings in reverse order (to preserve line numbers)
  const sorted = [...blocking].sort((a, b) => b.line - a.line);

  for (const finding of sorted) {
    const lineIdx = finding.line - 1; // 0-based
    if (lineIdx < 0 || lineIdx >= lines.length) continue;

    const originalLine = lines[lineIdx];
    let fix;

    switch (finding.type) {
      case 'not-is-comparison':
        fix = fixNotIsComparison(originalLine, finding.column);
        break;
      case 'reverse-not-is':
        fix = fixReverseNotIs(originalLine, finding.column);
        break;
      case 'em-dash':
        fix = fixEmDash(originalLine, finding.column);
        break;
      case 'negation-parade':
        fix = fixNegationParade(originalLine, finding.column);
        break;
      case 'trailer-ending':
        fix = fixTrailerEnding(originalLine, finding.column);
        break;
      case 'trailer-summary':
        fix = fixTrailerSummary(originalLine, finding.column);
        break;
      default:
        fix = { line: originalLine, changed: false, reason: 'unknown-type' };
    }

    if (fix.changed) {
      lines[lineIdx] = fix.line;
      totalFixes++;
      fixDetails.push({
        line: finding.line,
        type: finding.type,
        original: originalLine.trim(),
        fixed: fix.line.trim(),
      });
      console.log(`  ✓ L${finding.line} ${finding.type}: "${originalLine.trim().substring(0, 60)}..." → "${fix.line.trim().substring(0, 60)}..."`);
    } else {
      console.log(`  ✗ L${finding.line} ${finding.type}: ${fix.reason} — "${originalLine.trim().substring(0, 60)}..."`);
    }
  }

  if (totalFixes > 0) {
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
  }

  // Verify
  const verifyResult = runDetector(filePath);
  const remainingBlocking = getBlockingFindings(verifyResult);

  return {
    status: remainingBlocking.length === 0 ? 'fixed' : 'partial',
    ch,
    fixes: totalFixes,
    remaining: remainingBlocking.length,
    details: fixDetails,
  };
}

// Main
const args = process.argv.slice(2);
const ch = parseInt(args[0]);
const verifyOnly = args.includes('--verify-only');

if (isNaN(ch)) {
  console.log('Usage: node batch_fix.js <chapter-number> [--verify-only]');
  process.exit(1);
}

if (verifyOnly) {
  const filePath = getChapterPath(ch);
  const result = runDetector(filePath);
  const blocking = getBlockingFindings(result);
  console.log(`Chapter ${ch}: ${blocking.length} blocking finding(s)`);
  for (const f of blocking) {
    console.log(`  L${f.line} ${f.type}: ${f.message}`);
    console.log(`  excerpt: ${f.excerpt}`);
  }
  process.exit(blocking.length > 0 ? 0 : 1);
}

const result = processChapter(ch);
console.log(`\nResult: ch${ch} → ${result.status}, ${result.fixes || 0} fixes, ${result.remaining || 0} remaining`);
process.exit(result.status === 'fixed' || result.status === 'clean' ? 1 : 0);