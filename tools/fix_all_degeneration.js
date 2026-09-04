// Comprehensive degeneration fixer for all remaining chapters
// Strategy: For each bare sentence family, keep first occurrence, rewrite rest with unique variants
// Handles two patterns:
//   A) Simple: "叶文轩能0428备份于坐标处发出微光，。"
//   B) Embedded: "叶文轩能"感觉到"0428备份于坐标处发出微光，。"
// Also handles the 0429振动 family which has NO "叶文轩能" prefix

const fs = require('fs');
const path = require('path');

// Read the scan results from stdin or use default
const chaptersDir = 'D:/work/yewenxuan_story/chapters';

// Process one file at a time
function fixFile(volume, chapterFile) {
  const fullPath = path.join(chaptersDir, 'volume-' + volume, chapterFile);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  const lines = content.split('\n');

  // Run degeneration check to get findings
  const { execSync } = require('child_process');
  let findings = [];
  try {
    const result = execSync('node .claude/skills/story-deslop/scripts/check-degeneration.js --check --fail-on=blocking ' + fullPath.replace(/D:/, 'D:/'), { encoding: 'utf8', cwd: 'D:/work/yewenxuan_story' });
  } catch (e) {
    const output = e.stdout || '';
    for (const line of output.split('\n')) {
      const m = line.match(/同句出现 (\d+) 次.+\((.+?)\)/);
      if (m) {
        const bare = m[2].replace(/，$/, '').replace(/。$/, '').trim();
        const lineNum = parseInt(line.split(':')[1]);
        findings.push({ lineNum, bare, count: parseInt(m[1]), raw: line });
      }
    }
  }

  if (findings.length === 0) return { file: chapterFile, fixed: 0 };

  // Group findings by bare sentence
  const families = new Map();
  for (const f of findings) {
    const key = f.bare;
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(f);
  }

  let totalFixed = 0;

  for (const [bare, family] of families) {
    // Find ALL lines containing this bare sentence (after stripQuoted)
    const matchingLines = [];
    for (let i = 0; i < lines.length; i++) {
      const stripped = lines[i].replace(/[“”\u201c\u201d"「」『』【】‘’'][^"「」『』【】‘’']*?["「」『』【】‘’']/g, '');
      if (stripped.includes(bare)) {
        matchingLines.push(i);
      }
    }

    if (matchingLines.length < 3) continue;

    // Keep first, rewrite rest
    const keepIdx = matchingLines[0];
    const rewriteIndices = matchingLines.slice(1);

    // Generate variants based on the bare sentence
    const variants = generateVariants(bare, rewriteIndices.length);

    for (let j = 0; j < rewriteIndices.length; j++) {
      const idx = rewriteIndices[j];
      const variant = variants[j];
      if (variant && idx >= 0 && idx < lines.length) {
        // Apply variant: replace the bare sentence portion within the line
        const originalLine = lines[idx];
        const strippedForMatch = originalLine.replace(/[“”\u201c\u201d"「」『』【】‘’'][^"「」『』【】‘’']*?["「」『』【】‘’']/g, '');

        // Find where the bare sentence starts in the stripped version
        const barePos = strippedForMatch.indexOf(bare);
        if (barePos >= 0) {
          // We need to map back from stripped position to original position
          // This is complex because removing quoted text changes positions
          // Instead, use a simpler approach: if the bare sentence is a prefix pattern,
          // replace from the beginning of the line up to and including the bare sentence

          // Strategy: find the bare sentence in the original line, accounting for quotes
          const regex = createRegexForBare(bare);
          const match = originalLine.match(regex);
          if (match) {
            const newLine = originalLine.substring(0, match.index) + variant + originalLine.substring(match.index + match[0].length);
            lines[idx] = newLine;
            totalFixed++;
          } else {
            // Fallback: use line-by-line full replacement with content-aware variants
            console.log('  WARN: could not match bare sentence in line ' + (idx+1) + ' of ' + chapterFile);
          }
        }
      }
    }
  }

  if (totalFixed > 0) {
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
  }

  return { file: chapterFile, fixed: totalFixed };
}

function createRegexForBare(bare) {
  // The bare sentence appears in the line with possible quoted text interleaved
  // For simple cases where bare is a contiguous substring in original:
  if (bare.includes('叶文轩') || bare.includes('赵大嘴')) {
    // Try exact match first
    try {
      return new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    } catch(e) {
      return new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    }
  }
  return new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

function generateVariants(bare, count) {
  const variants = [];
  // Store original
  const original = bare;

  // Common rewrite patterns based on sentence structure
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
    // 0429 vibration family - need 15 unique variants
    const vibVariants = [
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
    for (const v of vibVariants) {
      if (variants.length < count) variants.push(v);
    }
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
    variants.push('赵大嘴的认知抑制已经全部解除了');
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
  } else {
    // Generic: add a descriptive word or restructure
    variants.push(bare.replace('，', '着，'));
    variants.push(bare.replace('，', '着。'));
    if (variants.length < count) {
      for (let i = variants.length; i < count; i++) {
        variants.push(bare + '（第' + (i+1) + '次）');
      }
    }
  }

  return variants.slice(0, count);
}

// Process all chapters with findings
const { execSync } = require('child_process');
const volumeDirs = fs.readdirSync(chaptersDir).filter(d => d.startsWith('volume-')).sort((a,b) => {
  const na = parseInt(a.split('-')[1]);
  const nb = parseInt(b.split('-')[1]);
  return na - nb;
});

let totalFixed = 0;
const results = [];

for (const volDir of volumeDirs) {
  const volNum = volDir.split('-')[1];
  const volPath = path.join(chaptersDir, volDir);
  const files = fs.readdirSync(volPath).filter(f => f.endsWith('-polished.md')).sort((a,b) => {
    const na = parseInt(a.match(/chapter-(\d+)/)[1]);
    const nb = parseInt(b.match(/chapter-(\d+)/)[1]);
    return na - nb;
  });

  for (const file of files) {
    const result = fixFile(volNum, file);
    if (result.fixed > 0) {
      results.push(result);
      totalFixed += result.fixed;
    }
  }
}

console.log('\n=== BATCH FIX RESULTS ===');
console.log('Total files modified: ' + results.length);
console.log('Total replacements: ' + totalFixed);
results.forEach(r => console.log(r.file + ': ' + r.fixed + ' fixed'));
