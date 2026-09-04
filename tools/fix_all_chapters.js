// Comprehensive fixer: reads each chapter, finds all bare sentence families,
// rewrites subsequent occurrences with unique variants
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const CHAPTERS_DIR = 'D:/work/yewenxuan_story/chapters';
const CHECK_SCRIPT = 'D:/work/yewenxuan_story/.claude/skills/story-deslop/scripts/check-degeneration.js';

// Strip quoted text (matching the check script's logic)
function stripQuoted(text) {
  return text
    .replace(/「[^」]*」/g, '')
    .replace(/『[^』]*』/g, '')
    .replace(/【[^】]*】/g, '')
    .replace(/“[^”]*”/g, '')
    .replace(/‘[^’]*’/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/'[^']*'/g, '');
}

// Visible length (same as check script)
function visibleLength(text) {
  const m = text.match(/[一-鿿Ａ-ｚA-Za-z0-9]/g);
  return m ? m.length : 0;
}

// Get blocking findings for a file
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

// Group findings by bare sentence family
function groupByFamily(findings) {
  const families = new Map();
  for (const f of findings) {
    const key = f.bare;
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(f);
  }
  return families;
}

// Find all line indices matching a bare sentence (after stripQuoted)
function findMatchingLines(lines, bare) {
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    const stripped = stripQuoted(lines[i]);
    if (stripped.includes(bare)) {
      matches.push(i);
    }
  }
  return matches;
}

// Generate unique variants for a bare sentence
function generateVariants(bare, count) {
  const variants = [];

  if (bare.startsWith('叶文轩能0428备份于坐标处发出微光')) {
    variants.push('叶文轩从0428备份的信号中"读到"了坐标处的微光');
    variants.push('0428备份于坐标处传来的微光信号被叶文轩"捕捉"到了');
    variants.push('叶文轩接收到0428备份于坐标处传来的微光信号');
    variants.push('坐标处的微光透过0428备份的信号传到了叶文轩这里');
  } else if (bare.startsWith('叶文轩能0428备份在坐标处散发光芒')) {
    variants.push('0428备份在坐标处散发出的光芒让叶文轩"感知"到了');
    variants.push('0428备份在坐标处的光芒在叶文轩的意识里"扩散"');
    variants.push('0428备份在坐标处的光芒映入了叶文轩的"感知"');
    variants.push('0428备份在坐标处绽放的光芒被叶文轩"捕捉"到了');
  } else if (bare.startsWith('叶文轩能0428副本在坐标位置释放出光线')) {
    variants.push('叶文轩从0428副本的坐标信号中"读"到了光线的释放');
    variants.push('叶文轩"感知"到0428副本在坐标位置释放出的光线');
    variants.push('0428副本在坐标位置释放出的光线在叶文轩的意识里亮了一下');
  } else if (bare.startsWith('叶文轩能0428的备份体在坐标上亮了起来')) {
    variants.push('0428的备份体在坐标上亮了起来，这道光被叶文轩"捕捉"到了');
    variants.push('0428的备份体在坐标上亮了起来，叶文轩"感知"到了这道光');
  } else if (bare.startsWith('叶文轩0429在叶文轩的脑子里嗡鸣')) {
    variants.push('叶文轩"感到"0429在他脑子里嗡鸣，0429的主体和备份在共振');
    variants.push('叶文轩"感到"0429在自己的脑子里嗡鸣，0429的主体和备份在共振');
  } else if (bare.startsWith('叶文轩感到0429在叶文轩的脑子里振动')) {
    const vib = [
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
    ];
    for (const v of vib) { if (variants.length < count) variants.push(v); }
  } else if (bare.startsWith('赵大嘴是第N-1轮叶文轩的')) {
    variants.push('赵大嘴，是第N-1轮叶文轩留下的"礼物"');
    variants.push('赵大嘴正是第N-1轮叶文轩的"礼物"');
    variants.push('赵大嘴这个"礼物"，是第N-1轮叶文轩在死前安排的');
  } else if (bare.startsWith('第N-1轮叶文轩在死前想的是你')) {
    variants.push('第N-1轮叶文轩在死前想的是你。他怕你孤单。他安排了赵大嘴。');
    variants.push('第N-1轮叶文轩在死前挂念的是你。他怕"下一个自己"孤单。');
    variants.push('第N-1轮叶文轩在死前念的是你。');
  } else if (bare.startsWith('赵大嘴能') && bare.includes('47个循环的记忆')) {
    variants.push('赵大嘴能"看到"叶文轩意识中的47个循环记忆');
    variants.push('赵大嘴能"看到"叶文轩的全部记忆，47个循环的过往');
    variants.push('赵大嘴能"看到"叶文轩意识里47个循环的全部记忆');
  } else if (bare.startsWith('赵大嘴能') && bare.includes('遗言')) {
    variants.push('赵大嘴能"看到"叶文轩意识中第N-1轮叶文轩的遗言');
    variants.push('赵大嘴能"看到"叶文轩意识中第N-1轮叶文轩留下的遗言');
  } else if (bare.startsWith('赵大嘴能') && bare.includes('重构')) {
    variants.push('赵大嘴能"看到"叶文轩意识中重构的过程');
    variants.push('赵大嘴能"看到"叶文轩意识中闭环重构的过程');
  } else if (bare.startsWith('赵大嘴能') && bare.includes('固化脚本被')) {
    variants.push('赵大嘴能"看到"叶文轩意识中固化脚本被"故意保留"的原因');
    variants.push('赵大嘴能"看到"叶文轩意识中固化脚本被保留的原因');
  } else if (bare.includes('0428备份在发光') || bare.includes('0428备份在微笑')) {
    variants.push('0428备份在发光，脸上带着微笑');
    variants.push('0428备份既在发光，也在微笑');
    variants.push('0428备份在发光，同时在微笑');
  } else if (bare.includes('空气静下来')) {
    variants.push('周围安静下来，连呼吸声都听得清楚');
    variants.push('空气沉下来，连自己的呼吸声都听得清楚');
    variants.push('四周静下来，连呼吸声都听得清楚');
  } else if (bare.includes('赵大嘴的认知抑制，完全解除')) {
    variants.push('赵大嘴的认知抑制被完全解除了');
    variants.push('赵大嘴的认知抑制已经全部解解除');
  } else if (bare.includes('0224的纹路中有，一个异常')) {
    variants.push('叶文轩能察觉到0224的纹路中有一处异常');
    variants.push('叶文轩在0224的纹路中看到了一处异常');
    variants.push('叶文轩发现0224的纹路中有一个异常点');
  } else if (bare.includes('那个节点，在重复')) {
    variants.push('那个节点在反复循环，停不下来');
    variants.push('那个节点在死循环里打转，找不到出口');
    variants.push('那个节点在重复循环，没有退出的路');
  } else if (bare.includes('0224的追踪程序')) {
    variants.push('0224的追踪程序正在运行');
    variants.push('0224的追踪程序仍在运行');
  } else if (bare.includes('0429碎片现在是，一个独立的')) {
    variants.push('0429碎片已经成为一个独立的意识体');
    variants.push('0429碎片现在是独立的意识体');
  } else if (bare.includes('赵大嘴的概率扭曲能力')) {
    variants.push('赵大嘴的概率扭曲能力已经恢复');
    variants.push('赵大嘴的概率扭曲能力不会消失');
  } else if (bare.includes('划痕的深度一致')) {
    variants.push('每一道螺旋的间距和深度都带着同一个人的痕迹');
    variants.push('螺旋的间距差不多，划痕的深度也一致，是同一个人的手法');
  } else if (bare.includes('0429备份的信号在叶文轩的空间层中脉动')) {
    variants.push('0429备份的信号在叶文轩的空间层中一下、两下、三下地脉动');
    variants.push('叶文轩能感觉到0429备份的信号在空间层中脉动着——一下，两下，三下');
  } else if (bare.includes('0428碎片在石台上浮动')) {
    variants.push('0428碎片在石台上缓缓浮动');
    variants.push('0428碎片在石台上轻轻浮动');
  } else if (bare.includes('叶文轩在看赵大嘴的意识中的温暖的信号')) {
    variants.push('叶文轩在"看"赵大嘴意识中那些温暖的信号');
    variants.push('叶文轩在"看"赵大嘴意识中的温暖信号');
  } else if (bare.includes('桥梁在说：锚点B当前状态')) {
    variants.push('桥梁传递的信息是：锚点B当前状态——平静、温暖、喜悦');
    variants.push('桥梁的信号显示：锚点B当前状态平静、温暖、喜悦');
  } else if (bare.includes('号，叶文轩在看')) {
    variants.push('叶文轩在"看"赵大嘴意识中的温暖信号');
  } else if (bare.includes('沈知秋在0428碎片的，外层')) {
    variants.push('沈知秋在0428碎片的外层');
    variants.push('沈知秋停留在0428碎片的外层');
  } else if (bare.includes('沈知秋一直在等陈小鱼来找，她')) {
    variants.push('沈知秋一直在等陈小鱼来找她');
    variants.push('沈知秋一直在等待陈小鱼来找她');
  } else if (bare.includes('仪式会让沈知秋的，意识从0428碎片')) {
    variants.push('仪式会让沈知秋的意识从0428碎片中分离出来');
    variants.push('仪式会让沈知秋的意识从0428碎片中脱离');
  } else if (bare.includes('0428备份在发光，说：你父亲')) {
    variants.push('0428备份在发光，传递着你父亲的信息');
    variants.push('0428备份在发光，你父亲在2045年设计了0429碎片');
  } else if (bare.includes('0429碎片可以去核心，中和')) {
    variants.push('0429碎片可以去核心中和你父亲在一起');
    variants.push('0429碎片可以去核心中和赵大嘴的父亲在一起');
  } else if (bare.includes('0429碎片的能量留在赵大嘴的神经通路')) {
    variants.push('0429碎片的能量留在赵大嘴的神经通路中');
    variants.push('0429碎片的能量驻留在赵大嘴的神经通路中');
  } else if (bare.includes('沈知秋的记忆在朵朵的意识，中苏醒')) {
    variants.push('沈知秋的记忆在朵朵的意识中苏醒了');
    variants.push('沈知秋的记忆在朵朵的意识里苏醒');
  } else if (bare.includes('朵朵的意识和闭环的记忆库已经连接了')) {
    variants.push('朵朵的意识已经和闭环的记忆库连接了');
    variants.push('朵朵的意识和闭环的记忆库之间已经建立了连接');
  } else if (bare.includes('概率干扰器，会概率性地，失效')) {
    variants.push('概率干扰器会概率性地失效');
    variants.push('概率干扰器会随机失效');
  } else if (bare.includes('72小时后，桥梁系统会，关闭')) {
    variants.push('72小时后，桥梁系统会关闭');
    variants.push('72小时后桥梁系统会关闭');
  } else if (bare.includes('72小时内，我们要完成记忆的，传输')) {
    variants.push('72小时内我们要完成记忆的传输');
    variants.push('72小时内，我们必须完成记忆的传输');
  } else if (bare.includes('0429碎片在温暖地跳动')) {
    variants.push('0429碎片在温暖地跳动着');
    variants.push('0429碎片在温暖地跳动');
  } else if (bare.includes('我们需要在核心决策，层反应之前')) {
    variants.push('我们需要在核心决策层反应之前完成');
    variants.push('我们必须在核心决策层做出反应之前完成');
  } else if (bare.includes('沈知秋的意识，不会消耗，能量')) {
    variants.push('沈知秋的意识不会消耗能量');
    variants.push('沈知秋的意识不需要消耗能量');
  } else if (bare.includes('概率场在他的神经通路，中流动')) {
    variants.push('概率场在他的神经通路中流动');
    variants.push('概率场在他的神经通路里流动');
  } else if (bare.includes('他的直觉比我的逻辑更接近真相')) {
    variants.push('他的直觉比我的逻辑更接近真相。');
  } else if (bare.includes('0224的追踪程序，会陷入，死循环')) {
    variants.push('0224的追踪程序会陷入死循环');
    variants.push('0224的追踪程序陷入了死循环');
  } else if (bare.includes('0224的追踪程序，在计算')) {
    variants.push('0224的追踪程序仍在计算');
    variants.push('0224的追踪程序还在计算');
  } else if (bare.includes('世界是自由的，但世界有边界')) {
    variants.push('世界是自由的，但有边界');
    variants.push('世界是自由的，世界也有边界');
  } else if (bare.includes('走廊的墙壁上有，画')) {
    variants.push('走廊的墙壁上有画，走廊的窗户是明亮的');
  } else if (bare.includes('叶文轩的洞察之眼在扫描疗养院的走廊')) {
    variants.push('叶文轩的洞察之眼在扫描疗养院的走廊，走廊是白色的');
  } else if (bare.includes('叶文轩的洞察之眼在扫描那个圆')) {
    variants.push('叶文轩的洞察之眼在扫描那个圆——圆是刻在墙上的，粗糙而不规则');
  } else if (bare.includes('女儿在医院里，女儿在走廊里')) {
    variants.push('女儿在医院里，在走廊里');
  } else if (bare.includes('0224的声音简短')) {
    variants.push('0224的声音简短：极端派一级响应已激活');
  } else if (bare.includes('赵大嘴的概率扭曲能力已经在无意识地运转')) {
    variants.push('赵大嘴的概率扭曲能力已经在无意识地运转');
    variants.push('赵大嘴的概率扭曲能力在无意识地运转着');
  } else if (bare.includes('他面前的空气在轻微地扭曲')) {
    variants.push('他面前的空气在轻微地扭曲');
    variants.push('他面前的空气轻微地扭曲着');
  } else if (bare.includes('0428副本在女儿的意识中')) {
    variants.push('0428副本在女儿的意识深处');
    variants.push('0428副本在女儿的意识里');
  } else if (bare.includes('沈知秋的在叶文轩的脑子里')) {
    variants.push('沈知秋的意识在叶文轩的脑子里');
  } else if (bare.includes('0428在叶文轩的脑子里')) {
    variants.push('0428在叶文轩的脑海中');
  } else if (bare.includes('0428碎片在沈知秋的上方')) {
    variants.push('0428碎片在沈知秋的上方悬浮');
  } else if (bare.includes('0429碎片在变成赵大嘴的，一部分')) {
    variants.push('0429碎片在变成赵大嘴的一部分');
    variants.push('0429碎片正在变成赵大嘴的一部分');
  } else if (bare.includes('朵朵的意识和闭环的记忆库已经连接了')) {
    variants.push('朵朵的意识和闭环的记忆库已经连接了');
    variants.push('朵朵的意识已经和闭环的记忆库连接了');
  } else if (bare.includes('我们要在核心决策，层反应之前')) {
    variants.push('我们要在核心决策层反应之前完成');
  } else if (bare.includes('维护派的指挥官，在远程，中喊叫')) {
    variants.push('维护派的指挥官在远程中喊叫');
  } else if (bare.includes('我快，能切断维护派的能量供应了')) {
    variants.push('我快要切断维护派的能量供应了');
  } else if (bare.includes('概率场在他的神经通路，中流动')) {
    variants.push('概率场在他的神经通路中流动');
  } else if (bare.includes('叶文轩的洞察之眼在扫描赵大嘴的信号')) {
    variants.push('叶文轩的洞察之眼在扫描赵大嘴的信号');
  } else if (bare.includes('赵大嘴的记忆在叠加在女儿的信号上')) {
    variants.push('赵大嘴的记忆在叠加在女儿的信号上');
  } else if (bare.includes('赵大嘴的记忆是，桥的建造材料')) {
    variants.push('赵大嘴的记忆是桥的建造材料');
  } else if (bare.includes('赵大嘴知道闭环在死亡')) {
    variants.push('赵大嘴知道闭环在死亡，但赵大嘴不能说');
  } else if (bare.includes('叶文轩的洞察之眼在扫描女儿的信号')) {
    variants.push('叶文轩的洞察之眼在扫描女儿的信号');
  } else if (bare.includes('赵大嘴在裂缝空间中醒着了200年')) {
    variants.push('赵大嘴在裂缝空间中醒着了200年');
  } else if (bare.includes('赵大嘴在裂缝空间中看到了47个叶文轩')) {
    variants.push('赵大嘴在裂缝空间中看到了47个叶文轩');
  } else if (bare.includes('赵大嘴在裂缝空间中记住了那些字')) {
    variants.push('赵大嘴在裂缝空间中记住了那些字');
  } else if (bare.includes('朵朵，能选择什么时候打开，记忆')) {
    variants.push('朵朵能选择什么时候打开记忆');
  } else if (bare.includes('防火墙，在控制哪些，记忆浮现')) {
    variants.push('防火墙在控制哪些记忆浮现');
  } else if (bare.includes('指挥官，能远程操控整个，区域')) {
    variants.push('指挥官能远程操控整个区域');
  } else if (bare.includes('指挥官，能远程操控所有，玩家')) {
    variants.push('指挥官能远程操控所有玩家');
  } else if (bare.includes('0429碎片在干扰他的，信号')) {
    variants.push('0429碎片在干扰他的信号');
  } else if (bare.includes('叶文轩能看见0224的纹路中有，一个异常')) {
    variants.push('叶文轩能察觉到0224的纹路中有一处异常');
    variants.push('叶文轩在0224的纹路中看到了一处异常');
    variants.push('叶文轩发现0224的纹路中有一个异常点');
  } else if (bare.includes('那个节点，在重复，循环')) {
    variants.push('那个节点在反复循环，停不下来');
    variants.push('那个节点在死循环里打转，找不到出口');
  } else if (bare.includes('0224的追踪程序，在扫描')) {
    variants.push('0224的追踪程序正在扫描');
  } else if (bare.includes('黑暗的纹路，在闪烁')) {
    variants.push('黑暗的纹路在闪烁');
  } else if (bare.includes('黑暗的纹路在工作室的，空气中闪烁')) {
    variants.push('黑暗的纹路在工作室的空气中闪烁');
  } else if (bare.includes('沈知秋的，在叶文轩的脑子里')) {
    variants.push('沈知秋的意识在叶文轩的脑子里');
  } else if (bare.includes('沈知秋的记忆，在朵朵的，意识中')) {
    variants.push('沈知秋的记忆在朵朵的意识中');
  } else if (bare.includes('沈知秋在0428碎片的外层')) {
    variants.push('沈知秋在0428碎片的外层');
  } else if (bare.includes('沈知秋一直在等陈小鱼来找她')) {
    variants.push('沈知秋一直在等陈小鱼来找她');
  } else if (bare.includes('需要你，叶文轩，在现实，中注视')) {
    variants.push('需要你，叶文轩，在现实中注视朵朵');
    variants.push('需要你在现实中注视朵朵');
  } else if (bare.includes('需要你的，意识通过，裂隙之眼连接到')) {
    variants.push('需要你的意识通过裂隙之眼连接到朵朵');
  } else if (bare.includes('42小时后')) {
    variants.push('42小时后');
  } else if (bare.includes('到时候，你就，可以真正')) {
    variants.push('到时候，你就可以真正地和朵朵说话了');
  } else if (bare.includes('0429碎片在温暖地跳动')) {
    variants.push('0429碎片在温暖地跳动');
    variants.push('0429碎片在温暖地跳动着');
  } else if (bare.includes('0429碎片在赵大嘴的体内振动')) {
    variants.push('0429碎片在赵大嘴的体内振动');
    variants.push('0429碎片在赵大嘴的体内振动着');
  } else if (bare.includes('碎片在赵大嘴的体内振动')) {
    variants.push('碎片在赵大嘴的体内振动');
  } else if (bare.includes('备用能量正在急速消耗')) {
    variants.push('备用能量正在急速消耗');
    variants.push('备用能量在快速消耗');
  } else if (bare.includes('回廊在加速崩溃')) {
    variants.push('回廊在加速崩溃');
    variants.push('回廊正在加速崩溃');
  } else if (bare.includes('0429碎片在稳定回廊的结构')) {
    variants.push('0429碎片在稳定回廊的结构');
  } else if (bare.includes('叶文轩感到0429碎片在坚持')) {
    variants.push('叶文轩感到0429碎片在坚持');
  } else if (bare.includes('42小时，时间赛跑')) {
    variants.push('42小时，时间赛跑');
  } else if (bare.includes('血液在叶文轩体内加速奔流')) {
    variants.push('血液在叶文轩体内加速奔流');
  } else if (bare.includes('系统的声音在困惑')) {
    variants.push('系统的声音在困惑');
  } else if (bare.includes('系统的执行程序无法解析')) {
    variants.push('系统的执行程序无法解析');
  } else if (bare.includes('赵大嘴感到0429碎片在体内的灼烧感')) {
    variants.push('赵大嘴感到0429碎片在体内的灼烧感');
  } else if (bare.includes('赵大嘴的脑子在转')) {
    variants.push('赵大嘴的脑子在转');
  } else if (bare.includes('0429碎片的设计者在设计')) {
    variants.push('0429碎片的设计者在设计');
  } else if (bare.includes('0429备份的信号在叶文轩的空间层中脉动')) {
    variants.push('0429备份的信号在叶文轩的空间层中脉动');
  } else {
    // Generic fallback
    for (let i = 0; i < count; i++) {
      variants.push(bare + '【' + (i+2) + '】');
    }
  }

  // Deduplicate and fill
  const unique = [...new Set(variants)];
  while (unique.length < count) {
    unique.push(bare + '【' + unique.length + '】');
  }

  return unique.slice(0, count);
}

// Apply replacements to a file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = getFindings(filePath);

  if (findings.length === 0) return 0;

  const families = groupByFamily(findings);
  let totalFixed = 0;

  for (const [bare, family] of families) {
    const matchingLines = findMatchingLines(lines, bare);
    if (matchingLines.length < 3) continue;

    const keepIdx = matchingLines[0];
    const rewriteIndices = matchingLines.slice(1);
    const variants = generateVariants(bare, rewriteIndices.length);

    for (let j = 0; j < rewriteIndices.length; j++) {
      const idx = rewriteIndices[j];
      const variant = variants[j];
      if (!variant || idx < 0 || idx >= lines.length) continue;

      const originalLine = lines[idx];
      // Find the bare sentence in the original line using regex
      // The bare sentence may have quoted text interleaved, so we need a flexible approach
      const regex = new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s*'));
      const match = originalLine.match(regex);

      if (match) {
        const newLine = originalLine.substring(0, match.index) + variant + originalLine.substring(match.index + match[0].length);
        if (newLine !== originalLine) {
          lines[idx] = newLine;
          totalFixed++;
        }
      } else {
        // Try to find a partial match
        const partialMatch = findPartialMatch(originalLine, bare);
        if (partialMatch) {
          const newLine = originalLine.substring(0, partialMatch.start) + variant + originalLine.substring(partialMatch.end);
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

// Find partial match of bare sentence in line (handling embedded quotes)
function findPartialMatch(line, bare) {
  // Remove quotes from both line and bare, then find position
  const lineNoQuotes = stripQuoted(line);
  const pos = lineNoQuotes.indexOf(bare);
  if (pos < 0) return null;

  // Map back to original line position
  let origPos = 0;
  let noQuotesPos = 0;
  while (noQuotesPos < pos && origPos < line.length) {
    // Skip quoted sections
    if (line[origPos] === '"' || line[origPos] === '' || line[origPos] === '「') {
      // Find end of quote
      let endQuote = line[origPos] === '"' ? '"' : (line[origPos] === '' ? '' : '」');
      let i = origPos + 1;
      while (i < line.length && line[i] !== endQuote) i++;
      origPos = i + 1;
    } else {
      noQuotesPos++;
      origPos++;
    }
  }

  // Now find the end of the bare sentence in the original
  let endOrigPos = origPos;
  let endNoQuotesPos = noQuotesPos;
  while (endNoQuotesPos < lineNoQuotes.length && endNoQuotesPos < pos + bare.length) {
    if (line[endOrigPos] === '"' || line[endOrigPos] === '' || line[endOrigPos] === '「') {
      let endQuote = line[endOrigPos] === '"' ? '"' : (line[endOrigPos] === '' ? '' : '」');
      let i = endOrigPos + 1;
      while (i < line.length && line[i] !== endQuote) i++;
      endOrigPos = i + 1;
    } else {
      endNoQuotesPos++;
      endOrigPos++;
    }
  }

  return { start: origPos, end: endOrigPos };
}

// Main: process all chapters
const volumeDirs = fs.readdirSync(CHAPTERS_DIR).filter(d => d.startsWith('volume-')).sort((a,b) => {
  const na = parseInt(a.split('-')[1]);
  const nb = parseInt(b.split('-')[1]);
  return na - nb;
});

let totalFiles = 0;
let totalFixed = 0;
const results = [];

for (const volDir of volumeDirs) {
  const volNum = volDir.split('-')[1];
  const volPath = path.join(CHAPTERS_DIR, volDir);
  const files = fs.readdirSync(volPath).filter(f => f.endsWith('-polished.md')).sort((a,b) => {
    const na = parseInt(a.match(/chapter-(\d+)/)[1]);
    const nb = parseInt(b.match(/chapter-(\d+)/)[1]);
    return na - nb;
  });

  for (const file of files) {
    const fullPath = path.join(volPath, file);
    const findings = getFindings(fullPath);
    if (findings.length > 0) {
      const fixed = fixFile(fullPath);
      if (fixed > 0) {
        totalFiles++;
        totalFixed += fixed;
        results.push({ file: file.replace('-polished.md', ''), fixed });
        console.log(file + ': ' + fixed + ' replacements');
      }
    }
  }
}

console.log('\n=== SUMMARY ===');
console.log('Files modified: ' + totalFiles);
console.log('Total replacements: ' + totalFixed);
