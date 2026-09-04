const fs = require('fs');
const content = fs.readFileSync('D:/work/yewenxuan_story/chapters/volume-6/chapter-814-polished.md', 'utf8');
const lines = content.split('\n');

// Check lines 21, 71, 119, 167 for content and quote handling
for (const ln of [21, 71, 119, 167]) {
  const line = lines[ln-1];
  console.log('L' + ln + ': ' + line.substring(0, 100));
  let s = line.replace(/"[^"]*"/g, '');
  console.log('  stripped: ' + s.substring(0, 100));
  console.log('  has 嗡鸣: ' + s.includes('嗡鸣'));
  console.log('  has bare sentence: ' + (s.includes('叶文轩0429在叶文轩的脑子里嗡鸣') || s.includes('叶文轩感到0429在叶文轩的脑子里嗡鸣')));
}

// Also check what stripQuoted produces for line 9
const line9 = lines[8];
console.log('\nL9: ' + line9.substring(0, 100));
let s9 = line9.replace(/"[^"]*"/g, '');
console.log('  stripped: ' + s9.substring(0, 100));
console.log('  has bare sentence: ' + s9.includes('叶文轩感到0429在叶文轩的脑子里振动'));

// Check L119 specifically
const line119 = lines[118];
console.log('\nL119: ' + line119);
let s119 = line119.replace(/"[^"]*"/g, '');
console.log('  stripped: ' + s119);
console.log('  has 叶文轩0429: ' + s119.includes('叶文轩0429'));
console.log('  has 叶文轩感到0429: ' + s119.includes('叶文轩感到0429'));

// Check all lines for bare sentences after stripQuoted
console.log('\n=== FULL SCAN FOR ALL FAMILIES ===');
const families = [
  { name: '0429振动', bare: '叶文轩感到0429在叶文轩的脑子里振动', keepLine: 9 },
  { name: '0428微光', bare: '叶文轩能0428备份于坐标处发出微光', keepLine: 19 },
  { name: '0428光芒', bare: '叶文轩能0428备份在坐标处散发光芒', keepLine: 27 },
  { name: '0428亮起', bare: '叶文轩能0428的备份体在坐标上亮了起来', keepLine: 35 },
  { name: '0428光线', bare: '叶文轩能0428副本在坐标位置释放出光线', keepLine: 7 },
  { name: '赵大嘴礼物', bare: '赵大嘴是第N-1轮叶文轩的', keepLine: 103 },
  { name: '死前想你', bare: '第N-1轮叶文轩在死前想的是你', keepLine: 105 },
  { name: '看到记忆', bare: '赵大嘴能叶文轩了47个循环的记忆', keepLine: 111 },
  { name: '看到遗言', bare: '赵大嘴能叶文轩了第N-1轮叶文轩的遗言', keepLine: 111 },
  { name: '看到重构', bare: '赵大嘴能叶文轩了重构的过程', keepLine: 111 },
  { name: '看到原因', bare: '赵大嘴能叶文轩了固化脚本被的原因', keepLine: 113 },
];

for (const fam of families) {
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].replace(/"[^"]*"/g, '');
    if (stripped.includes(fam.bare)) {
      found.push(i + 1);
    }
  }
  console.log(fam.name + ': lines ' + found.join(',') + ' (count: ' + found.length + ')');
}
