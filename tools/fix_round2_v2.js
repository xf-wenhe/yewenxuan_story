// Fix warmth pattern WITH comma - variants end with comma
const fs = require('fs');
const path = require('path');

const CHAPTERS_DIR = 'D:/work/yewenxuan_story/chapters';

function fixChapter(volume, chapterFile, pattern, variants) {
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

  // Keep first occurrence
  const keepIdx = matchingIndices[0];
  const rewriteIndices = matchingIndices.slice(1);

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

// Warmth pattern WITH comma preserved at end
const warmthPattern = '0429碎片在温暖地跳动，';
const warmthVariants = [
  '0429碎片温暖地跳动，',
  '0429碎片在温暖地跳动着，',
  '温暖的能量在0429碎片中跳动，',
  '0429碎片带着温暖跳动，',
];

// Process warmth chapters
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

let totalFixed = 0;
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, warmthPattern, warmthVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' warmth fixes');
    totalFixed += fixed;
  }
}

// Vibration pattern
const vibrationPattern = '0429碎片在赵大嘴的体内振动';
const vibrationVariants = [
  '0429碎片在赵大嘴的体内振动',
  '0429碎片在赵大嘴的体内振动着',
  '0429碎片在赵大嘴体内振动',
];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, vibrationPattern, vibrationVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' vibration fixes');
    totalFixed += fixed;
  }
}

// Energy pattern
const energyPattern = '备用能量正在急速消耗';
const energyVariants = ['备用能量正在快速消耗', '备用能量在快速消耗', '备用能量急速消耗'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, energyPattern, energyVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' energy fixes');
    totalFixed += fixed;
  }
}

// Collapse pattern
const collapsePattern = '回廊在加速崩溃';
const collapseVariants = ['回廊正在加速崩溃', '回廊在加速崩溃', '回廊加速崩溃'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, collapsePattern, collapseVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' collapse fixes');
    totalFixed += fixed;
  }
}

// Brain pattern
const brainPattern = '赵大嘴的脑子在转';
const brainVariants = ['赵大嘴的脑子还在转', '赵大嘴的脑子在转', '赵大嘴脑子在转'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, brainPattern, brainVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' brain fixes');
    totalFixed += fixed;
  }
}

// Signal pattern
const signalPattern = '0429备份的信号在叶文轩的空间层中脉动，一下，两下，三下';
const signalVariants = ['0429备份的信号在叶文轩的空间层中一下、两下、三下地脉动', '叶文轩能感觉到0429备份的信号在空间层中脉动着——一下，两下，三下'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, signalPattern, signalVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' signal fixes');
    totalFixed += fixed;
  }
}

// Blood pattern
const bloodPattern = '血液在叶文轩体内加速奔流';
const bloodVariants = ['血液在叶文轩体内加速奔流', '血液在叶文轩的身体里加速奔流'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, bloodPattern, bloodVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' blood fixes');
    totalFixed += fixed;
  }
}

// Burn pattern
const burnPattern = '赵大嘴感到0429碎片在体内的灼烧感';
const burnVariants = ['赵大嘴感到0429碎片在体内的灼烧感', '赵大嘴感到体内的灼烧感在增强', '赵大嘴的体内传来灼烧感'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, burnPattern, burnVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' burn fixes');
    totalFixed += fixed;
  }
}

// Race pattern
const racePattern = '42小时，时间赛跑';
const raceVariants = ['42小时，时间赛跑', '42小时——时间在赛跑'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, racePattern, raceVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' race fixes');
    totalFixed += fixed;
  }
}

// Design pattern - can't easily vary, so skip
// System pattern
const systemPattern = '系统的声音在困惑';
const systemVariants = ['系统的声音在困惑', '系统在困惑'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, systemPattern, systemVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' system fixes');
    totalFixed += fixed;
  }
}

// Exec pattern
const execPattern = '系统的执行程序无法解析';
const execVariants = ['系统的执行程序无法解析', '系统无法解析'];
for (const ch of warmthChapters) {
  const fixed = fixChapter(ch.v, ch.f, execPattern, execVariants);
  if (fixed > 0) {
    console.log(ch.f + ': ' + fixed + ' exec fixes');
    totalFixed += fixed;
  }
}

console.log('\nTotal fixes: ' + totalFixed);
