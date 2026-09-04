// Generic line-by-line fixer for degeneration issues
// Usage: node fix_chapter.js <volume> <chapter> <replacements_json>
// replacements_json format: {"lineNum": "newLineContent", ...}
// Line numbers are 1-based

const fs = require('fs');
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node fix_chapter.js <volume> <chapter> <replacements_json>');
  process.exit(1);
}

const volume = args[0];
const chapter = args[1];
const replacements = JSON.parse(args[2]);

const filePath = 'D:/work/yewenxuan_story/chapters/volume-' + volume + '/chapter-' + chapter + '-polished.md';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let count = 0;
for (const [lineNum, newLine] of Object.entries(replacements)) {
  const idx = parseInt(lineNum) - 1;
  if (idx >= 0 && idx < lines.length) {
    const oldLine = lines[idx];
    if (oldLine !== newLine) {
      console.log('L' + lineNum + ':');
      console.log('  OLD: ' + oldLine.substring(0, 70) + (oldLine.length > 70 ? '...' : ''));
      console.log('  NEW: ' + newLine.substring(0, 70) + (newLine.length > 70 ? '...' : ''));
      lines[idx] = newLine;
      count++;
    }
  }
}

if (count > 0) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('\nApplied ' + count + ' replacements to chapter-' + chapter);
} else {
  console.log('No replacements applied');
}
