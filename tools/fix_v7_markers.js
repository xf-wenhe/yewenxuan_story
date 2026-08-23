#!/usr/bin/env node
/* fix_v7_markers.js — Normalize V7 end markers to Arabic numerals and add missing ones */

const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'chapters/volume-7');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md')).sort();

const CN_NUM_MAP = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '零': 0,
};

function cnNumToArabic(s) {
  let result = 0;
  let current = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '千') { result += (current || 1) * 1000; current = 0; }
    else if (c === '百') { result += (current || 1) * 100; current = 0; }
    else if (c === '十') { result += (current || 1) * 10; current = 0; }
    else if (CN_NUM_MAP[c] !== undefined) { current = CN_NUM_MAP[c]; }
  }
  result += current;
  return result;
}

function convertNumeral(s) {
  // Returns [isChinese, value]
  if (/^[0-9]+$/.test(s)) return [false, parseInt(s)];
  if (/^[一二三四五六七八九十百千零]+$/.test(s)) return [true, cnNumToArabic(s)];
  return [null, null];
}

let fixed = 0;
let added = 0;
let errors = [];

for (const f of files) {
  const fp = path.join(dir, f);
  let text = fs.readFileSync(fp, 'utf-8');
  const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);

  // Find any end marker
  const m = text.match(/（第([^）]+)章完）/);
  if (!m) {
    // No marker at all — add it
    text = text.trimEnd() + '\n\n（第' + chNum + '章完）\n';
    added++;
    console.log('Added missing marker to ch' + chNum);
  } else {
    const [isCn, num] = convertNumeral(m[1]);
    if (isCn && num === chNum) {
      // Convert Chinese numeral to Arabic
      text = text.replace(/（第[^）]+章完）/, '（第' + chNum + '章完）');
      fixed++;
    } else if (num !== null && num !== chNum) {
      errors.push('ch' + chNum + ': marker says ' + m[1] + ' (=' + num + ') but file is ' + chNum);
    }
  }

  fs.writeFileSync(fp, text, 'utf-8');
}

console.log('Converted to Arabic:', fixed);
console.log('Added missing:', added);
if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log('  ' + e);
}

// Verify
let remaining = 0, stillMissing = 0;
for (const f of files) {
  const fp = path.join(dir, f);
  const text = fs.readFileSync(fp, 'utf-8');
  const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
  if (!text.match(/（第\d+章完）/)) {
    const cn = text.match(/（第[^）\d]+章完）/);
    if (cn) remaining++;
    else stillMissing++;
  }
}
console.log('V7 final state — Arabic markers:', files.length - remaining - stillMissing);
console.log('V7 remaining Chinese:', remaining);
console.log('V7 still missing:', stillMissing);