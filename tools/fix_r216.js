// fix_r216.js — Round 216: Fix end marker format anomalies
// Issues found by audit:
// - 11 V5 chapters: `（` on separate line, Arabic-numeral end markers
// - ch233: split end marker structure
// All must preserve UTF-8 no BOM encoding

const fs = require('fs'), p = require('path');

function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

function toChineseNum(n) {
  if (n === 0) return '零';
  const d = ['零','一','二','三','四','五','六','七','八','九'];
  if (n < 10) return d[n];
  if (n < 20) return '十' + (n % 10 ? d[n % 10] : '');
  if (n < 100) {
    const t = Math.floor(n / 10), o = n % 10;
    return d[t] + '十' + (o ? d[o] : '');
  }
  if (n < 1000) {
    const h = Math.floor(n / 100), rest = n % 100;
    let r = d[h] + '百';
    if (rest === 0) return r;
    if (rest < 10) return r + '零' + d[rest];
    if (rest < 20) return r + '一十' + (rest % 10 ? d[rest % 10] : '');
    const t = Math.floor(rest / 10), o = rest % 10;
    return r + d[t] + '十' + (o ? d[o] : '');
  }
  if (n < 10000) {
    const th = Math.floor(n / 1000), rest = n % 1000;
    let r = d[th] + '千';
    if (rest === 0) return r;
    if (rest < 100) return r + '零' + toChineseNum(rest);
    return r + toChineseNum(rest);
  }
  return String(n);
}

// ========== Fix V5 chapters with split `（` and Arabic numerals ==========
const v5Chs = [575, 579, 585, 586, 612, 663, 669, 671, 675, 680, 734];

for (const ch of v5Chs) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) { console.log('ch' + ch + ': file not found'); continue; }

  let text = fs.readFileSync(fp, 'utf-8');
  const cn = toChineseNum(ch);
  const correctMarker = '（第' + cn + '章完）';
  const orig = text;

  // The pattern: `（` on its own line, followed by blank lines and content, then `第XXX章完）`
  // Fix: replace the split pattern with the correct combined marker

  // Step 1: Find the orphaned `（` line
  // Pattern: a line that is just `（` (possibly with whitespace)
  // followed by blank lines and content, then a line with `第575章完）` (Arabic)

  // Regex to match: `（` on its own line (trimmed), possibly with content between,
  // then `第NNN章完）` with Arabic numerals
  const pattern = new RegExp('(（)\\s*\\n+([^\\n]*?)\\s*\\n+第' + ch + '章完）', 's');

  // Simpler approach:
  // Find the line with just `（` and the line with `第XXX章完）`
  const lines = text.split('\n');
  const newLines = [];
  let fixed = false;
  let skipParensLine = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Check if this is the orphaned `（` line
    if (!fixed && trimmed === '（') {
      // Look ahead for the Arabic-numeral end marker within next few lines
      let foundMarker = false;
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].trim() === '第' + ch + '章完）') {
          foundMarker = true;
          break;
        }
      }
      if (foundMarker) {
        // Skip this `（` line — we'll add the correct marker later
        skipParensLine = true;
        continue;
      }
    }

    // Check if this is the Arabic-numeral end marker line
    if (!fixed && trimmed === '第' + ch + '章完）') {
      // Replace with correct Chinese-numeral marker
      newLines.push(correctMarker);
      fixed = true;
      continue;
    }

    newLines.push(lines[i]);
  }

  let newText = newLines.join('\n');

  if (newText !== orig) {
    fs.writeFileSync(fp, newText, 'utf-8');
    console.log('ch' + ch + ': fixed → ' + correctMarker);
  } else {
    console.log('ch' + ch + ': no change detected (pattern may differ)');
  }
}

// ========== Fix ch233 ==========
{
  const ch = 233;
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) { console.log('ch233: file not found'); process.exit(1); }

  let text = fs.readFileSync(fp, 'utf-8');
  const cn = toChineseNum(ch);
  const correctMarker = '（第' + cn + '章完）';
  const orig = text;

  // ch233 has:
  // Line 121: `（第二百三十三章完` (missing closing ）)
  // Line 123: `周围空气像凝固了。）` (stray ） on narrative text)

  // Fix step 1: add closing ） to the end marker
  text = text.replace(/（第二百三十三章完(?!）)/g, correctMarker);

  // Fix step 2: remove stray ） from the trailing narrative line
  // The narrative line `周围空气像凝固了。）` should be `周围空气像凝固了。`
  // Remove trailing ） that appears after 。 at end of file
  text = text.replace(/了。），\s*$/, '了。\n');

  if (text !== orig) {
    fs.writeFileSync(fp, text, 'utf-8');
    console.log('ch233: fixed');
  }

  // Verify the end marker
  const hasCorrect = text.includes(correctMarker);
  console.log('  has correct marker: ' + hasCorrect);

  // Show last 5 lines
  const lines = text.split('\n');
  console.log('  last 5 lines:');
  lines.slice(-5).forEach((l, i) => console.log('    ' + i + ': ' + JSON.stringify(l.slice(0, 80))));
}

// ========== Verify ==========
console.log('\n=== VERIFICATION ===');
for (const ch of v5Chs) {
  const t = fs.readFileSync(getFP(ch), 'utf-8');
  const cn = toChineseNum(ch);
  const m = t.match(new RegExp('（第' + cn + '章完）'));
  console.log('ch' + ch + ': ' + (m ? 'OK' : 'STILL BROKEN'));
}

// ch233
const t233 = fs.readFileSync(getFP(233), 'utf-8');
console.log('ch233: ' + (t233.includes('（第二百三十三章完）') ? 'OK' : 'STILL BROKEN'));
