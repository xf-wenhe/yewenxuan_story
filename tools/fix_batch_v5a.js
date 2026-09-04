// Fix batch: V5 ch.572, ch.579, ch.580, ch.637, ch.657
const fs = require('fs');
const path = 'D:/work/yewenxuan_story/chapters/volume-5';
const files = [
  'chapter-572-polished.md',
  'chapter-579-polished.md',
  'chapter-580-polished.md',
  'chapter-637-polished.md',
  'chapter-657-polished.md',
];
for (const file of files) {
  const fullPath = path + '/' + file;
  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const replacements = new Map();

  if (file === 'chapter-572-polished.md') {
    // 划痕的深度一致，每一道螺旋的间距差不多，是同一个人的手法 (×3)
    // L5: keep, find others
    for (let i = 0; i < lines.length; i++) {
      if (i !== 4 && lines[i].includes('划痕的深度一致')) {
        replacements.set(i, lines[i].replace('划痕的深度一致，每一道螺旋的间距差不多，是同一个人的手法', '每一道螺旋的间距和深度都带着同一个人的痕迹'));
      }
    }
  }

  if (file === 'chapter-579-polished.md') {
    // 0429备份的信号在叶文轩的空间层中脉动，一下，两下，三下 (×4, keep L15)
    // 0428碎片在石台上浮动 (×3, keep ?)
    for (let i = 0; i < lines.length; i++) {
      if (i !== 14 && lines[i].includes('0429备份的信号在叶文轩的空间层中脉动')) {
        const variants = ['0429备份的信号在叶文轩的空间层中一下、两下、三下地脉动', '叶文轩能感觉到0429备份的信号在空间层中脉动着——一下，两下，三下'];
        replacements.set(i, variants[replacements.size % variants.length]);
      }
      if (lines[i].includes('0428碎片在石台上浮动')) {
        const variants = ['0428碎片在石台上缓缓浮动', '0428碎片在石台上轻轻浮动', '0428碎片在石台上浮动'];
        replacements.set(i, variants[replacements.size % variants.length]);
      }
    }
  }

  if (file === 'chapter-580-polished.md') {
    // 0429备份的信号在叶文轩的空间层中脉动，一下，两下，三下0429备份在跨越边界 (×3)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('0429备份的信号在叶文轩的空间层中脉动，一下，两下，三下')) {
        const variants = ['0429备份的信号在叶文轩的空间层中一下、两下、三下地脉动着', '叶文轩能感觉到0429备份的信号在空间层中脉动——一下，两下，三下'];
        replacements.set(i, variants[replacements.size % variants.length]);
      }
    }
  }

  if (file === 'chapter-637-polished.md') {
    // 号，叶文轩在看赵大嘴的意识中的温暖的信号 (×3)
    // 桥梁在说：锚点B当前状态，平静，温暖喜悦 (×3)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('叶文轩在看赵大嘴的意识中的温暖的信号')) {
        replacements.set(i, lines[i].replace('叶文轩在看赵大嘴的意识中的温暖的信号', '叶文轩在"看"赵大嘴意识中那些温暖的信号'));
      }
      if (lines[i].includes('桥梁在说：锚点B当前状态，平静，温暖喜悦')) {
        replacements.set(i, lines[i].replace('桥梁在说：锚点B当前状态，平静，温暖喜悦', '桥梁传递的信息是：锚点B当前状态——平静、温暖、喜悦'));
      }
    }
  }

  if (file === 'chapter-657-polished.md') {
    // 0428备份在发光，0428备份在微笑 (×4)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('0428备份在发光，0428备份在微笑')) {
        const variants = ['0428备份在发光，同时在微笑', '0428备份既在发光，也在微笑', '0428备份在发光，脸上带着微笑'];
        replacements.set(i, variants[replacements.size % variants.length]);
      }
    }
  }

  let count = 0;
  for (const [idx, newLine] of replacements) {
    if (idx >= 0 && idx < lines.length) {
      lines[idx] = newLine;
      count++;
    }
  }
  if (count > 0) {
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    console.log(file + ': applied ' + count + ' replacements');
  }
}
