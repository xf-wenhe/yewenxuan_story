// Targeted fix for the 9 remaining blocking findings
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

// Fix a chapter by replacing all occurrences of patterns with unique variants
function fixChapter(vol, chapterFile, patternVariantsMap) {
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

  for (const [pattern, variants] of Object.entries(patternVariantsMap)) {
    // Find all line indices where this pattern appears (after stripQuoted)
    const matchingIndices = [];
    for (let i = 0; i < lines.length; i++) {
      if (stripQuoted(lines[i]).includes(pattern)) {
        matchingIndices.push(i);
      }
    }

    if (matchingIndices.length < 3) continue;

    // Replace each occurrence with a different variant
    // Process line by line, replacing all occurrences of pattern in each line
    let variantIdx = 0;
    for (const idx of matchingIndices) {
      const originalLine = lines[idx];
      const stripped = stripQuoted(originalLine);

      // Count how many times pattern appears in this line
      let occurrences = 0;
      let pos = 0;
      while ((pos = stripped.indexOf(pattern, pos)) !== -1) {
        occurrences++;
        pos += pattern.length;
      }

      if (occurrences === 0) continue;

      // For single occurrence lines, replace directly
      if (occurrences === 1) {
        const variant = variants[variantIdx % variants.length];
        // Find position in original line (accounting for stripped quotes)
        const origPos = findPosInOriginal(originalLine, stripped, pattern);
        if (origPos >= 0) {
          lines[idx] = originalLine.substring(0, origPos) + variant + originalLine.substring(origPos + pattern.length);
          totalFixed++;
        }
        variantIdx++;
      } else {
        // Multiple occurrences in one line - replace each with different variant
        // This is complex with quotes, so replace the whole line content
        // Strategy: build the line by replacing occurrences in order
        let newLine = originalLine;
        let offset = 0;
        for (let occ = 0; occ < occurrences; occ++) {
          const variant = variants[(variantIdx + occ) % variants.length];
          // Find next occurrence position in the current newLine (stripped)
          const searchIn = stripQuoted(newLine);
          const searchPos = searchIn.indexOf(pattern);
          if (searchPos >= 0) {
            const origPos = findPosInOriginal(newLine, stripQuoted(newLine), pattern);
            if (origPos >= 0) {
              newLine = newLine.substring(0, origPos) + variant + newLine.substring(origPos + pattern.length);
              totalFixed++;
            }
          }
        }
        lines[idx] = newLine;
        variantIdx += occurrences;
      }
    }
  }

  if (totalFixed > 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  return totalFixed;
}

// Find the position of a substring in the original line, accounting for stripped quotes
function findPosInOriginal(original, stripped, target) {
  let origPos = 0;
  let stripPos = 0;

  // First, find target in stripped
  const targetPos = stripped.indexOf(target);
  if (targetPos < 0) return -1;

  // Map back to original position
  while (stripPos < targetPos) {
    if (isQuote(original, origPos)) {
      origPos = skipQuote(original, origPos);
    } else {
      origPos++;
      stripPos++;
    }
  }

  return origPos;
}

function isQuote(text, pos) {
  const ch = text[pos];
  return ch === '\u201c' || ch === '\u201d' || ch === '\u300c' || ch === '\u300d' || ch === '\u300e' || ch === '\u300f';
}

function skipQuote(text, pos) {
  const ch = text[pos];
  if (ch === '\u201c' || ch === '\u201d') {
    let i = pos + 1;
    while (i < text.length && text[i] !== ch) i++;
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

// Define fixes for each chapter
const fixes = {};

// ch.702: 72小时后说：记忆传输完成 (3x), 每条记忆都是一个完整的，人生 (3x)
fixes['chapter-702'] = {
  '72小时后说：记忆传输完成': [
    '72小时后，说：记忆传输完成',
    '72小时后，记忆传输完成',
    '72小时一到，记忆传输完成',
    '72小时后说：记忆传输完毕',
  ],
  '每条记忆都是一个完整的，人生': [
    '每条记忆都是一个完整的人生',
    '每条记忆都是完整的人生',
    '每条记忆都是一个人生',
    '每条记忆构成完整的人生',
  ],
};

// ch.703: 防火墙，在控制哪些，记忆浮现 (3x)
fixes['chapter-703'] = {
  '防火墙，在控制哪些，记忆浮现': [
    '防火墙在控制哪些记忆浮现',
    '朵朵的防火墙在控制哪些记忆浮现',
    '防火墙控制哪些记忆浮现',
    '朵朵的防火墙控制记忆浮现',
    '朵朵防火墙在控制哪些记忆浮现',
    '朵朵防火墙控制记忆浮现',
  ],
};

// ch.704: 0429碎片在干扰他的，信号 (3x in long line)
fixes['chapter-704'] = {
  '0429碎片在干扰他的，信号': [
    '0429碎片在干扰他的信号',
    '0429碎片干扰他的信号',
    '0429碎片在干扰信号',
    '0429碎片干扰信号',
    '0429碎片正在干扰他的信号',
    '0429碎片在干扰他的通讯',
  ],
};

// ch.711: 0224的追踪程序会陷入死循环 (4x), 0224的追踪程序在计算 (3x)
fixes['chapter-711'] = {
  '0224的追踪程序会陷入死循环': [
    '0224的追踪程序陷入死循环',
    '0224的追踪程序进入死循环',
    '0224追踪程序陷入死循环',
    '0224追踪程序进入死循环',
    '0224追踪程序进了死循环',
    '0224追踪程序陷入循环',
  ],
  '0224的追踪程序在计算': [
    '0224的追踪程序还在计算',
    '0224的追踪程序仍在计算',
    '0224追踪程序还在计算',
    '0224的追踪程序继续计算',
    '0224追踪程序继续计算',
    '0224的追踪程序计算中',
  ],
};

// ch.720: 0224的纹路中有，一个异常 (3x)
fixes['chapter-720'] = {
  '0224的纹路中有，一个异常': [
    '0224的纹路中有一处异常',
    '0224的纹路有一个异常点',
    '0224纹路中有一处异常',
    '0224纹路有个异常',
    '0224的纹路有异常',
    '0224纹路出现异常',
  ],
};

// ch.771: 0428副本在女儿的意识中 (3x)
fixes['chapter-771'] = {
  '0428副本在女儿的意识中': [
    '0428副本在女儿的意识深处',
    '0428副本在女儿的意识里',
    '0428副本在女儿的意识内',
    '0428副本在女儿脑海中',
    '0428副本深植于女儿的意识',
    '0428副本已在女儿的意识中',
  ],
};

// ch.780: 叶文轩感到2147年的自己的 (3x)
fixes['chapter-780'] = {
  '叶文轩感到2147年的自己的': [
    '叶文轩感受到2147年的那个自己的',
    '叶文轩察觉到2147年那个自己的',
    '叶文轩"看到"2147年自己的',
    '叶文轩感受到2147年那个自己的',
    '叶文轩察觉2147年自己的',
    '叶文轩"感受到"2147年自己的',
  ],
};

// Run fixes
let totalFixed = 0;
for (const [chKey, patternMap] of Object.entries(fixes)) {
  const vol = chKey.startsWith('77') || chKey.startsWith('78') ? '6' : '5';
  const fixed = fixChapter(vol, chKey, patternMap);
  if (fixed > 0) {
    totalFixed += fixed;
    console.log(chKey + ': ' + fixed + ' replacements');
  } else {
    console.log(chKey + ': 0 (patterns not found or <3 occurrences)');
  }
}

console.log('\nTotal: ' + totalFixed + ' replacements');
