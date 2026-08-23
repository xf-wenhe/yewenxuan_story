#!/usr/bin/env node
/* fix_missing_endmarkers.js — Fix 5 chapters with wrong/missing end markers */

const fs = require('fs');

function countCjk(t) {
  let n = 0;
  for (const c of t) if (c >= '一' && c <= '鿿') n++;
  return n;
}

const fixes = [
  { fp: 'chapters/volume-5/chapter-722-polished.md', old: '（第七百二十二章完）', num: 722 },
  { fp: 'chapters/volume-5/chapter-723-polished.md', old: '（第七百二十三章完）', num: 723 },
  { fp: 'chapters/volume-5/chapter-725-polished.md', old: '（第七百二十五章完）', num: 725 },
  { fp: 'chapters/volume-5/chapter-726-polished.md', old: '（第七百二十六章完）', num: 726 },
];

for (const fix of fixes) {
  let text = fs.readFileSync(fix.fp, 'utf-8');
  const newMarker = '（第' + fix.num + '章完）';
  if (text.includes(fix.old)) {
    text = text.replace(fix.old, newMarker);
    fs.writeFileSync(fix.fp, text, 'utf-8');
    console.log('ch' + fix.num + ': standardized marker, ' + countCjk(text) + ' CJK');
  } else {
    console.log('ch' + fix.num + ': old marker not found!');
  }
}

// ch739: add missing end marker
{
  const fp = 'chapters/volume-5/chapter-739-polished.md';
  let text = fs.readFileSync(fp, 'utf-8');
  // Check if it already has a marker in some form
  const hasMarker = text.match(/（第[^\d\d]*章完）/);
  if (hasMarker) {
    console.log('ch739: has marker:', hasMarker[0]);
  } else {
    text = text.trim() + '\n\n（第739章完）\n';
    fs.writeFileSync(fp, text, 'utf-8');
    console.log('ch739: added marker, ' + countCjk(text) + ' CJK');
  }
}

// Final verify
console.log('\n--- Verify ---');
const dir = 'chapters/volume-5';
const files = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md')).sort();
let missing = [];
let trailing = [];
for (const f of files) {
  const text = fs.readFileSync(dir + '/' + f, 'utf-8');
  const m = text.match(/（第\d+章完）/);
  const chNum = f.match(/chapter-(\d+)/)[1];
  if (!m) { missing.push(chNum); continue; }
  const after = text.slice(m.index + m[0].length);
  if (after.trim().length > 0) trailing.push(chNum);
}
console.log('Missing digit marker:', missing.length === 0 ? '0 ✓' : missing);
console.log('Trailing after marker:', trailing.length === 0 ? '0 ✓' : trailing);