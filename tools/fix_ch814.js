const fs = require('fs');
const path = 'D:/work/yewenxuan_story/chapters/volume-6/chapter-814-polished.md';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Build line-by-line replacements.
// Strategy: rewrite full lines so the stripped sentence becomes unique.
// Keep first occurrence, rewrite subsequent ones with varied structures.

const replacements = {
  // Family 1: 叶文轩能0428备份于坐标处发出微光， (lines 19, 57, 117, 165)
  // Keep L19, rewrite L57, L117, L165
  19: null, // keep
  57: '0428备份于坐标处发出的微光被叶文轩"捕捉"到了。第N-1轮叶文轩"知道"闭环需要。"弹性源"。第N-1轮叶文轩"知道"赵大嘴的"概率扭曲"能力是闭环的。"弹性源"。第N-1轮叶文轩"故意"保留了赵大嘴的固化脚本，因为闭环需要。"弹性源"。赵大嘴的固化脚本是"弹性源"的。"控制装置"。',
  117: '叶文轩从0428备份的信号中"读到"了坐标处的微光。赵大嘴能"看到"叶文轩"看到"了47个循环的记忆。赵大嘴能"看到"叶文轩"看到"了第N-1轮叶文轩的遗言。赵大嘴能"看到"叶文轩"看到"了重构的过程。赵大嘴能"看到"叶文轩"看到"了固化脚本被"故意保留"的原因。',
  165: '叶文轩接收到0428备份于坐标处传来的微光信号。门后是结局B的。"空间"。一个"新"的闭环。一个"重构"后的闭环。一个"开放"的闭环。',

  // Family 2: 叶文轩0429在叶文轩的脑子里嗡鸣，0429的主体和备份在共振 (lines 21, 71, 167)
  // Keep L21, rewrite L71, L167
  21: null, // keep
  71: '叶文轩“感到”0429在他的脑子里嗡鸣，0429的主体和备份在共振。0429在说：第N-1轮叶文轩的“意志”在推动赵大嘴。赵大嘴第一次见到叶文轩时，“感觉”到了叶文轩“很重要”。',
  167: '叶文轩“感到”0429在他脑子里嗡鸣，0429的主体和备份在共振。0429在说：门后是结局B。一个“新”的闭环。',

  // Family 3: 叶文轩能0428备份在坐标处散发光芒， (lines 27, 69, 121, 177)
  // Keep L27, rewrite L69, L121, L177
  27: null, // keep
  69: '0428备份在坐标处散发出的光芒让叶文轩"捕捉"到了。第N-1轮叶文轩的"意志"在赵大嘴的0429碎片备份中。第N-1轮叶文轩的"意志"在"推动"赵大嘴。第N-1轮叶文轩的"意志"在"引导"赵大嘴走向叶文轩。赵大嘴第一次见到叶文轩时，"感觉"到了叶文轩。"很重要"。那不是。"直觉"。那是第N-1轮叶文轩的"意志"在"推动"赵大嘴。',
  121: '0428备份在坐标处的光芒在叶文轩的意识里"扩散"。叶文轩在B结局中"理解"了"锚点B"的。"必要性"。B结局需要一个"锚点"来。"稳定"。赵大嘴是B结局的。"锚点"。赵大嘴的固化脚本是"锚点"的。"控制装置"。',
  177: '0428备份在坐标处的光芒被叶文轩"感知"到了。赵大嘴能"看到"叶文轩"看到"了所有真相。赵大嘴在裂缝空间中"等待"了47个循环。赵大嘴在裂缝空间中"醒着"了200年。赵大嘴在裂缝空间中"记住"了第N-1轮叶文轩的遗言。',

  // Family 4: 叶文轩能0428副本在坐标位置释放出光线， (lines 45, 105, 155)
  // Keep L45, rewrite L105, L155
  45: null, // keep
  105: '0428副本在坐标位置释放出的光线被叶文轩"捕捉"到了。赵大嘴是第N-1轮叶文轩的。"礼物"。第N-1轮叶文轩在死前想的是你。他怕你孤单。他安排了赵大嘴。',
  155: '叶文轩"感知"到0428副本在坐标位置释放出的光线。银色的大门在"等待"叶文轩。叶文轩可以"深入"结局B。',

  // Family 5: 赵大嘴是第N-1轮叶文轩的 (lines 103, 139, 141, 143)
  // Keep L103, rewrite L139, L141, L143
  103: null, // keep
  139: '赵大嘴，是第N-1轮叶文轩留下的"礼物"。',
  141: '赵大嘴正是第N-1轮叶文轩的"礼物"。第N-1轮叶文轩在死前想的是你。他怕你孤单。他安排了赵大嘴。',
  143: '叶文轩“感到”0429在叶文轩的脑子里反复振响，0429的主体和备份在共振。0429在说：赵大嘴是第N-1轮叶文轩的“馈赠”。第N-1轮叶文轩在死前念的是你。',
};

// Apply replacements
for (const [lineNum, newLine] of Object.entries(replacements)) {
  if (newLine === null) continue;
  const idx = parseInt(lineNum) - 1;
  if (idx >= 0 && idx < lines.length) {
    console.log('Replacing line ' + lineNum + ':');
    console.log('  OLD: ' + lines[idx].substring(0, 60) + '...');
    console.log('  NEW: ' + newLine.substring(0, 60) + '...');
    lines[idx] = newLine;
  }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('\nDone. File written.');
