// Fix remaining 5 blocking findings - simpler approach: replace from end to start
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

// Find all original positions of pattern in a line
function findOriginalPositions(line, pattern) {
  const stripped = stripQuoted(line);
  const positions = [];

  let pos = 0;
  while ((pos = stripped.indexOf(pattern, pos)) !== -1) {
    // Map this stripped position back to original
    let origPos = 0;
    let stripPos = 0;
    while (stripPos < pos) {
      const ch = line[origPos];
      if (ch === '"' || ch === '「' || ch === '『') {
        const endCh = ch === '"' ? '"' : (ch === '「' ? '」' : '』');
        origPos++;
        while (origPos < line.length && line[origPos] !== endCh) origPos++;
        origPos++; // skip end quote
      } else {
        stripPos++;
        origPos++;
      }
    }
    positions.push(origPos);
    pos += pattern.length;
  }

  return positions;
}

// Replace pattern at specific original positions with variants
function replaceAtPositions(line, pattern, variants) {
  // Sort positions in reverse order so replacements don't shift earlier positions
  const positions = findOriginalPositions(line, pattern).reverse();

  let result = line;
  for (let i = 0; i < positions.length && i < variants.length; i++) {
    const pos = positions[i];
    result = result.substring(0, pos) + variants[i] + result.substring(pos + pattern.length);
  }

  return result;
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
    const matchingLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (stripQuoted(lines[i]).includes(pattern)) {
        matchingLines.push(i);
      }
    }

    if (matchingLines.length < 3) continue;

    let varIdx = 0;
    for (const idx of matchingLines) {
      const newLine = replaceAtPositions(lines[idx], pattern, variants.slice(varIdx, varIdx + 3));
      if (newLine !== lines[idx]) {
        lines[idx] = newLine;
        totalFixed++;
      }
      varIdx += 3;
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
    ],
  },
  'chapter-703': {
    '防火墙，在控制哪些，记忆浮现': [
      '防火墙在控制哪些记忆浮现',
      '朵朵的防火墙在控制哪些记忆浮现',
      '防火墙控制哪些记忆浮现',
      '朵朵的防火墙控制记忆浮现',
      '朵朵防火墙在控制哪些记忆浮现',
    ],
  },
  'chapter-704': {
    '0429碎片在干扰他的，信号': [
      '0429碎片在干扰他的信号',
      '0429碎片干扰他的信号',
      '0429碎片在干扰信号',
      '0429碎片干扰信号',
      '0429碎片正在干扰他的信号',
    ],
  },
  'chapter-771': {
    '0428副本在女儿的意识中': [
      '0428副本在女儿的意识深处',
      '0428副本在女儿的意识里',
      '0428副本在女儿的意识内',
      '0428副本在女儿脑海中',
      '0428副本深植于女儿的意识',
    ],
  },
  'chapter-780': {
    '叶文轩感到2147年的自己的': [
      '叶文轩感受到2147年的那个自己的',
      '叶文轩察觉到2147年那个自己的',
      '叶文轩看到2147年自己的',
      '叶文轩感受到2147年那个自己的',
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
