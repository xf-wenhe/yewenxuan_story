// Fix warmth pattern WITH comma preserved
const fs = require('fs');
const path = require('path');

const CHAPTERS_DIR = 'D:/work/yewenxuan_story/chapters';

function fixChapter(volume, chapterFile, pattern, keepLineNum, getVariants) {
  const filePath = path.join(CHAPTERS_DIR, 'volume-' + volume, chapterFile);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const matchingIndices = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      matchingIndices.push(i);
    }
  }

  if (matchingIndices.length < 3) return 0;

  const keepIdx = matchingIndices.find(idx => idx === keepLineNum - 1) || matchingIndices[0];
  const rewriteIndices = matchingIndices.filter(idx => idx !== keepIdx);

  const variants = getVariants(rewriteIndices.length);
  let count = 0;

  for (let j = 0; j < rewriteIndices.length; j++) {
    const idx = rewriteIndices[j];
    if (idx < 0 || idx >= lines.length) continue;

    const variant = variants[j % variants.length];
    const originalLine = lines[idx];

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

// Warmth pattern WITH comma - variants must end with comma to preserve sentence structure
const warmthPattern = '0429碎片在温暖地跳动，';
const warmthVariants = (n) => {
  const v = [
    '0429碎片温暖地跳动，',
    '0429碎片在温暖地跳动着，',
    '温暖的能量在0429碎片中跳动，',
    '0429碎片带着温暖跳动，',
    '0429碎片温暖地跳，',
  ];
  const result = [];
  for (let i = 0; i < n; i++) result.push(v[i % v.length]);
  return result;
};

// Vibration pattern
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

// Energy pattern
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

// Collapse pattern
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

// Brain pattern
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

// Signal pattern
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

// Process all remaining chapters with targeted fixes
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

// Also fix vibration, energy, collapse, brain patterns
const otherChapters = [
  { v: 5, f: 'chapter-676-polished.md', pattern: '0429碎片在变成赵大嘴的，一部分', variants: () => ['0429碎片在变成赵大嘴的一部分', '0429碎片正在变成赵大嘴的一部分'] },
  { v: 5, f: 'chapter-677-polished.md', pattern: '朵朵的意识和闭环的记忆库已经连接了', variants: () => ['朵朵的意识和闭环的记忆库之间已经建立了连接'] },
  { v: 5, f: 'chapter-678-polished.md', pattern: '沈知秋的记忆在朵朵的意识，中苏醒', variants: () => ['沈知秋的记忆在朵朵的意识中苏醒了', '沈知秋的记忆在朵朵的意识里苏醒'] },
  { v: 5, f: 'chapter-680-polished.md', pattern: '0428备份在发光，0428备份在微笑', variants: () => ['0428备份在发光，脸上带着微笑', '0428备份既在发光，也在微笑'] },
  { v: 5, f: 'chapter-683-polished.md', pattern: '空气静下来，连自己的呼吸声都听得清楚', variants: () => ['周围安静下来，连呼吸声都听得清楚', '空气沉下来，连呼吸声都听得清楚'] },
  { v: 5, f: 'chapter-686-polished.md', pattern: '空气静下来，连自己的呼吸声都听得清楚', variants: () => ['周围安静下来，连呼吸声都听得清楚', '空气沉下来，连呼吸声都听得清楚'] },
  { v: 5, f: 'chapter-689-polished.md', pattern: '我们需要在核心决策，层反应之前', variants: () => ['我们需要在核心决策层反应之前完成'] },
  { v: 5, f: 'chapter-695-polished.md', pattern: '0429碎片现在是，一个独立的，意识体', variants: () => ['0429碎片已经成为一个独立的意识体', '0429碎片现在是独立的意识体'] },
  { v: 5, f: 'chapter-699-polished.md', pattern: '沈知秋的意识，不会消耗，能量', variants: () => ['沈知秋的意识不会消耗能量'] },
  { v: 5, f: 'chapter-706-polished.md', pattern: '空气静下来，连自己的呼吸声都听得清楚', variants: () => ['周围安静下来，连呼吸声都听得清楚', '空气沉下来，连呼吸声都听得清楚'] },
  { v: 5, f: 'chapter-733-polished.md', pattern: '0224的声音简短，极端派一级响应已激活', variants: () => ['0224的声音简短：极端派一级响应已激活'] },
  { v: 5, f: 'chapter-734-polished.md', pattern: '他面前的空气在轻微地扭曲', variants: () => ['他面前的空气在轻微地扭曲'] },
  { v: 6, f: 'chapter-771-polished.md', pattern: '0428副本在女儿的意识中', variants: () => ['0428副本在女儿的意识深处', '0428副本在女儿的意识里'] },
  { v: 6, f: 'chapter-774-polished.md', pattern: '沈知秋的在叶文轩的脑子里', variants: () => ['沈知秋的意识在叶文轩的脑子里'] },
  { v: 6, f: 'chapter-776-polished.md', pattern: '0428在叶文轩的脑子里', variants: () => ['0428在叶文轩的脑海中'] },
  { v: 6, f: 'chapter-776-polished.md', pattern: '0428碎片在沈知秋的上方', variants: () => ['0428碎片在沈知秋的上方悬浮'] },
  { v: 6, f: 'chapter-780-polished.md', pattern: '叶文轩感到0429在叶文轩的脑子里振动', variants: () => ['叶文轩"感到"0429在叶文轩的脑子里嗡鸣，0429的主体和备份在共振'] },
];

for (const ch of otherChapters) {
  const fixed = fixChapter(ch.v, ch.f, ch.pattern, 1, ch.variants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' fixes for ' + ch.pattern.substring(0, 30));
    totalFixed += fixed;
  }
}

console.log('\nTotal other fixes: ' + totalFixed);
