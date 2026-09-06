// fix_r216b.js — Fix remaining LOW issues from R216 audit
// 1. DOUBLE_PERIOD: "。。" → "。"
// 2. EMPTY_PARENS: empty parentheses
// 3. STRAY_BOLD: orphaned **bold**
// 4. UNCLOSED_SYSTEM: unclosed system messages
// All must preserve UTF-8 no BOM encoding

const fs = require('fs'), p = require('path');

function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

const fixes = {
  double_period: 0,
  empty_parens: 0,
  stray_bold: 0,
  unclosed_system: 0,
  total_chapters_fixed: 0,
};

for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;

  const orig = fs.readFileSync(fp, 'utf-8');
  let text = orig;
  let changed = false;

  // 1. DOUBLE_PERIOD: "。。" → "。"
  if (text.includes('。。')) {
    text = text.replace(/。。/g, '。');
    fixes.double_period++;
    changed = true;
  }

  // 2. EMPTY_PARENS: "（）" or "()" → remove
  if (text.includes('（）') || text.includes('()')) {
    text = text.replace(/（）/g, '');
    text = text.replace(/\(\)/g, '');
    fixes.empty_parens++;
    changed = true;
  }

  // 3. STRAY_BOLD: **text** where text is 1-3 chars (meaningless bold)
  const strayBoldMatches = text.match(/\*\*[^*\n]{1,3}\*\*/g);
  if (strayBoldMatches) {
    for (const m of strayBoldMatches) {
      text = text.replace(m, m.replace(/\*\*/g, ''));
    }
    fixes.stray_bold++;
    changed = true;
  }

  // 4. UNCLOSED_SYSTEM: > 「... without closing 」
  // Pattern: line starting with > 「 that doesn't end with 」
  const lines = text.split('\n');
  const newLines = lines.map(line => {
    const t = line.trim();
    if (t.startsWith('> ') && t.includes('「') && !t.includes('」')) {
      // Add closing 」
      return line + '」';
    }
    return line;
  });
  const newText = newLines.join('\n');
  if (newText !== text) {
    text = newText;
    fixes.unclosed_system++;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, text, 'utf-8');
    fixes.total_chapters_fixed++;
  }
}

console.log('=== R216b Fix Summary ===');
console.log('Double periods (。。→。): ' + fixes.double_period);
console.log('Empty parens removed: ' + fixes.empty_parens);
console.log('Stray bold fixed: ' + fixes.stray_bold);
console.log('Unclosed system fixed: ' + fixes.unclosed_system);
console.log('Total chapters fixed: ' + fixes.total_chapters_fixed);
