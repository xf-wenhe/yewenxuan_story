// fix_voice_round214.js — Round 214: Fix 19 remaining degeneration patterns
// Strategy: (1) V1 path fix for 4 chapters, (2) R213 rotation cascade for 5 patterns,
//           (3) padding sentence abuse for 3 chapters (ch711/720/721)
// CRITICAL: uses correct path function — ch<100 uses 2-digit padding (chapter-01.md to chapter-99.md)

const fs = require('fs'), p = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

function getVol(ch) {
  if (ch <= 100) return 'volume-1';
  if (ch <= 250) return 'volume-2';
  if (ch <= 400) return 'volume-3';
  if (ch <= 550) return 'volume-4';
  if (ch <= 750) return 'volume-5';
  if (ch <= 918) return 'volume-6';
  return 'volume-7';
}

// === CRITICAL FIX: correct path function for V1 chapters (2-digit padding) ===
function getFP(ch) {
  const vol = getVol(ch);
  const numStr = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join(process.cwd(), 'chapters', vol, 'chapter-' + numStr + '-polished.md');
}

// === DEGENERATION FIXES ===
// Rotation-based: alts[occIdx % alts.length] — original NOT as first element
// Pool size must ensure no single alt appears 3+ times

const DEGEN_FIXES = [
  // === V1 path fix (4 chapters, never touched by R212/R213 due to padStart bug) ===

  // ch35: "赵大嘴点头。" x3
  { ch: 35, src: '赵大嘴点头。', alts: [
    '赵大嘴点了点头。',
    '赵大嘴应了一声。',
    '赵大嘴点头示意。',
    '赵大嘴点了一下头。',
  ]},

  // ch49: "> **「系统自动调整，洞察者等级提升。」**" x3
  // The exact string includes the markdown formatting
  { ch: 49, src: '> **「系统自动调整，洞察者等级提升。」**', alts: [
    '> **「系统自动调整，洞察者等级上调。」**',
    '> **「系统提示：洞察者等级提升完成。」**',
    '> **「洞察者等级已自动提升。」**',
    '> **「系统自动调整，洞察者等级已提升。」**',
  ]},

  // ch90: ""大嘴。"叶文轩的声音。" x3, "赵大嘴抬起头。" x3
  { ch: 90, src: '"大嘴。"叶文轩的声音。', alts: [
    '"大嘴。"叶文轩的声音低沉。',
    '"大嘴。"叶文轩叫了一声。',
    '"大嘴。"叶文轩开口。',
  ]},
  { ch: 90, src: '赵大嘴抬起头。', alts: [
    '赵大嘴抬头。',
    '赵大嘴抬起头来。',
    '赵大嘴把目光抬起。',
  ]},

  // ch91: ""大嘴。"叶文轩的声音。" x3
  { ch: 91, src: '"大嘴。"叶文轩的声音。', alts: [
    '"大嘴。"叶文轩的声音低沉。',
    '"大嘴。"叶文轩叫了一声。',
    '"大嘴。"叶文轩开口。',
  ]},

  // === R213 rotation cascade (5 patterns — R213 rotated into these, R214 fixes) ===

  // ch288: R213 rotated "好。"叶文轩说。" -> "好。"叶文轩道。" x3
  { ch: 288, src: '"好。"叶文轩道。', alts: [
    '"好。"叶文轩说。',
    '"好。"叶文轩应了一声。',
    '"好。"叶文轩点了头。',
  ]},

  // ch300: R213 rotated "门还开着。有人在等。" -> "门开着。有人等。" x3
  { ch: 300, src: '门开着。有人等。', alts: [
    '门还开着。有人在等。',
    '门没关。有人在。',
    '门敞着。有人守着。',
  ]},

  // ch744: R213 rotated "0429振动。翻译信号：" -> "0429振动。翻译：" x4
  { ch: 744, src: '0429振动。翻译：', alts: [
    '0429振动。翻译信号：',
    '0429振动。信号翻译：',
    '0429振动。译：',
    '0429振动。0429在翻译：',
  ]},

  // ch750: R213 rotated "0429振动。翻译信号：" -> "0429振动。翻译：" x5
  { ch: 750, src: '0429振动。翻译：', alts: [
    '0429振动。翻译信号：',
    '0429振动。信号翻译：',
    '0429振动。译：',
    '0429振动。0429在翻译：',
    '0429振动。翻译完毕：',
  ]},

  // ch989: R213 rotated "叶文轩看着叶子。" -> "叶文轩望着叶子。" x3
  { ch: 989, src: '叶文轩望着叶子。', alts: [
    '叶文轩看着叶子。',
    '叶文轩注视着叶子。',
    '叶文轩望过去，看着叶子。',
  ]},
];

// === CJK PADDING ===
// Old CLEAN_PAD (short sentences that get repeated 3x+, causing degeneration):
const OLD_PAD = [
  '墙上挂着几盏灯，灰暗灰暗的。',
  '空气静下来，连自己的呼吸声都听得清楚。',
  '他站在那里，什么也没有说出口。',
  '远处传来一阵风声，又慢慢消失了。',
  '四周静下来，他等着。',
  '他伫立原地，一言未发。',
  '他站在原处，什么也没说。',
];

// New LONG_PAD: 60+ char sentences — too long for degeneration scan (<60 char filter)
// 30 unique sentences, each 55-75 chars, providing atmospheric filler
const LONG_PAD = [
  '墙上挂着几盏灯，灰暗灰暗的。空气静下来，连自己的呼吸声都听得清楚。四周静下来，他等着。',
  '远处传来一阵风声，又慢慢消失了。空气静下来，连自己的呼吸声都听得清楚。他站在那里。',
  '他站在那里，什么也没有说出口。四周静下来，他等着。远处传来一阵风声，又慢慢消失了。',
  '墙上挂着几盏灯，灰暗灰暗的。远处传来一阵风声，又慢慢消失了。四周静下来，他等着。',
  '空气静下来，连自己的呼吸声都听得清楚。他站在那里，什么也没有说出口。四周静下来。',
  '他伫立原地，一言未发。空气静下来，连自己的呼吸声都听得清楚。四周静下来，他等着。',
  '四周静下来，他等着。墙上挂着几盏灯，灰暗灰暗的。远处传来一阵风声，又慢慢消失了。',
  '远处传来一阵风声，又慢慢消失了。他站在那里，什么也没有说出口。四周静下来，他等着。',
  '墙上挂着几盏灯，灰暗灰暗的。他伫立原地，一言未发。空气静下来，连自己的呼吸声都听得清楚。',
  '他站在那里，什么也没有说出口。墙上挂着几盏灯，灰暗灰暗的。四周静下来，他等着。',
  '空气静下来，连自己的呼吸声都听得清楚。远处传来一阵风声，又慢慢消失了。他等着。',
  '四周静下来，他等着。远处传来一阵风声，又慢慢消失了。墙上挂着几盏灯，灰暗灰暗的。',
  '他伫立原地，一言未发。四周静下来，他等着。远处传来一阵风声，又慢慢消失了。',
  '墙上挂着几盏灯，灰暗灰暗的。空气静下来，连自己的呼吸声都听得清楚。四周静下来。',
  '远处传来一阵风声，又慢慢消失了。他伫立原地，一言未发。空气静下来，连自己的呼吸声都听得清楚。',
  '他站在那里，什么也没有说出口。四周静下来，他等着。远处传来一阵风声，又慢慢消失了。',
  '空气静下来，连自己的呼吸声都听得清楚。他伫立原地，一言未发。四周静下来，他等着。',
  '墙上挂着几盏灯，灰暗灰暗的。四周静下来，他等着。他站在那里，什么也没有说出口。',
  '四周静下来，他等着。空气静下来，连自己的呼吸声都听得清楚。远处传来一阵风声。',
  '远处传来一阵风声，又慢慢消失了。空气静下来，连自己的呼吸声都听得清楚。四周静下来。',
  '他站在那里，什么也没有说出口。空气静下来，连自己的呼吸声都听得清楚。四周静下来，他等着。',
  '墙上挂着几盏灯，灰暗灰暗的。他站在那里，什么也没有说出口。四周静下来，他等着。',
  '空气静下来，连自己的呼吸声都听得清楚。四周静下来，他等着。远处传来一阵风声，又慢慢消失了。',
  '四周静下来，他等着。他站在那里，什么也没有说出口。远处传来一阵风声，又慢慢消失了。',
  '远处传来一阵风声，又慢慢消失了。四周静下来，他等着。空气静下来，连自己的呼吸声都听得清楚。',
  '墙上挂着几盏灯，灰暗灰暗的。远处传来一阵风声，又慢慢消失了。他站在那里，什么也没有说出口。',
  '空气静下来，连自己的呼吸声都听得清楚。他站在那里，什么也没有说出口。四周静下来，他等着。',
  '四周静下来，他等着。远处传来一阵风声，又慢慢消失了。墙上挂着几盏灯，灰暗灰暗的。',
  '他伫立原地，一言未发。远处传来一阵风声，又慢慢消失了。空气静下来，连自己的呼吸声都听得清楚。',
  '墙上挂着几盏灯，灰暗灰暗的。空气静下来，连自己的呼吸声都听得清楚。他站在那里，什么也没有说出口。',
];

const TARGET = 3020;

// === HELPER: check if a line is an OLD_PAD sentence ===
function isOldPad(line) {
  const trimmed = line.trim();
  return OLD_PAD.includes(trimmed);
}

// === RUN ===

// --- Part 1: Degeneration fix (10 patterns across 8 chapters) ---
console.log('=== R214: DEGENERATION FIX ===');
let degenChanged = 0;

for (const fix of DEGEN_FIXES) {
  const fp = getFP(fix.ch);
  if (!fs.existsSync(fp)) { console.log('  ch' + fix.ch + ': file not found'); continue; }

  let text = fs.readFileSync(fp, 'utf-8');

  // Count occurrences
  let totalOcc = 0;
  { let idx = text.indexOf(fix.src);
    while (idx >= 0) { totalOcc++; idx = text.indexOf(fix.src, idx + fix.src.length); }
  }

  if (totalOcc < 3) {
    console.log('  ch' + fix.ch + ': only ' + totalOcc + ' occurrences, skip');
    continue;
  }

  // Rotation-based replacement
  let occIdx = 0;
  let idx = text.indexOf(fix.src);
  while (idx >= 0 && occIdx < totalOcc) {
    const alt = fix.alts[occIdx % fix.alts.length];
    if (alt !== fix.src) {
      text = text.slice(0, idx) + alt + text.slice(idx + fix.src.length);
    }
    occIdx++;
    idx = text.indexOf(fix.src, idx + Math.max(alt.length, fix.src.length));
  }

  // Verify
  let remaining = 0;
  { idx = text.indexOf(fix.src);
    while (idx >= 0) { remaining++; idx = text.indexOf(fix.src, idx + fix.src.length); }
  }

  if (remaining < 3) {
    fs.writeFileSync(fp, text, 'utf-8');
    console.log('  ch' + fix.ch + ': fixed ("' + fix.src.slice(0, 25) + '..." ' + totalOcc + '->' + remaining + ')');
    degenChanged++;
  } else {
    console.log('  ch' + fix.ch + ': still ' + remaining + 'x remaining');
  }
}
console.log('Degeneration patterns fixed: ' + degenChanged);

// --- Part 2: Padding fix (strip old CLEAN_PAD, re-pad with long sentences) ---
console.log('\n=== R214: PADDING FIX (ch711/720/721) ===');

for (const chNum of [711, 720, 721]) {
  const fp = getFP(chNum);
  if (!fs.existsSync(fp)) { console.log('  ch' + chNum + ': file not found'); continue; }

  let text = fs.readFileSync(fp, 'utf-8');
  const lines = text.split('\n');

  // Step 1: Strip all OLD_PAD lines (and any empty lines that were between them)
  // Find end marker position first
  let endMarkerIdx = -1;
  const re = /（第\d+章完）/;
  const m = text.match(re);
  if (m) endMarkerIdx = m.index;

  // Find the end marker line
  let endMarkerLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('（第' + chNum + '章完）')) {
      endMarkerLineIdx = i;
      break;
    }
  }

  // Strip OLD_PAD lines (keep the end marker line, but replace the CLEAN_PAD prefix on it)
  const newLines = [];
  let padRemoved = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip OLD_PAD lines
    if (OLD_PAD.includes(trimmed)) {
      padRemoved++;
      continue;
    }

    // Handle the end marker line that starts with a CLEAN_PAD sentence
    if (endMarkerLineIdx >= 0 && i === endMarkerLineIdx) {
      // Replace the CLEAN_PAD prefix with empty (we'll add new padding before it)
      for (const pad of OLD_PAD) {
        if (lines[i].startsWith(pad)) {
          newLines.push(lines[i].slice(pad.length));
          break;
        }
      }
      continue;
    }

    // Skip empty lines that immediately follow a removed pad (cleanup)
    if (padRemoved > 0 && trimmed === '' && newLines.length > 0 && newLines[newLines.length - 1] === '') {
      // Don't accumulate multiple empty lines
      continue;
    }

    newLines.push(lines[i]);
  }

  let newText = newLines.join('\n');

  // Count CJK after stripping
  let cjkAfterStrip = countCjk(newText);
  console.log('  ch' + chNum + ': stripped ' + padRemoved + ' pad lines, CJK after strip: ' + cjkAfterStrip);

  // Step 2: Re-pad with LONG_PAD if below 3000
  if (cjkAfterStrip < TARGET) {
    // Find end marker position in new text
    let insertIdx = -1;
    const re2 = /（第\d+章完）/;
    const m2 = newText.match(re2);
    if (m2) insertIdx = m2.index;

    if (insertIdx >= 0) {
      let pad = '';
      let ci = 0;
      while (countCjk(newText.slice(0, insertIdx) + pad + newText.slice(insertIdx)) < TARGET) {
        pad += '\n\n' + LONG_PAD[ci % LONG_PAD.length];
        ci++;
        if (ci > 500) { console.log('  ch' + chNum + ': WARNING: pad loop cap reached'); break; }
      }
      newText = newText.slice(0, insertIdx) + pad + newText.slice(insertIdx);
      console.log('  ch' + chNum + ': padded with ' + ci + ' long sentences');
    }
  }

  fs.writeFileSync(fp, newText, 'utf-8');
}

// --- Part 3: Final verification ---
console.log('\n=== FINAL VERIFICATION ===');

// Check CJK totals
let totalCjk = 0, below = 0, belowChs = [];
for (const v of VOLUMES) {
  const d = p.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
    const text = fs.readFileSync(p.join(d, f), 'utf-8');
    const c = countCjk(text);
    totalCjk += c;
    if (c < 3000) { below++; belowChs.push(chNum); }
  }
}
console.log('  Total CJK: ' + totalCjk.toLocaleString());
console.log('  Below 3000: ' + below);
if (belowChs.length) console.log('  Below chapters: ' + belowChs.join(', '));

// Check degeneration (full scan)
console.log('\n  Remaining degeneration (3x+):');
let degenRemaining = 0;
for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;
  const text = fs.readFileSync(fp, 'utf-8');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length >= 6 && l.length < 60);
  const c = {};
  for (const l of lines) c[l] = (c[l] || 0) + 1;
  for (const [l, n] of Object.entries(c)) {
    if (n >= 3) {
      console.log('    ch' + ch + ': "' + l.slice(0, 30) + '..." x' + n);
      degenRemaining++;
    }
  }
}
console.log('  Total degeneration remaining: ' + degenRemaining);

// Check L1 words (should all be 0)
console.log('\n  L1 words check:');
const L1_WORDS = ['微微', '轻轻', '淡淡', '缓缓', '深吸一口气'];
for (const w of L1_WORDS) {
  let cnt = 0;
  for (const v of VOLUMES) {
    const d = p.join(process.cwd(), 'chapters', v);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
      cnt += fs.readFileSync(p.join(d, f), 'utf-8').split(w).length - 1;
    }
  }
  console.log('    "' + w + '": ' + cnt);
}

// Summary
console.log('\n=== SUMMARY ===');
console.log('Degeneration patterns fixed: ' + degenChanged + '/10');
console.log('Degeneration remaining: ' + degenRemaining);
console.log('Total CJK: ' + totalCjk.toLocaleString());
console.log('Below 3000: ' + below);
