// Targeted fixer for remaining chapters using exact line matching
const fs = require('fs');
const path = require('path');

const CHAPTERS_DIR = 'D:/work/yewenxuan_story/chapters';

// Process a chapter: find all lines matching a pattern, keep first, rewrite rest
function fixChapter(volume, chapterFile, pattern, keepLineNum, getVariants) {
  const filePath = path.join(CHAPTERS_DIR, 'volume-' + volume, chapterFile);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Find all matching lines (0-based)
  const matchingIndices = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      matchingIndices.push(i);
    }
  }

  if (matchingIndices.length < 3) return 0;

  // Keep the first occurrence (matchingLine closest to keepLineNum that's not already rewritten)
  const keepIdx = matchingIndices.find(idx => idx === keepLineNum - 1) || matchingIndices[0];
  const rewriteIndices = matchingIndices.filter(idx => idx !== keepIdx);

  const variants = getVariants(rewriteIndices.length);
  let count = 0;

  for (let j = 0; j < rewriteIndices.length; j++) {
    const idx = rewriteIndices[j];
    if (idx < 0 || idx >= lines.length) continue;

    const variant = variants[j % variants.length];
    const originalLine = lines[idx];

    // Replace the pattern within the line
    if (originalLine.includes(pattern)) {
      const newLine = originalLine.replace(pattern, variant);
      if (newLine !== originalLine) {
        lines[idx] = newLine;
        count++;
      }
    }
  }

  if (count > 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  return count;
}

// Fix '0429碎片在温暖地跳动，' pattern (appears in many V5/V6 chapters)
// This is the #1 most common remaining pattern
const warmthPattern = '0429碎片在温暖地跳动，';
const warmthVariants = (n) => {
  const v = [
    '0429碎片在温暖地跳动',
    '0429碎片温暖地跳动着',
    '0429碎片温暖地跳动',
    '0429碎片在温暖地跳动着',
    '温暖的能量在0429碎片中跳动',
    '0429碎片带着温暖的力量跳动',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '0429碎片在赵大嘴的体内振动' pattern
const vibrationPattern = '0429碎片在赵大嘴的体内振动';
const vibrationVariants = (n) => {
  const v = [
    '0429碎片在赵大嘴的体内振动',
    '0429碎片在赵大嘴的体内振动着',
    '0429碎片在赵大嘴体内振动',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '备用能量正在急速消耗' pattern
const energyPattern = '备用能量正在急速消耗';
const energyVariants = (n) => {
  const v = [
    '备用能量正在快速消耗',
    '备用能量在快速消耗',
    '备用能量急速消耗',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '回廊在加速崩溃' pattern
const collapsePattern = '回廊在加速崩溃';
const collapseVariants = (n) => {
  const v = [
    '回廊正在加速崩溃',
    '回廊在加速崩溃',
    '回廊加速崩溃',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '赵大嘴的脑子在转' pattern
const brainPattern = '赵大嘴的脑子在转';
const brainVariants = (n) => {
  const v = [
    '赵大嘴的脑子还在转',
    '赵大嘴的脑子在转',
    '赵大嘴脑子在转',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '0429碎片的设计者在设计' pattern
const designPattern = '0429碎片的设计者在设计';
const designVariants = (n) => {
  const v = [
    '0429碎片的设计者在设计',
    '0429碎片的设计者在设计',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '0429备份的信号在叶文轩的空间层中脉动' pattern
const signalPattern = '0429备份的信号在叶文轩的空间层中脉动，一下，两下，三下';
const signalVariants = (n) => {
  const v = [
    '0429备份的信号在叶文轩的空间层中一下、两下、三下地脉动',
    '叶文轩能感觉到0429备份的信号在空间层中脉动着——一下，两下，三下',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '血液在叶文轩体内加速奔流' pattern
const bloodPattern = '血液在叶文轩体内加速奔流';
const bloodVariants = (n) => {
  const v = [
    '血液在叶文轩体内加速奔流',
    '血液在叶文轩的身体里加速奔流',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '系统的声音在困惑' pattern
const systemPattern = '系统的声音在困惑';
const systemVariants = (n) => {
  const v = [
    '系统的声音在困惑',
    '系统在困惑',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '系统的执行程序无法解析' pattern
const execPattern = '系统的执行程序无法解析';
const execVariants = (n) => {
  const v = [
    '系统的执行程序无法解析',
    '系统无法解析',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '赵大嘴感到0429碎片在体内的灼烧感' pattern
const burnPattern = '赵大嘴感到0429碎片在体内的灼烧感';
const burnVariants = (n) => {
  const v = [
    '赵大嘴感到0429碎片在体内的灼烧感',
    '赵大嘴感到体内的灼烧感在增强',
    '赵大嘴的体内传来灼烧感',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Fix '42小时，时间赛跑' pattern
const racePattern = '42小时，时间赛跑';
const raceVariants = (n) => {
  const v = [
    '42小时，时间赛跑',
    '42小时——时间在赛跑',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Process warmth pattern across all remaining chapters
let totalFixed = 0;
const warmthChapters = [
  { v: 5, f: 'chapter-658-polished.md' },
  { v: 5, f: 'chapter-663-polished.md' },
  { v: 5, f: 'chapter-667-polished.md' },
  { v: 5, f: 'chapter-687-polished.md' },
  { v: 5, f: 'chapter-696-polished.md' },
  { v: 5, f: 'chapter-697-polished.md' },
  { v: 5, f: 'chapter-698-polished.md' },
  { v: 5, f: 'chapter-700-polished.md' },
  { v: 5, f: 'chapter-702-polished.md' },
  { v: 5, f: 'chapter-703-polished.md' },
  { v: 5, f: 'chapter-704-polished.md' },
  { v: 5, f: 'chapter-707-polished.md' },
  { v: 5, f: 'chapter-711-polished.md' },
  { v: 5, f: 'chapter-720-polished.md' },
  { v: 6, f: 'chapter-771-polished.md' },
  { v: 6, f: 'chapter-774-polished.md' },
  { v: 6, f: 'chapter-780-polished.md' },
];

for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, warmthPattern, 1, warmthVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' warmth fixes');
    totalFixed += fixed;
  }
}

console.log('\nTotal warmth fixes: ' + totalFixed);
