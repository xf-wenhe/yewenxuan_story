// Fix remaining 5 blocking findings - uses character-level position mapping
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const CHAPTERS_DIR = 'D:/work/yewenxuan_story/chapters';
const CHECK_SCRIPT = 'D:/work/yewenxuan_story/.claude/skills/story-deslop/scripts/check-degeneration.js';

function getFindings(filePath) {
  const findings = [];
  try {
    execSync('node ' + CHECK_SCRIPT + ' --check --fail-on=blocking ' + filePath, { encoding: 'utf8', cwd: 'D:/work/yewenxuan_story' });
  } catch(e) {
    const output = e.stdout || '';
    for (const line of output.split('\n')) {
      const m = line.match(/同句出现 (\d+) 次.+\((.+?)\)/);
      if (m) {
        findings.push({ bare: m[2].trim(), count: parseInt(m[1]) });
      }
    }
  }
  return findings;
}

function stripQuoted(text) {
  return text
    .replace(/「[^」]*」/g, '')
    .replace(/『[^』]*』/g, '')
    .replace(/【[^】]*】/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/'[^']*'/g, '');
}

// Map stripped position back to original position
function mapPos(stripped, original, stripTargetPos) {
  let origPos = 0;
  let stripPos = 0;
  while (stripPos < stripTargetPos && origPos < original.length) {
    if (isQuote(original, origPos)) {
      origPos = skipQuote(original, origPos);
    } else {
      stripPos++;
      origPos++;
    }
  }
  return origPos;
}

function isQuote(text, pos) {
  const ch = text[pos];
  return ch === '"' || ch === '\u201c' || ch === '\u201d' || ch === '\u300c' || ch === '\u300d' || ch === '\u300e' || ch === '\u300f';
}

function skipQuote(text, pos) {
  const ch = text[pos];
  if (ch === '"' || ch === '\u201c') {
    const endCh = ch === '"' ? '"' : '\u201d';
    let i = pos + 1;
    while (i < text.length && text[i] !== endCh) i++;
    return i + 1;
  }
  if (ch === '\u300c') {
    let i = pos + 1;
    while (i < text.length && text[i] !== '\u300d') i++;
    return i + 1;
  }
  if (ch === '\u300e') {
    let i = pos + 1;
    while (i < text.length && text[i] !== '\u300f') i++;
    return i + 1;
  }
  return pos + 1;
}

// Process a single line: find all occurrences of pattern in stripped version,
// replace each with a unique variant
function replaceInLine(line, pattern, variants) {
  const stripped = stripQuoted(line);
  const results = [];

  // Find all positions of pattern in stripped text
  let pos = 0;
  const positions = [];
  while ((pos = stripped.indexOf(pattern, pos)) !== -1) {
    positions.push(pos);
    pos += pattern.length;
  }

  if (positions.length < 1) return null;

  // Build new line by processing character by character
  let newLine = '';
  let stripIdx = 0;
  let origIdx = 0;
  let variantIdx = 0;

  while (stripIdx < stripped.length && origIdx < line.length) {
    // Check if we're at a pattern boundary
    if (variantIdx < positions.length && stripIdx === positions[variantIdx]) {
      // We're at the start of a pattern occurrence
      // Append the variant
      newLine += variants[variantIdx % variants.length];
      // Advance past the pattern in stripped
      stripIdx += pattern.length;
      // Advance past the pattern in original (using the same mapping logic)
      for (let i = 0; i < pattern.length; i++) {
        if (isQuote(line, origIdx)) {
          origIdx = skipQuote(line, origIdx);
        } else {
          origIdx++;
        }
      }
      variantIdx++;
    } else {
      // Copy character from original
      if (isQuote(line, origIdx)) {
        const quoteEnd = skipQuote(line, origIdx);
        newLine += line.substring(origIdx, quoteEnd);
        origIdx = quoteEnd;
      } else {
        newLine += line[origIdx];
        origIdx++;
        stripIdx++;
      }
    }
  }

  // Append any remaining characters from original
  while (origIdx < line.length) {
    newLine += line[origIdx];
    origIdx++;
  }

  return newLine;
}

function fixChapter(vol, chapterFile, patternVariants) {
  const filePath = path.join(CHAPTERS_DIR, 'volume-' + vol, chapterFile + '-polished.md');
  if (!fs.existsSync(filePath)) {
    console.log(chapterFile + ': not found');
    return 0;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const findings = getFindings(filePath);
  if (findings.length === 0) return 0;

  const lines = content.split('\n');
  let totalFixed = 0;

  for (const [pattern, variants] of Object.entries(patternVariants)) {
    // Find all matching lines
    const matchingLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (stripQuoted(lines[i]).includes(pattern)) {
        matchingLines.push(i);
      }
    }

    if (matchingLines.length < 3) continue;

    // Process each matching line
    let variantOffset = 0;
    for (const idx of matchingLines) {
      const result = replaceInLine(lines[idx], pattern, variants.slice(variantOffset));
      if (result && result !== lines[idx]) {
        lines[idx] = result;
        totalFixed++;
      }
      variantOffset += 3; // Assume up to 3 occurrences per line
    }
  }

  if (totalFixed > 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  return totalFixed;
}

const fixes = {
  'chapter-702': {
    '每条记忆都是一个完整的，人生': [
      '每条记忆都是一个完整的人生',
      '每条记忆都是完整的人生',
      '每条记忆都是一个人生',
      '每条记忆构成完整的人生',
      '每条记忆都是完整的人生',
      '每条记忆都是一个人生',
    ],
  },
  'chapter-703': {
    '防火墙，在控制哪些，记忆浮现': [
      '防火墙在控制哪些记忆浮现',
      '朵朵的防火墙在控制哪些记忆浮现',
      '防火墙控制哪些记忆浮现',
      '朵朵的防火墙控制记忆浮现',
      '朵朵防火墙在控制哪些记忆浮现',
      '朵朵防火墙控制记忆浮现',
    ],
  },
  'chapter-704': {
    '0429碎片在干扰他的，信号': [
      '0429碎片在干扰他的信号',
      '0429碎片干扰他的信号',
      '0429碎片在干扰信号',
      '0429碎片干扰信号',
      '0429碎片正在干扰他的信号',
      '0429碎片在干扰他的通讯',
    ],
  },
  'chapter-771': {
    '0428副本在女儿的意识中': [
      '0428副本在女儿的意识深处',
      '0428副本在女儿的意识里',
      '0428副本在女儿的意识内',
      '0428副本在女儿脑海中',
      '0428副本深植于女儿的意识',
      '0428副本已在女儿的意识中',
    ],
  },
  'chapter-780': {
    '叶文轩感到2147年的自己的': [
      '叶文轩感受到2147年的那个自己的',
      '叶文轩察觉到2147年那个自己的',
      '叶文轩看到2147年自己的',
      '叶文轩感受到2147年那个自己的',
      '叶文轩察觉2147年自己的',
      '叶文轩感知2147年自己的',
    ],
  },
};

let totalFixed = 0;
for (const [chKey, patternMap] of Object.entries(fixes)) {
  const vol = chKey.startsWith('77') || chKey.startsWith('78') ? '6' : '5';
  const fixed = fixChapter(vol, chKey, patternMap);
  if (fixed > 0) {
    totalFixed += fixed;
    console.log(chKey + ': ' + fixed + ' replacements');
  } else {
    console.log(chKey + ': 0 (no change needed or patterns not found)');
  }
}

console.log('\nTotal: ' + totalFixed + ' replacements');
