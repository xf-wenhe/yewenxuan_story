// fix_r219.js — Fix text after end marker
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

// Scan for text after end marker
console.log('=== Scanning for text after end marker ===');
let issues = [];
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n');

  // Find the end marker line
  let endIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('完）') && !lines[i].includes('——')) {
      endIdx = i;
      break;
    }
  }

  if (endIdx < 0) continue;

  // Check if there's any non-empty text after the end marker
  for (let i = endIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      issues.push({ ch, line: i + 1, text: lines[i].trim().substring(0, 80) });
      break;
    }
  }
}

console.log('Chapters with text after end marker: ' + issues.length);
issues.forEach(i => console.log('  ch' + i.ch + ' L' + i.line + ': ' + i.text));

// Fix: remove any non-empty lines after the end marker
if (issues.length > 0) {
  for (let ch = 1; ch <= 1000; ch++) {
    const fp = getFP(ch);
    const orig = fs.readFileSync(fp, 'utf-8');
    const lines = orig.split('\n');

    let endIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('完）') && !lines[i].includes('——')) {
        endIdx = i;
        break;
      }
    }

    if (endIdx < 0) continue;

    let changed = false;
    for (let i = endIdx + 1; i < lines.length; i++) {
      if (lines[i].trim() !== '') {
        changed = true;
        break;
      }
    }

    if (changed) {
      // Truncate at end marker + 1 (keep the newline after end marker)
      const newLines = lines.slice(0, endIdx + 1);
      const newText = newLines.join('\n');
      fs.writeFileSync(fp, newText, 'utf-8');
      console.log('Fixed ch' + ch + ': removed ' + (lines.length - endIdx - 1) + ' line(s) after end marker');
    }
  }
}
