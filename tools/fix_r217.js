// fix_r217.js — Comprehensive sweep: double periods, empty parens, stray bold, stray \r
// All must preserve UTF-8 no BOM encoding

const fs = require('fs'), p = require('path');

function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

const stats = {
  double_period: 0,
  empty_parens: 0,
  stray_bold: 0,
  stray_cr: 0,
  unclosed_system: 0,
  total_chapters_fixed: 0,
};

for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;

  const orig = fs.readFileSync(fp, 'utf-8');
  let text = orig;
  let changed = false;

  // 1. DOUBLE_PERIOD: "。。" → "。" (run multiple passes to catch overlapping)
  while (text.includes('。。')) {
    text = text.replace(/。。/g, '。');
    stats.double_period++;
    changed = true;
  }

  // 2. EMPTY_PARENS: "（）" or "()" → remove
  if (text.includes('（）') || text.includes('()')) {
    const before = text.length;
    text = text.replace(/（）/g, '');
    text = text.replace(/\(\)/g, '');
    if (text.length !== before) {
      stats.empty_parens++;
      changed = true;
    }
  }

  // 3. STRAY_BOLD: **text** where text is 1-3 chars (meaningless bold)
  // Use negative lookbehind to avoid code block context
  const strayBoldRegex = /\*\*([^\*\n]{1,3})\*\*/g;
  let strayMatch;
  while ((strayMatch = strayBoldRegex.exec(text)) !== null) {
    const content = strayMatch[1];
    // Skip if it looks like a code block boundary
    if (content === '\n' || content === '') continue;
    const before = text;
    text = text.replace(strayBoldRegex, '**$1**');
    // Actually just remove the bold markers
    text = text.replace(new RegExp('\\*\\*' + content + '\\*\\*'), content);
    strayBoldRegex.lastIndex = 0;
    stats.stray_bold++;
    changed = true;
  }

  // 4. STRAY_CR: \r right before 」 or 」」 — these are stray carriage returns
  // The pattern is: non-newline char + \r + 」
  if (text.includes('\r」')) {
    text = text.replace(/([^\n])\r」/g, '$1」');
    stats.stray_cr++;
    changed = true;
  }
  // Also: \r at end of line before 」 on next line (handled by the above)
  // Also: standalone \r\n where only \n is wanted — but we preserve \r\n as line endings, so skip

  // 5. UNCLOSED_SYSTEM: > 「... without closing 」 (only for system message lines)
  const lines = text.split('\n');
  const newLines = lines.map(line => {
    const t = line.trim();
    if (t.startsWith('> ') && t.includes('「') && !t.includes('」')) {
      return line + '」';
    }
    return line;
  });
  const newText = newLines.join('\n');
  if (newText !== text) {
    text = newText;
    stats.unclosed_system++;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, text, 'utf-8');
    stats.total_chapters_fixed++;
  }
}

console.log('=== R217 Fix Summary ===');
console.log('Double periods (。。→。): ' + stats.double_period);
console.log('Empty parens removed: ' + stats.empty_parens);
console.log('Stray bold fixed: ' + stats.stray_bold);
console.log('Stray CR fixed: ' + stats.stray_cr);
console.log('Unclosed system fixed: ' + stats.unclosed_system);
console.log('Total chapters fixed: ' + stats.total_chapters_fixed);
