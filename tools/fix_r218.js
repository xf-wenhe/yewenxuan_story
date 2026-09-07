// fix_r218.js — Fix end marker Chinese numeral issues
// ch111: 第一百十一章 → 第一百一十一章
// ch112: 第一百十二章 → 第一百十二章 (consistency: 一百一十二)
// ch511: 第五百十一章 → 第五百一十一章

const fs = require('fs'), p = require('path');

function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

// Fixes to apply: chapter → {old: ..., new: ...}
const fixes = [
  { ch: 111, old: '（第一百十一章完）', new: '（第一百一十一章完）' },
  { ch: 112, old: '（第一百十二章完）', new: '（第一百十二章完）' },
  { ch: 511, old: '（第五百十一章完）', new: '（第五百一十一章完）' },
];

for (const fix of fixes) {
  const fp = getFP(fix.ch);
  const orig = fs.readFileSync(fp, 'utf-8');
  if (orig.includes(fix.old)) {
    const text = orig.replace(fix.old, fix.new);
    fs.writeFileSync(fp, text, 'utf-8');
    console.log('ch' + fix.ch + ': FIXED - "' + fix.old + '" → "' + fix.new + '"');
  } else if (orig.includes(fix.new)) {
    console.log('ch' + fix.ch + ': ALREADY CORRECT');
  } else {
    console.log('ch' + fix.ch + ': PATTERN NOT FOUND (unexpected state)');
  }
}

// Verify all end markers across entire library
console.log('\n=== Verification: Scanning all 1000 chapters for end marker consistency ===');

function toCN(n) {
  if (n < 10) return ['','一','二','三','四','五','六','七','八','九'][n];
  if (n < 20) return '十' + (n % 10 ? toCN(n % 10) : '');
  if (n < 100) { const t = Math.floor(n/10), o = n%10; return toCN(t) + '十' + (o ? toCN(o) : ''); }
  if (n < 1000) {
    const h = Math.floor(n/100), r = n%100;
    if (r === 0) return toCN(h) + '百';
    if (r < 10) return toCN(h) + '百零' + toCN(r);
    if (r < 20) return toCN(h) + '百一' + (r === 10 ? '十' : '十' + toCN(r%10));
    if (r < 100) { const t = Math.floor(r/10), o = r%10; return toCN(h) + '百' + toCN(t) + '十' + (o ? toCN(o) : ''); }
  }
  if (n === 1000) return '一千';
  return String(n);
}

let issues = [];
for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;
  const text = fs.readFileSync(fp, 'utf-8');
  const expected = '（第' + toCN(ch) + '章完）';
  if (!text.includes(expected)) {
    const m = text.match(/（第[^\n]*完）/);
    issues.push({ ch, expected, found: m ? m[0] : 'NO MARKER' });
  }
}

if (issues.length === 0) {
  console.log('ALL 1000 chapters have correct end markers.');
} else {
  console.log('Issues found: ' + issues.length);
  issues.forEach(i => console.log('  ch' + i.ch + ': expected ' + i.expected + ', got ' + i.found));
}
