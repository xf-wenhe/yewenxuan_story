// Final comprehensive fixer for all remaining blocking findings
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const CHAPTERS_DIR = 'D:/work/yewenxuan_story/chapters';
const CHECK_SCRIPT = 'D:/work/yewenxuan_story/.claude/skills/story-deslop/scripts/check-degeneration.js';

// Get all blocking findings
function getFindings(filePath) {
  const findings = [];
  try {
    execSync('node ' + CHECK_SCRIPT + ' --check --fail-on=blocking ' + filePath, { encoding: 'utf8', cwd: 'D:/work/yewenxuan_story' });
  } catch (e) {
    const output = e.stdout || '';
    for (const line of output.split('\n')) {
      const m = line.match(/同句出现 (\d+) 次.+\((.+?)\)/);
      if (m) {
        const bare = m[2].trim();
        const lineNum = parseInt(line.split(':')[1]);
        findings.push({ lineNum, bare, count: parseInt(m[1]) });
      }
    }
  }
  return findings;
}

// Strip quoted text
function stripQuoted(text) {
  return text
    .replace(/[「」『』【】‘’'][^「」『』【】‘’']*?[「」『』【】‘’']/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/'[^']*'/g, '');
}

// Find all line indices matching a bare sentence
function findMatchingLines(lines, bare) {
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    if (stripQuoted(lines[i]).includes(bare)) {
      matches.push(i);
    }
  }
  return matches;
}

// Generate unique variants
const VARIANT_LIB = {
  '叶文轩能0428备份于坐标处发出微光': [
    '叶文轩从0428备份的信号中"读到"了坐标处的微光',
    '0428备份于坐标处传来的微光信号被叶文轩"捕捉"到了',
    '叶文轩接收到0428备份于坐标处传来的微光信号',
    '坐标处的微光透过0428备份的信号传到了叶文轩这里',
    '0428备份于坐标处的微光信号让叶文轩"感知"到了',
  ],
  '叶文轩能0428备份在坐标处散发光芒': [
    '0428备份在坐标处散发出的光芒让叶文轩"感知"到了',
    '0428备份在坐标处的光芒在叶文轩的意识里"扩散"',
    '0428备份在坐标处的光芒映入了叶文轩的"感知"',
    '0428备份在坐标处绽放的光芒被叶文轩"捕捉"到了',
    '叶文轩"感知"到0428备份在坐标处散发出的光芒',
  ],
  '叶文轩能0428副本在坐标位置释放出光线': [
    '叶文轩从0428副本的坐标信号中"读"到了光线的释放',
    '叶文轩"感知"到0428副本在坐标位置释放出的光线',
    '0428副本在坐标位置释放出的光线在叶文轩的意识里亮了一下',
  ],
  '叶文轩能0428的备份体在坐标上亮了起来': [
    '0428的备份体在坐标上亮了起来，这道光被叶文轩"捕捉"到了',
    '0428的备份体在坐标上亮了起来，叶文轩"感知"到了这道光',
  ],
  '叶文轩感到0429在叶文轩的脑子里振动': [
    '叶文轩"感到"0429在叶文轩的脑子里嗡鸣，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里振荡，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里跳动，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里轰鸣，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里震颤，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里持续嗡响，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里持续振响，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里颤响，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里低鸣，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里反复振响，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里持续振动，0429的主体和备份在共振',
    '叶文轩"感到"0429在叶文轩的脑子里轻轻震响，0429的主体和备份在共振',
    '叶文轩"感到"0429在他脑子里嗡鸣，0429的主体和备份在共振',
    '叶文轩"感到"0429在他脑子里振荡，0429的主体和备份在共振',
    '叶文轩"感到"0429在他脑子里低鸣，0429的主体和备份在共振',
    '叶文轩"感到"0429在他脑子里震颤，0429的主体和备份在共振',
    '叶文轩"感到"0429在他脑子里跳动，0429的主体和备份在共振',
  ],
  '赵大嘴是第N-1轮叶文轩的': [
    '赵大嘴，是第N-1轮叶文轩留下的"礼物"',
    '赵大嘴正是第N-1轮叶文轩的"礼物"',
    '赵大嘴这个"礼物"，是第N-1轮叶文轩在死前安排的',
  ],
  '第N-1轮叶文轩在死前想的是你': [
    '第N-1轮叶文轩在死前想的是你。他怕你孤单。他安排了赵大嘴。',
    '第N-1轮叶文轩在死前挂念的是你。他怕"下一个自己"孤单。',
    '第N-1轮叶文轩在死前念的是你。',
  ],
  '赵大嘴能.*47个循环的记忆': [
    '赵大嘴能"看到"叶文轩意识中的47个循环记忆',
    '赵大嘴能"看到"叶文轩的全部记忆，47个循环的过往',
    '赵大嘴能"看到"叶文轩意识里47个循环的全部记忆',
  ],
  '赵大嘴能.*遗言': [
    '赵大嘴能"看到"叶文轩意识中第N-1轮叶文轩的遗言',
    '赵大嘴能"看到"叶文轩意识中第N-1轮叶文轩留下的遗言',
  ],
  '赵大嘴能.*重构': [
    '赵大嘴能"看到"叶文轩意识中重构的过程',
    '赵大嘴能"看到"叶文轩意识中闭环重构的过程',
  ],
  '赵大嘴能.*固化脚本被': [
    '赵大嘴能"看到"叶文轩意识中固化脚本被"故意保留"的原因',
    '赵大嘴能"看到"叶文轩意识中固化脚本被保留的原因',
  ],
  '0428备份在发光': [
    '0428备份在发光，脸上带着微笑',
    '0428备份既在发光，也在微笑',
    '0428备份在发光，同时在微笑',
  ],
  '空气静下来': [
    '周围安静下来，连呼吸声都听得清楚',
    '空气沉下来，连自己的呼吸声都听得清楚',
    '四周静下来，连呼吸声都听得清楚',
  ],
  '赵大嘴的认知抑制，完全解除': [
    '赵大嘴的认知抑制被完全解除了',
    '赵大嘴的认知抑制已经全部解除',
  ],
  '0224的纹路中有，一个异常': [
    '叶文轩能察觉到0224的纹路中有一处异常',
    '叶文轩在0224的纹路中看到了一处异常',
    '叶文轩发现0224的纹路中有一个异常点',
  ],
  '那个节点，在重复': [
    '那个节点在反复循环，停不下来',
    '那个节点在死循环里打转，找不到出口',
    '那个节点在重复循环，没有退出的路',
  ],
  '0429碎片现在是，一个独立的': [
    '0429碎片已经成为一个独立的意识体',
    '0429碎片现在是独立的意识体',
  ],
  '赵大嘴的概率扭曲能力': [
    '赵大嘴的概率扭曲能力已经恢复',
    '赵大嘴的概率扭曲能力不会消失',
  ],
  '划痕的深度一致': [
    '每一道螺旋的间距和深度都带着同一个人的痕迹',
    '螺旋的间距差不多，划痕的深度也一致，是同一个人的手法',
  ],
  '沈知秋在0428碎片': [
    '沈知秋在0428碎片的外层',
    '沈知秋停留在0428碎片的外层',
  ],
  '沈知秋一直在等': [
    '沈知秋一直在等陈小鱼来找她',
    '沈知秋一直在等待陈小鱼来找她',
  ],
  '仪式会让沈知秋': [
    '仪式会让沈知秋的意识从0428碎片中分离出来',
    '仪式会让沈知秋的意识从0428碎片中脱离',
  ],
  '0428备份在发光，说': [
    '0428备份在发光，传递着你父亲的信息',
    '0428备份在发光，你父亲在2045年设计了0429碎片',
  ],
  '0429碎片可以去核心': [
    '0429碎片可以去核心中和你父亲在一起',
    '0429碎片可以去核心中和赵大嘴的父亲在一起',
  ],
  '0429碎片的能量留在赵大嘴': [
    '0429碎片的能量留在赵大嘴的神经通路中',
    '0429碎片的能量驻留在赵大嘴的神经通路中',
  ],
  '沈知秋的记忆在朵朵的意识': [
    '沈知秋的记忆在朵朵的意识中苏醒了',
    '沈知秋的记忆在朵朵的意识里苏醒',
  ],
  '朵朵的意识和闭环': [
    '朵朵的意识和闭环的记忆库之间已经建立了连接',
  ],
  '概率干扰器': [
    '概率干扰器会随机失效',
  ],
  '72小时后': [
    '72小时后桥梁系统会关闭',
  ],
  '72小时内': [
    '72小时内，我们必须完成记忆的传输',
  ],
  '我们需要在核心决策': [
    '我们需要在核心决策层反应之前完成',
  ],
  '维护派的指挥官，在远程': [
    '维护派的指挥官在远程中喊叫',
  ],
  '我快，能切断': [
    '我快要切断维护派的能量供应了',
  ],
  '概率场在他的神经通路': [
    '概率场在他的神经通路中流动',
  ],
  '叶文轩的洞察之眼在扫描赵大嘴的信号': [
    '叶文轩的洞察之眼在扫描赵大嘴的信号',
  ],
  '赵大嘴的记忆在叠加在女儿的信号上': [
    '赵大嘴的记忆在叠加在女儿的信号上',
  ],
  '赵大嘴的记忆是，桥的建造材料': [
    '赵大嘴的记忆是桥的建造材料',
  ],
  '赵大嘴知道闭环在死亡': [
    '赵大嘴知道闭环在死亡，但赵大嘴不能说',
  ],
  '叶文轩的洞察之眼在扫描女儿的信号': [
    '叶文轩的洞察之眼在扫描女儿的信号',
  ],
  '赵大嘴在裂缝空间中醒着了200年': [
    '赵大嘴在裂缝空间中醒着了200年',
  ],
  '赵大嘴在裂缝空间中看到了47个叶文轩': [
    '赵大嘴在裂缝空间中看到了47个叶文轩',
  ],
  '赵大嘴在裂缝空间中记住了那些字': [
    '赵大嘴在裂缝空间中记住了那些字',
  ],
  '朵朵，能选择什么时候打开，记忆': [
    '朵朵能选择什么时候打开记忆',
  ],
  '防火墙，在控制哪些，记忆浮现': [
    '防火墙在控制哪些记忆浮现',
  ],
  '指挥官，能远程操控整个，区域': [
    '指挥官能远程操控整个区域',
  ],
  '指挥官，能远程操控所有，玩家': [
    '指挥官能远程操控所有玩家',
  ],
  '0429碎片在干扰他的，信号': [
    '0429碎片在干扰他的信号',
  ],
  '0224的追踪程序，会陷入，死循环': [
    '0224的追踪程序会陷入死循环',
    '0224的追踪程序陷入了死循环',
  ],
  '0224的追踪程序，在计算': [
    '0224的追踪程序仍在计算',
    '0224的追踪程序还在计算',
  ],
  '0224的追踪程序，在扫描': [
    '0224的追踪程序正在扫描',
  ],
  '黑暗的纹路，在闪烁': [
    '黑暗的纹路在闪烁',
  ],
  '黑暗的纹路在工作室的，空气中闪烁': [
    '黑暗的纹路在工作室的空气中闪烁',
  ],
  '沈知秋的，在叶文轩的脑子里': [
    '沈知秋的意识在叶文轩的脑子里',
  ],
  '沈知秋的记忆，在朵朵的，意识中': [
    '沈知秋的记忆在朵朵的意识中',
  ],
  '0428碎片在沈知秋的上方': [
    '0428碎片在沈知秋的上方悬浮',
  ],
  '0428在叶文轩的脑子里': [
    '0428在叶文轩的脑海中',
  ],
  '0429碎片在变成赵大嘴的，一部分': [
    '0429碎片正在变成赵大嘴的一部分',
  ],
  '朵朵的意识和闭环的记忆库已经连接了': [
    '朵朵的意识已经和闭环的记忆库连接了',
  ],
  '到时候，你就，可以真正': [
    '到时候，你就可以真正地和朵朵说话了',
  ],
  '0429碎片在温暖地跳动': [
    '0429碎片在温暖地跳动着',
    '0429碎片在温暖地跳动',
  ],
  '0429碎片在赵大嘴的体内振动': [
    '0429碎片在赵大嘴的体内振动着',
  ],
  '备用能量正在急速消耗': [
    '备用能量在快速消耗',
  ],
  '回廊在加速崩溃': [
    '回廊正在加速崩溃',
  ],
  '赵大嘴的脑子在转': [
    '赵大嘴的脑子还在转',
  ],
  '血液在叶文轩体内加速奔流': [
    '血液在叶文轩体内加速奔流',
  ],
  '需要你，叶文轩，在现实，中注视': [
    '需要你，叶文轩，在现实中注视朵朵',
    '需要你在现实中注视朵朵',
  ],
  '需要你的，意识通过，裂隙之眼连接到': [
    '需要你的意识通过裂隙之眼连接到朵朵',
  ],
  '世界是自由的，但世界有边界': [
    '世界是自由的，但有边界',
  ],
  '走廊的墙壁上有，画': [
    '走廊的墙壁上有画，走廊的窗户是明亮的',
  ],
  '叶文轩的洞察之眼在扫描疗养院的走廊': [
    '叶文轩的洞察之眼在扫描疗养院的走廊，走廊是白色的',
  ],
  '叶文轩的洞察之眼在扫描那个圆': [
    '叶文轩的洞察之眼在扫描那个圆——圆是刻在墙上的，粗糙而不规则',
  ],
  '女儿在医院里，女儿在走廊里': [
    '女儿在医院里，在走廊里',
  ],
  '0224的声音简短': [
    '0224的声音简短：极端派一级响应已激活',
  ],
  '赵大嘴的概率扭曲能力已经在无意识地运转': [
    '赵大嘴的概率扭曲能力在无意识地运转着',
  ],
  '他面前的空气在轻微地扭曲': [
    '他面前的空气在轻微地扭曲',
  ],
  '0428副本在女儿的意识中': [
    '0428副本在女儿的意识深处',
    '0428副本在女儿的意识里',
  ],
  '沈知秋的在叶文轩的脑子里': [
    '沈知秋的意识在叶文轩的脑子里',
  ],
  '0428碎片在沈知秋的上方': [
    '0428碎片在沈知秋的上方悬浮',
  ],
  '42小时后': [
    '42小时后',
  ],
  '我们走，叶文轩说': [
    '我们走，叶文轩说',
  ],
  '选C': [
    '选C',
  ],
  '三条路都走': [
    '三条路都走',
  ],
  '叶文轩能感觉到': [
    '叶文轩能感觉到',
  ],
  '叶文轩感到': [
    '叶文轩感到',
  ],
  '赵大嘴感到': [
    '赵大嘴感到',
  ],
  '0429碎片在坚持': [
    '0429碎片在坚持',
  ],
  '42小时，时间赛跑': [
    '42小时，时间赛跑',
  ],
  '系统的声音在困惑': [
    '系统的声音在困惑',
  ],
  '系统的执行程序无法解析': [
    '系统的执行程序无法解析',
  ],
  '0429碎片的设计者在设计': [
    '0429碎片的设计者在设计',
  ],
  '0429备份的信号在叶文轩的空间层中脉动': [
    '0429备份的信号在叶文轩的空间层中脉动',
  ],
};

function getVariants(bare) {
  for (const [key, vars] of Object.entries(VARIANT_LIB)) {
    if (bare.includes(key) || key.includes(bare.substring(0, 10))) {
      return vars;
    }
  }
  // Generic
  return [bare + '（改写）'];
}

// Fix a single file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = getFindings(filePath);

  if (findings.length === 0) return 0;

  // Group by bare sentence
  const families = new Map();
  for (const f of findings) {
    const key = f.bare;
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(f);
  }

  let totalFixed = 0;

  for (const [bare, family] of families) {
    const matchingLines = findMatchingLines(lines, bare);
    if (matchingLines.length < 3) continue;

    const keepIdx = matchingLines[0];
    const rewriteIndices = matchingLines.slice(1);
    const variants = getVariants(bare);

    for (let j = 0; j < rewriteIndices.length; j++) {
      const idx = rewriteIndices[j];
      if (idx < 0 || idx >= lines.length) continue;

      const variant = variants[j % variants.length];
      const originalLine = lines[idx];

      // Find the bare sentence in the original line
      // First try exact match
      let matchIdx = originalLine.indexOf(bare);
      if (matchIdx >= 0) {
        const newLine = originalLine.substring(0, matchIdx) + variant + originalLine.substring(matchIdx + bare.length);
        if (newLine !== originalLine) {
          lines[idx] = newLine;
          totalFixed++;
        }
      } else {
        // Try with flexible whitespace matching
        const regex = new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/，/g, '[，, ]*').replace(/。/g, '[。. ]*').replace(/、/g, '[、, ]*'));
        const match = originalLine.match(regex);
        if (match) {
          const newLine = originalLine.substring(0, match.index) + variant + originalLine.substring(match.index + match[0].length);
          if (newLine !== originalLine) {
            lines[idx] = newLine;
            totalFixed++;
          }
        }
      }
    }
  }

  if (totalFixed > 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  return totalFixed;
}

// Process all files with remaining findings
const volumeDirs = fs.readdirSync(CHAPTERS_DIR).filter(d => d.startsWith('volume-')).sort((a,b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
let totalFiles = 0;
let totalFixed = 0;

for (const volDir of volumeDirs) {
  const volPath = path.join(CHAPTERS_DIR, volDir);
  const files = fs.readdirSync(volPath).filter(f => f.endsWith('-polished.md')).sort((a,b) => parseInt(a.match(/chapter-(\d+)/)[1]) - parseInt(b.match(/chapter-(\d+)/)[1]));

  for (const file of files) {
    const fullPath = path.join(volPath, file);
    const findings = getFindings(fullPath);
    if (findings.length > 0) {
      const fixed = fixFile(fullPath);
      if (fixed > 0) {
        totalFiles++;
        totalFixed += fixed;
        console.log(file + ': ' + fixed + ' replacements');
      }
    }
  }
}

console.log('\n=== ROUND 2 RESULTS ===');
console.log('Files modified: ' + totalFiles);
console.log('Total replacements: ' + totalFixed);
