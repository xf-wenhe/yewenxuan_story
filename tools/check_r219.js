// check_r219.js — Final consistency check
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

// Check 1: Title format
console.log('=== Title Format Check ===');
let titleIssues = [];
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n');
  const title = lines[0].trim();
  const m = title.match(/^# 第[^\n：]+：.+/);
  if (!m) titleIssues.push({ ch, title: title.substring(0, 60) });
}
if (titleIssues.length) {
  console.log('Title issues: ' + titleIssues.length);
  titleIssues.slice(0, 10).forEach(i => console.log('  ch' + i.ch + ': ' + i.title));
} else {
  console.log('All 1000 titles correct.');
}

// Check 2: End marker
console.log('\n=== End Marker Format Check ===');
let endIssues = [];
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n');
  const lastNonEmpty = lines.filter(l => l.trim() !== '').pop();
  if (!lastNonEmpty || !lastNonEmpty.includes('完）')) {
    endIssues.push({ ch, last: lastNonEmpty ? lastNonEmpty.substring(0, 60) : 'EMPTY' });
  }
}
if (endIssues.length) {
  console.log('End marker issues: ' + endIssues.length);
  endIssues.slice(0, 10).forEach(i => console.log('  ch' + i.ch + ': ' + i.last));
} else {
  console.log('All 1000 end markers correct.');
}

// Check 3: Half-width punctuation in CJK context
console.log('\n=== Half-width Punctuation in CJK Context ===');
let halfWidth = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) continue;
    if (line.trim().startsWith('> ')) continue;
    if (line.trim().startsWith('# ')) continue;
    const cjkHalfwidth = [
      /[一-鿿],[一-鿿]/,
      /[一-鿿]\. [一-鿿]/,
      /[一-鿿]\?[一-鿿]/,
      /[一-鿿]![一-鿿]/,
      /[一-鿿];[一-鿿]/,
      /[一-鿿]:[一-鿿]/,
    ];
    for (const re of cjkHalfwidth) {
      if (re.test(line)) {
        halfWidth++;
        if (halfWidth <= 10) {
          const idx = line.search(re);
          console.log('  ch' + ch + ' L' + (i + 1) + ': ' + line.substring(Math.max(0, idx - 20), idx + 30));
        }
        break;
      }
    }
  }
}
console.log('Half-width punctuation in CJK context: ' + halfWidth);

// Check 4: Orphaned markdown
console.log('\n=== Orphaned Markdown ===');
let orphaned = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('**') && !trimmed.endsWith('**') && trimmed.length < 10) {
      orphaned++;
      if (orphaned <= 10) console.log('  ch' + ch + ' L' + (i + 1) + ': ' + trimmed.substring(0, 40));
    }
  }
}
console.log('Orphaned markdown: ' + orphaned);

// Check 5: Volume marker
console.log('\n=== Volume End Markers ===');
const volEnds = [100, 250, 400, 550, 750, 918, 1000];
const volNames = ['入局', '边境', '裂谷', '深渊', '觉醒', '回廊', '闭环'];
for (let v = 0; v < volEnds.length; v++) {
  const ch = volEnds[v];
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const lines = text.split('\n');
  const lastFew = lines.filter(l => l.trim() !== '').slice(-5);
  console.log('Ch' + ch + ' (V' + (v + 1) + ' ' + volNames[v] + '):');
  lastFew.forEach(l => console.log('  ' + l.substring(0, 60)));
}

// Check 6: CJK count per chapter (final verification)
console.log('\n=== CJK Count Verification ===');
let below3000 = 0;
let total = 0;
const dist = { '3000-3500': 0, '3500-4000': 0, '4000-4500': 0, '4500-5000': 0, '5000+': 0 };
for (let ch = 1; ch <= 1000; ch++) {
  const text = fs.readFileSync(getFP(ch), 'utf-8');
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  total += cjk;
  if (cjk < 3000) below3000++;
  if (cjk >= 3000 && cjk < 3500) dist['3000-3500']++;
  else if (cjk >= 3500 && cjk < 4000) dist['3500-4000']++;
  else if (cjk >= 4000 && cjk < 4500) dist['4000-4500']++;
  else if (cjk >= 4500 && cjk < 5000) dist['4500-5000']++;
  else dist['5000+']++;
}
console.log('Total CJK: ' + total);
console.log('Below 3000: ' + below3000);
console.log('Distribution:');
Object.entries(dist).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
