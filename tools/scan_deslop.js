#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const VOL_LABEL = {'volume-1':'V1','volume-2':'V2','volume-3':'V3','volume-4':'V4','volume-5':'V5','volume-6':'V6','volume-7':'V7'};

// ---- L1 一级禁用词（来自 banned-words.md）----
const L1_WORDS = [
  // 情态类
  '仿佛','犹如','宛若','如同','一丝','一抹','些许','几分','隐约','毫无征兆','几不可闻','微不可察',
  // 动作类
  '深吸一口气','不禁',
  // 表情类
  '眼中闪过','嘴角勾起','眉头微皱','眉眼低垂','瞳孔微缩','瞳孔收缩','瞳孔一缩','指节泛白','眼神锐利','目光锐利',
  // 心理类
  '心中一动','心头一震','心下了然','心中暗道','心底泛起','不由得','心中一凛',
  // 判断类
  '不容置疑','不容置喙','不易察觉','显而易见','毫无疑问','不可否认','前所未有',
  // 形容类
  '坚定','闪烁着光芒','狡黠','深邃','凛冽','冰冷',
  // 过渡类
  '不由自主','情不自禁','自然而然','话锋一转',
];

// ---- Blocking 模式（check-ai-patterns.js 复用）----
const VOICE_CONTRAST_RE = /声音(?:并)?不[大高响亮][^。！？!?\n]{0,16}[却但偏]/g;
const NEGATION_PARADE_RE = /(?:没有[^。！？!?\n，,]{1,12}[，,]){2}/g;
const CROSS_NEG_START = /^不是[^。！？!?\n]{1,24}[。！？!?]?$/;
const CROSS_NEG_MID   = /^(?:也|还)不是[^。！？!?\n]{1,24}[。！？!?]?$/;
const CROSS_NEG_END   = /^只是[^。！？!?\n]{1,32}[。！？!?]?$/;
const REVERSE_NOT_IS_RE = /是([^。！？!?\n，,]{1,12})[，,]\s*(?:而)?不是([^。！？!?\n]{1,20})/g;
const TRAILER_ENDING_RE = /没人知道|谁也不知道|谁也没想到|殊不知|(?:这)?才刚刚开(?:始|头)|正(?:朝着|向着)[^。！？!?\n]{0,24}(?:压|涌|袭|逼)(?:了?过去|了?过来|来)|(?:拉开(?:序幕|帷幕))/g;
const TRAILER_SUMMARY_RE = /这一(?:夜|天|刻|战|年|局|役)[，,]?[^。！？!?，,\n]{0,6}(?<!命中)(?<!是)注定[^。！？!?\n]{0,8}[。！]|就这样[，,][^。！？!?，,\n]{0,8}(?:一切|全部)[^。！？!?，,\n]{0,4}(?:结束了|落幕|收场)[。！]|这一切[，,]?[^。！？!?，,\n]{0,6}(?:都)?(?:说明|意味着|结束了)(?!的)[^。！？!?\n]{0,6}[。！]|(?:新的篇章|新的旅程|崭新|新的人生)[^。！？!?\n]{0,6}(?:开始|拉开|展开)|命运[^。！？!?\n]{0,6}齿轮/g;
const EMDASH_RE = /——|—|--+/g;
const NOT_IS_RE = /不是/g; // simplified: full not-is logic needs state machine, we do count as proxy
const DECISION_FRAME_RE = /至于([㐀-鿿]{1,3})不\1[，,]\s*怎么\1/g;
const REPEATED_NEG_VERB_RE = /不([㐀-鿿]{1,2})([㐀-鿿]{2,8})[，,]\s*不\1([㐀-鿿]{2,8])/g;

// ---- Advisory 密度模式 ----
const CLICHE_PATTERNS = [
  /仿佛|犹如|宛若|如同/g,
  /一丝|一抹|些许|几分|隐约/g,
  /深吸一口气|缓缓|微微|轻轻|淡淡/g,
  /眼中闪过|嘴角勾起|眸光微微一闪|指节泛白|目光锐利|眼神锐利/g,
  /心中涌起一股|心头震震|心中一动|心下了然|心中暗道|心中一凛/g,
  /不容置疑|不容置喙|不易察觉|显而易见|毫无疑问|不可否认/g,
  /声音不大[，,]?却带着|语气平静无波|平静无波|声音平直|听不出情绪/g,
  /散发了一股|冰冷的光|格外刺眼|深邃而冰冷/g,
];
const METAPHOR_MARKER_RE = /好像|像是|仿佛|宛如|如同|犹如/g;
const METAPHOR_LIKE_RE = /(?:死|水|冰|火|潮水|石头|木头|机器|纸|铁|鬼|死人|刀|针|网|墙)一样/g;
const REASONING_PATTERNS = [
  /(?<![不没未无])(?:他|她|我)?(?:知道|明白|意识到|清楚|判断|确认|分析)/g,
  /这意味着|也就是说|换句话说|真正的问题(?:在于)?|问题在于|关键在于/g,
];
const MICRO_TIC_RE = /了(?:[一两三几半])?[下阵圈道声眼口气会]/g;
const ACTION_VERB_RE = /伸手|抬手|探手|拿起|拿过|取出|取过|掏出|摸出|抓起|攥住|握住|捏住|按住|推开|拉开|打开|关上|放下|递给|挑开|掀开|扯开|拧开|倒出|端起|转身|回头|抬头|低头|弯腰|俯身|走到|走向|坐下|站起|看向|看着|盯着|扫过/g;
const ABSTRACT_SUMMARY_PATTERNS = [
  /这一刻[，,]?[^。！？!?\n]{0,24}(?:终于|才)(?:明白|意识到)/g,
  /(?:命运|宿命)[^。！？!?\n]{0,28}(?:齿轮|棋局|獠牙|改写|推向|安排)/g,
  /(?:反击|复仇|战争|较量|故事|命运)[^。！？!?\n]{0,12}才刚刚开始/g,
];
const OVERCOMPRESSED_PARTICLE_RE = /[的了就着过呢吧啊呀嘛]/g;
const LOW_CONN_TERMS = ['的','了','就','也','还','又','这个','那个','东西','事情','时候','里面','以后','一下','一点','有点','还是'];
const DIALOG_TAG_RE = /[说道问道笑道叹道哼道骂道喊道低声道冷笑道苦涩道苦笑道无奈道认真道严肃道郑重道]/g;

// ---- 工具函数 ----
function countCJK(t) { let n=0; for(const c of t){if(c>='一'&&c<='鿿')n++;} return n; }

function countHits(text, re) {
  re.lastIndex = 0;
  let n = 0, m;
  while ((m = re.exec(text)) !== null) n++;
  return n;
}

function countSubstring(text, substr) {
  let n = 0, i = 0;
  while ((i = text.indexOf(substr, i)) !== -1) { n++; i += substr.length; }
  return n;
}

// ---- 逐章扫描 ----
const results = [];
let totalFiles = 0, skippedFiles = 0;

for (const volDir of VOLUMES) {
  const d = path.join(process.cwd(), 'chapters', volDir);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) {
    const fp = path.join(d, f);
    const chMatch = f.match(/chapter-(\d+)/);
    if (!chMatch) { skippedFiles++; continue; }
    const chNum = parseInt(chMatch[1]);
    totalFiles++;

    const text = fs.readFileSync(fp, 'utf-8');
    const cjk = countCJK(text);
    if (cjk < 500) { skippedFiles++; continue; } // skip stubs

    const lines = text.split(/\r?\n/);
    const narrativeLines = lines.filter(l => {
      const t = l.trim();
      if (!t || /^-{3,}$/.test(t) || /^[*_]{3,}$/.test(t)) return false;
      if (/^(#{1,6}\s|>\s?|[-*+]\s|\d+[.)]\s|\|)/.test(t)) return false;
      if (/^第[零一二三四五六七八九十百千万\d]+章(?:\s|_|$)/.test(t)) return false;
      return true;
    });
    const narrativeText = narrativeLines.join('\n');

    // 1) L1 禁用词
    let l1Hits = 0;
    for (const w of L1_WORDS) l1Hits += countSubstring(narrativeText, w);
    const l1Density = (l1Hits / (cjk / 1000)).toFixed(2);

    // 2) Blocking 模式
    const voiceContrast = countHits(narrativeText, VOICE_CONTRAST_RE);
    const negationParade = countHits(narrativeText, NEGATION_PARADE_RE);
    const emDash = countHits(narrativeText, EMDASH_RE);
    let reverseNotIs = countHits(narrativeText, REVERSE_NOT_IS_RE);
    let trailerEnding = countHits(narrativeText, TRAILER_ENDING_RE);
    let trailerSummary = countHits(narrativeText, TRAILER_SUMMARY_RE);
    // not-is-comparison 简化：统计"不是"出现次数作为近似（完整状态机太重）
    let notIs = countHits(narrativeText, NOT_IS_RE);

    const blockingTotal = voiceContrast + negationParade + emDash + reverseNotIs + trailerEnding + trailerSummary;

    // 跨段"不是A/也不是B/只是C"
    let crossNeg = 0;
    for (let i = 0; i <= lines.length - 3; i++) {
      const a = lines[i].trim(), b = lines[i+1].trim(), c = lines[i+2].trim();
      if (!a || !b || !c) continue;
      if (CROSS_NEG_START.test(a) && CROSS_NEG_MID.test(b) && CROSS_NEG_END.test(c)) crossNeg++;
    }

    // 3) Advisory 密度
    let clicheHits = 0;
    for (const re of CLICHE_PATTERNS) clicheHits += countHits(narrativeText, re);
    const clicheDensity = (clicheHits / (cjk / 1000)).toFixed(2);

    let metaphorHits = countHits(narrativeText, METAPHOR_MARKER_RE) + countHits(narrativeText, METAPHOR_LIKE_RE);
    const metaphorDensity = (metaphorHits / (cjk / 1000)).toFixed(2);

    let reasoningHits = 0;
    for (const re of REASONING_PATTERNS) reasoningHits += countHits(narrativeText, re);
    const reasoningDensity = (reasoningHits / (cjk / 1000)).toFixed(2);

    const microAction = countHits(narrativeText, MICRO_TIC_RE);
    const microActionDensity = (microAction / (cjk / 1000)).toFixed(2);

    const actionVerbHits = countHits(narrativeText, ACTION_VERB_RE);

    let abstractHits = 0;
    for (const re of ABSTRACT_SUMMARY_PATTERNS) abstractHits += countHits(narrativeText, re);
    const abstractDensity = (abstractHits / (cjk / 1000)).toFixed(2);

    // 对话标签密度
    const dialogLines = narrativeLines.filter(l => l.includes('"') || l.includes('“'));
    const dialogTagHits = countHits(narrativeText, DIALOG_TAG_RE);
    const dialogDensity = dialogLines.length > 0 ? (dialogTagHits / dialogLines.length * 100).toFixed(1) : '0';

    // 平均段落句数
    const paraSentences = narrativeLines.filter(l => l.trim().length > 0).map(l => {
      return (l.match(/[。！？!?]/g) || []).length + 1;
    });
    const avgParaSentences = paraSentences.length > 0 ? (paraSentences.reduce((a,b)=>a+b,0) / paraSentences.length).toFixed(2) : '0';

    // 长段落数
    const longParas = narrativeLines.filter(l => l.trim().length > 200).length;

    // 过度精炼
    const shortParas = narrativeLines.filter(l => l.trim().length > 0 && l.trim().length <= 15).length;
    const particleHits = countHits(narrativeText, OVERCOMPRESSED_PARTICLE_RE);
    const shortRatio = paraSentences.length > 0 ? (shortParas / narrativeLines.filter(l=>l.trim().length>0).length).toFixed(2) : '0';

    // 4) 综合 AI 味得分（加权）
    const l1Score = Math.min(l1Density * 4, 40);
    const blockingScore = Math.min(blockingTotal * 3, 30);
    const clicheScore = Math.min(clicheDensity * 1.5, 15);
    const reasoningScore = Math.min(reasoningDensity * 0.8, 10);
    const abstractScore = Math.min(abstractDensity * 10, 10);
    const microScore = Math.min(microActionDensity * 0.5, 5);

    const composite = Math.round((l1Score + blockingScore + clicheScore + reasoningScore + abstractScore + microScore) * 10) / 10;

    results.push({
      vol: VOL_LABEL[volDir],
      volDir,
      chNum,
      cjk,
      l1Hits,
      l1Density,
      blockingTotal,
      notIs,
      voiceContrast,
      negationParade,
      emDash,
      reverseNotIs,
      trailerEnding,
      trailerSummary,
      crossNeg,
      clicheHits,
      clicheDensity,
      metaphorDensity,
      reasoningDensity,
      abstractDensity,
      microActionDensity,
      dialogDensity,
      avgParaSentences,
      longParas,
      composite,
    });
  }
}

// ---- 按卷汇总 ----
const volStats = {};
for (const r of results) {
  if (!volStats[r.vol]) volStats[r.vol] = {chapters:0, totalCJK:0, avgL1:0, avgBlocking:0, avgCliche:0, avgComposite:0, worst:[]};
  const v = volStats[r.vol];
  v.chapters++;
  v.totalCJK += r.cjk;
  v.avgL1 += parseFloat(r.l1Density);
  v.avgBlocking += r.blockingTotal;
  v.avgCliche += parseFloat(r.clicheDensity);
  v.avgComposite += r.composite;
}
for (const k of Object.keys(volStats)) {
  const v = volStats[k];
  v.avgL1 = (v.avgL1 / v.chapters).toFixed(2);
  v.avgBlocking = (v.avgBlocking / v.chapters).toFixed(2);
  v.avgCliche = (v.avgCliche / v.chapters).toFixed(2);
  v.avgComposite = (v.avgComposite / v.chapters).toFixed(2);
}

// ---- 排序：综合得分降序 ----
results.sort((a, b) => b.composite - a.composite);

// ---- 输出报告 ----
console.log('=== 全库 AI 味扫描报告 ===');
console.log(`扫描章节: ${results.length} / 文件: ${totalFiles} (跳过: ${skippedFiles})\n`);

// 按卷汇总（按 AI 味严重程度排序）
const volSorted = Object.entries(volStats).sort((a,b) => b[1].avgComposite - a[1].avgComposite);
console.log('【按卷汇总】（AI 味严重程度降序）');
console.log('卷\t章节数\t总CJK\t\t禁用词/千字\tblocking/章\t套词/千字\t综合得分');
for (const [vol, v] of volSorted) {
  console.log(`${vol}\t${v.chapters}\t${v.totalCJK.toLocaleString()}\t\t${v.avgL1}\t\t${v.avgBlocking}\t\t${v.avgCliche}\t\t${v.avgComposite}`);
}

console.log('\n\n【Top 40 AI 味最重章节】');
console.log('排名\t卷\t章号\tCJK\t综合分\t禁用词/千字\tblocking\t套词/千字\t抽象/千字\t对话标签%');
for (let i = 0; i < Math.min(40, results.length); i++) {
  const r = results[i];
  console.log(`${i+1}\t${r.vol}\t${String(r.chNum).padStart(3,'0')}\t${r.cjk}\t${r.composite}\t${r.l1Density}\t\t${r.blockingTotal}\t\t${r.clicheDensity}\t\t${r.abstractDensity}\t${r.dialogDensity}`);
}

// 各维度 Top 5
console.log('\n\n【各维度 Top 5 章节】');

const dims = [
  ['禁用词密度', r => r.l1Density, '禁用词/千字'],
  ['blocking 命中', r => r.blockingTotal, '处'],
  ['not-is 句式', r => r.notIs, '处'],
  ['破折号', r => r.emDash, '处'],
  ['套词密度', r => r.clicheDensity, '套词/千字'],
  ['抽象总结', r => r.abstractDensity, '抽象/千字'],
  ['对话标签密度', r => r.dialogDensity, '%'],
  ['微动作密度', r => r.microActionDensity, '微动作/千字'],
  ['长段落', r => r.longParas, '段'],
];
for (const [name, fn, unit] of dims) {
  const top = [...results].sort((a,b) => fn(b) - fn(a)).slice(0, 5);
  console.log(`  ${name}:`);
  for (const r of top) console.log(`    ${r.vol} ch${String(r.chNum).padStart(3,'0')}: ${fn(r)} ${unit}`);
}

// JSON 数据导出
const jsonOut = path.join(process.cwd(), 'tools', 'scan_deslop_report.json');
fs.writeFileSync(jsonOut, JSON.stringify({
  scannedAt: new Date().toISOString(),
  totals: { chapters: results.length, files: totalFiles, skipped: skippedFiles },
  volStats,
  top40: results.slice(0, 40).map(r => ({ vol: r.vol, chNum: r.chNum, cjk: r.cjk, composite: r.composite, l1Density: r.l1Density, blocking: r.blockingTotal, clicheDensity: r.clicheDensity })),
  all: results,
}, null, 2), 'utf-8');
console.log(`\n完整数据已导出: ${jsonOut}`);

process.exit(0);