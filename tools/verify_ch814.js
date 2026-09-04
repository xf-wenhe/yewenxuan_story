// Fix ALL 10 blocking findings in ch.814 using line-by-line rewrites
const fs = require('fs');
const path = 'D:/work/yewenxuan_story/chapters/volume-6/chapter-814-polished.md';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Verify we can find all the bare sentences after stripQuoted
function stripQuoted(line) {
  return line.replace(/[“”\u201c\u201d"].*?"/g, '');
}

// First, find all occurrences of each bare sentence and which lines they're on
const bareTargets = [
  '叶文轩能0428备份于坐标处发出微光，',
  '叶文轩0429在叶文轩的脑子里嗡鸣，0429的主体和备份在共振',
  '叶文轩能0428备份在坐标处散发光芒，',
  '叶文轩能0428副本在坐标位置释放出光线，',
  '赵大嘴是第N-1轮叶文轩的',
  '赵大嘴能叶文轩了47个循环的记忆',
  '赵大嘴能叶文轩了第N-1轮叶文轩的遗言',
  '赵大嘴能叶文轩了重构的过程',
  '赵大嘴能叶文轩了固化脚本被的原因',
];

for (const target of bareTargets) {
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    if (stripQuoted(lines[i]).includes(target)) {
      found.push(i + 1);
    }
  }
  console.log(target + ' => lines ' + found.join(',') + ' (count: ' + found.length + ')');
}
