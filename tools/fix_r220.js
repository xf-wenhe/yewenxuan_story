// fix_r220.js — Fix inline end markers (should be on their own line)
// Handles \r\n line endings: strips \r, writes \n consistently
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

const volEnds = new Set([100, 250, 400, 550, 750, 918, 1000]);
const volEndMap = new Map([
  [100, '——第一卷·入局·完——'],
  [250, '——第二卷·边境·完——'],
  [400, '——第三卷·裂谷·完——'],
  [550, '——第四卷·深渊·完——'],
  [750, '——第五卷·觉醒·完——'],
  [918, '——第六卷·回廊·完——'],
  [1000, '——第七卷·闭环·完——'],
]);

let fixed = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  let orig = fs.readFileSync(fp, 'utf-8');

  // Normalize to \n line endings
  orig = orig.replace(/\r\n/g, '\n');
  const lines = orig.split('\n');

  // Find the end marker line
  let endIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('完）') && !lines[i].includes('——')) {
      endIdx = i;
      break;
    }
  }
  if (endIdx < 0) continue;

  const trimmed = lines[endIdx].trim();

  // Already correct?
  if (/^（第.+章完）$/.test(trimmed)) continue;

  // Extract end marker and preceding text
  const emMatch = trimmed.match(/（第.+章完）$/);
  if (!emMatch) continue;
  const endMarker = emMatch[0];
  const before = trimmed.substring(0, trimmed.lastIndexOf('（第'));

  // Rebuild: text before, blank line, end marker on own line
  const newLines = lines.slice(0, endIdx);
  newLines.push(before);
  newLines.push('');
  newLines.push(endMarker);

  // Volume-end chapters: keep volume marker
  if (volEnds.has(ch)) {
    const volMarker = volEndMap.get(ch);
    let hasVolMarker = false;
    for (let i = endIdx + 1; i < lines.length; i++) {
      if (lines[i].includes('——') && lines[i].includes('完——')) {
        hasVolMarker = true;
        break;
      }
    }
    if (hasVolMarker) {
      newLines.push(volMarker);
    }
  }

  const newText = newLines.join('\n');
  fs.writeFileSync(fp, newText, 'utf-8');
  fixed++;
}

console.log('Chapters fixed: ' + fixed);

// Verify volume-end chapters
console.log('\n=== Volume-end chapter verification ===');
for (const ch of [100, 250, 400, 550, 750, 918, 1000]) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n').filter(l => l.trim() !== '');
  const last3 = lines.slice(-3);
  console.log('Ch' + ch + ':');
  last3.forEach(l => console.log('  ' + l.substring(0, 60)));
}

// Verify no more inline end markers
console.log('\n=== Remaining inline check ===');
let remaining = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let endIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('完）') && !lines[i].includes('——')) { endIdx = i; break; }
  }
  if (endIdx < 0) continue;
  const trimmed = lines[endIdx].trim();
  if (!/^（第.+章完）$/.test(trimmed) && trimmed.includes('完）')) {
    remaining++;
    if (remaining <= 5) console.log('  ch' + ch + ': ' + trimmed.substring(0, 60));
  }
}
console.log('Remaining inline: ' + remaining);
