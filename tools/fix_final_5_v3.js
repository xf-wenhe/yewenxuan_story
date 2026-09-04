// Fix remaining 5 blocking findings - handles multiple occurrences in single line
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

// Count occurrences of pattern in a single line (in stripped version)
function countOccurrences(line, pattern) {
  return stripQuoted(line).split(pattern).length - 1;
}

// Replace ALL occurrences of pattern in a line, from end to start
// Uses different variants for each occurrence
function replaceAllInLine(line, pattern, variants) {
  const count = countOccurrences(line, pattern);
  if (count === 0) return null;

  let result = line;
  // Replace from last occurrence to first (reverse order keeps positions valid)
  for (let i = count - 1; i >= 0; i--) {
    const lastPos = result.lastIndexOf(pattern);
    if (lastPos < 0) break;
    const variant = variants[i % variants.length];
    result = result.substring(0, lastPos) + variant + result.substring(lastPos + pattern.length);
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
  const modifiedLines = new Set();

  for (const finding of findings) {
    const pattern = finding.bare;
    const count = finding.count;
    if (count < 3) continue;

    // Get variants for this pattern
    const variants = patternVariants[pattern];
    if (!variants) continue;

    // Find all lines containing this pattern
    const matchingLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (stripQuoted(lines[i]).includes(pattern)) {
        matchingLines.push(i);
      }
    }

    if (matchingLines.length < 1) continue;

    // Replace occurrences in each matching line
    let variantOffset = 0;
    for (const idx of matchingLines) {
      if (modifiedLines.has(idx)) continue; // skip already modified lines

      const occCount = countOccurrences(lines[idx], pattern);
      if (occCount === 0) continue;

      const lineVariants = [];
      for (let v = 0; v < occCount; v++) {
        lineVariants.push(variants[(variantOffset + v) % variants.length]);
      }

      const newLine = replaceAllInLine(lines[idx], pattern, lineVariants);
      if (newLine && newLine !== lines[idx]) {
        lines[idx] = newLine;
        totalFixed++;
        modifiedLines.add(idx);
      }
      variantOffset += occCount;
    }
  }

  if (totalFixed > 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  return totalFixed;
}

const fixes = {
  '每条记忆都是一个完整的，人生': [
    '每条记忆都是一个完整的人生',
    '每条记忆都是完整的人生',
    '每条记忆都是一个人生',
    '每条记忆构成完整的人生',
    '每条记忆都是完整的人生',
    '每条记忆都是一个人生',
  ],
  '防火墙，在控制哪些，记忆浮现': [
    '防火墙在控制哪些记忆浮现',
    '朵朵的防火墙在控制哪些记忆浮现',
    '防火墙控制哪些记忆浮现',
    '朵朵的防火墙控制记忆浮现',
    '朵朵防火墙在控制哪些记忆浮现',
    '朵朵防火墙控制记忆浮现',
  ],
  '0429碎片在干扰他的，信号': [
    '0429碎片在干扰他的信号',
    '0429碎片干扰他的信号',
    '0429碎片在干扰信号',
    '0429碎片干扰信号',
    '0429碎片正在干扰他的信号',
    '0429碎片在干扰他的通讯',
  ],
  '0428副本在女儿的意识中': [
    '0428副本在女儿的意识深处',
    '0428副本在女儿的意识里',
    '0428副本在女儿的意识内',
    '0428副本在女儿脑海中',
    '0428副本深植于女儿的意识',
    '0428副本已在女儿的意识中',
  ],
  '叶文轩感到2147年的自己的': [
    '叶文轩感受到2147年的那个自己的',
    '叶文轩察觉到2147年那个自己的',
    '叶文轩看到2147年自己的',
    '叶文轩感受到2147年那个自己的',
    '叶文轩感知2147年自己的',
    '叶文轩"感受"2147年自己的',
  ],
  // For ch.711 remaining issues
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

const chapters = [
  { v: 5, f: 'chapter-702' },
  { v: 5, f: 'chapter-703' },
  { v: 5, f: 'chapter-704' },
  { v: 5, f: 'chapter-711' },
  { v: 6, f: 'chapter-771' },
  { v: 6, f: 'chapter-780' },
];

let totalFixed = 0;
for (const ch of chapters) {
  const fixed = fixChapter(ch.v, ch.f, fixes);
  if (fixed > 0) {
    totalFixed += fixed;
    console.log(ch.f + ': ' + fixed + ' replacements');
  } else {
    console.log(ch.f + ': 0 (no change or already clean)');
  }
}
console.log('\nTotal: ' + totalFixed + ' replacements');
