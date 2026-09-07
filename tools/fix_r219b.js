// fix_r219b.js — Fix text after end marker (volume-aware)
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

// Volume-end chapters: these are EXPECTED to have volume markers after end marker
const volEnds = new Set([100, 250, 400, 550, 750, 918, 1000]);

let fixed = 0;
for (let ch = 1; ch <= 1000; ch++) {
  if (volEnds.has(ch)) continue; // skip volume-end chapters

  const fp = getFP(ch);
  const orig = fs.readFileSync(fp, 'utf-8');
  const lines = orig.split('\n');

  // Find the LAST line with '完）' that is NOT a volume marker
  let endIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('完）') && !lines[i].includes('——')) {
      endIdx = i;
      break;
    }
  }

  if (endIdx < 0) continue;

  // Check if there's any non-empty text after the end marker
  let hasAfter = false;
  for (let i = endIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      hasAfter = true;
      break;
    }
  }

  if (hasAfter) {
    const newLines = lines.slice(0, endIdx + 1);
    const newText = newLines.join('\n');
    fs.writeFileSync(fp, newText, 'utf-8');
    console.log('Fixed ch' + ch + ': removed ' + (lines.length - endIdx - 1) + ' line(s) after end marker');
    fixed++;
  }
}

console.log('Total fixed: ' + fixed);

// Verify volume-end chapters still have their markers
console.log('\n=== Volume-end chapter verification ===');
const volNames = ['入局', '边境', '裂谷', '深渊', '觉醒', '回廊', '闭环'];
for (let v = 0; v < volEnds.size; v++) {
  const ch = [100, 250, 400, 550, 750, 918, 1000][v];
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const hasVolumeMarker = text.includes('——第' + ['一', '二', '三', '四', '五', '六', '七'][v] + '卷·' + volNames[v] + '·完——');
  console.log('Ch' + ch + ': volume marker ' + (hasVolumeMarker ? 'OK' : 'MISSING'));
}
