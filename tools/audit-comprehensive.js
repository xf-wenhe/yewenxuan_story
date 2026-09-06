// audit-comprehensive.js — 全库1000章综合审计
// 检查项：章节结构、人物命名、碎片编号、格式异常、重复段落、标点、时间线引用等
const fs = require('fs'), p = require('path');

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const ROOT = process.cwd();

function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join(ROOT, 'chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

function countCjk(t) {
  let n = 0;
  for (const c of t) { if (c >= '一' && c <= '鿿') n++; }
  return n;
}

function countPunct(s, punct) {
  return s.split(punct).length - 1;
}

// ======== RESULTS CONTAINER ========
const issues = [];
const stats = {};
const chDetails = {};

function addIssue(ch, category, severity, msg) {
  if (!issues[ch]) issues[ch] = [];
  issues[ch].push({ category, severity, msg });
}

// ======== AUDIT EACH CHAPTER ========
for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) {
    addIssue(ch, 'FILE_MISSING', 'CRITICAL', '文件不存在');
    continue;
  }
  const text = fs.readFileSync(fp, 'utf-8');
  const lines = text.split('\n');
  const trimmed = text.trim();

  const cjk = countCjk(text);
  stats.totalCjk = (stats.totalCjk || 0) + cjk;

  // ---- 1. FILE STRUCTURE ----

  // 1a. Chapter title header
  const titleMatch = trimmed.match(/^# 第[一二三四五六七八九十百零]+章：.+/);
  if (!titleMatch) {
    // Try to find the title line
    const altMatch = lines[0] && lines[0].match(/^#\s+/);
    if (!altMatch) {
      addIssue(ch, 'TITLE_HEADER', 'MEDIUM', '缺少章节标题或格式不正确: "' + (lines[0] || '').slice(0, 50) + '"');
    }
  }

  // 1b. End marker
  const endMarkerRe = /（第[一二三四五六七八九十百零千]+章完）/;
  const endMarkerMatch = text.match(endMarkerRe);
  if (!endMarkerMatch) {
    // Check for alternative markers
    if (text.includes('章完')) {
      addIssue(ch, 'END_MARKER', 'MEDIUM', '结尾标记格式异常');
    } else {
      addIssue(ch, 'END_MARKER', 'HIGH', '缺少结尾标记');
    }
  }

  // 1c. Volume end marker (should be present at volume boundaries)
  const volEnds = {100: '——第一卷·', 250: '——第二卷·', 400: '——第三卷·', 550: '——第四卷·', 750: '——第五卷·', 918: '——第六卷·', 1000: '——第七卷·'};
  if (volEnds[ch]) {
    if (!text.includes(volEnds[ch])) {
      addIssue(ch, 'VOL_MARKER', 'HIGH', '缺少卷末标记（应为"' + volEnds[ch] + '）');
    }
  }

  // 1d. CJK count
  if (cjk < 3000) {
    addIssue(ch, 'CJK_LOW', 'HIGH', 'CJK不足3000: ' + cjk);
  }

  // 1e. Check for unexpected blank lines (3+ consecutive)
  const tripleBlank = text.match(/\n\n\n\n/g);
  if (tripleBlank && tripleBlank.length > 2) {
    addIssue(ch, 'BLANK_LINES', 'LOW', '过多空行(' + tripleBlank.length + '处)');
  }

  // ---- 2. CHARACTER NAME CONSISTENCY ----
  const nameVariations = {
    '叶文轩': 0,
    '葉文軒': 0,  // Traditional
    '叶轩': 0,
    '叶文萱': 0,
    '赵大嘴': 0,
    '赵大咀': 0,
    '赵大嘴': 0,
    '赵磊': 0,
    '沈知秋': 0,
    '林渊': 0,
    '韩冰': 0,
    '李铭': 0,
    '李明': 0,
    '陈建国': 0,
    '朵朵': 0,
    '叶子': 0,
    '沈秋': 0,
  };
  for (const [name, _] of Object.entries(nameVariations)) {
    nameVariations[name] = text.split(name).length - 1;
  }
  // Check for suspicious traditional-character variants
  const tradVariants = ['葉文軒', '趙大嘴', '趙磊'];
  for (const t of tradVariants) {
    if (nameVariations[t] > 0) {
      addIssue(ch, 'NAME_TRADITIONAL', 'LOW', '发现繁体变体"' + t + '" x' + nameVariations[t]);
    }
  }
  // Check for name aliases that might be wrong
  if (nameVariations['叶文萱'] > 0) addIssue(ch, 'NAME_ALIAS', 'LOW', '发现"叶文萱" x' + nameVariations['叶文萱']);

  // ---- 3. FRAGMENT NUMBERING CONSISTENCY ----
  // Expected fragments: 0428, 0429, 0415, 0429备份, etc.
  const fragmentNumbers = ['0428', '0429', '0415', '0427', '0430', '0420', '0410'];
  for (const fn of fragmentNumbers) {
    const cnt = text.split(fn).length - 1;
    if (cnt > 0) {
      // 0428/0429/0415 are expected; others might be errors
      if (!['0428', '0429', '0415'].includes(fn)) {
        addIssue(ch, 'FRAGMENT_NUMBER', 'LOW', '非常用碎片编号"' + fn + '" x' + cnt);
      }
    }
  }

  // Check for "碎片" without number
  const fragWithoutNum = (text.match(/(?<!\d)碎片/g) || []).length;
  const fragWithNum = (text.match(/\d{4}碎片/g) || []).length;
  // Not really an issue, just info

  // ---- 4. FORMATTING ANOMALIES ----

  // 4a. Orphaned quotes (line starting with " but no closing ")
  lines.forEach((line, idx) => {
    const t = line.trim();
    if (t.startsWith('"') && !t.endsWith('"') && t.length > 2) {
      // Could be a quote that spans paragraphs — check if next line continues
      if (idx < lines.length - 1 && !lines[idx+1].trim().endsWith('"')) {
        // Skip if it's dialogue spanning multiple lines
        // Only flag if it's a short incomplete quote
        if (t.length < 10 && !t.includes('...')) {
          addIssue(ch, 'ORPHANED_QUOTE', 'LOW', '第' + (idx+1) + '行: 可能不完整的引号 "' + t.slice(0, 20) + '"');
        }
      }
    }
  });

  // 4b. Stray punctuation patterns
  // Double periods
  if (text.includes('。。')) {
    addIssue(ch, 'DOUBLE_PERIOD', 'LOW', '发现"。。"重复句号');
  }
  // Empty parentheses
  if (text.includes('（）') || text.includes('()')) {
    addIssue(ch, 'EMPTY_PARENS', 'LOW', '发现空括号');
  }
  // Triple periods without ellipsis
  if (text.match(/\.\.\.\.\.\./)) {
    addIssue(ch, 'TRIPLE_DOT', 'LOW', '发现过多连续句号');
  }

  // 4c. Markdown formatting anomalies
  // Stray **bold** that's not meaningful
  const strayBold = (text.match(/\*\*[^*]{1,3}\*\*/g) || []).length;
  if (strayBold > 0) {
    addIssue(ch, 'STRAY_BOLD', 'LOW', '孤立**加粗** x' + strayBold);
  }

  // 4d. HTML comments or code blocks
  if (text.includes('<!--')) {
    addIssue(ch, 'HTML_COMMENT', 'LOW', '包含HTML注释');
  }
  if (text.match(/^```\w+/m)) {
    addIssue(ch, 'CODE_BLOCK', 'LOW', '包含代码块');
  }

  // ---- 5. DUPLICATE PARAGRAPHS ----
  // Lines 20+ chars, appearing 3+ times
  const longLines = lines.map(l => l.trim()).filter(l => l.length >= 20 && l.length < 200);
  const lineCounts = {};
  for (const l of longLines) {
    lineCounts[l] = (lineCounts[l] || 0) + 1;
  }
  for (const [line, cnt] of Object.entries(lineCounts)) {
    if (cnt >= 3) {
      addIssue(ch, 'DUPLICATE_PARA', 'MEDIUM', '"' + line.slice(0, 30) + '..." x' + cnt);
    }
  }

  // ---- 6. SENTENCE-LEVEL ISSUES ----

  // 6a. Sentence length analysis — extremely long sentences (200+ chars)
  const sentences = text.split(/[。！？…\n]/);
  let veryLongSentences = 0;
  for (const s of sentences) {
    if (s.trim().length > 200) veryLongSentences++;
  }
  if (veryLongSentences > 0) {
    addIssue(ch, 'LONG_SENTENCE', 'LOW', veryLongSentences + '个超长句子(200+字)');
  }

  // 6b. Single-character paragraphs
  const shortParas = lines.filter(l => {
    const t = l.trim();
    return t.length > 0 && t.length < 2 && !t.startsWith('#') && !t.startsWith('>');
  });
  if (shortParas.length > 3) {
    addIssue(ch, 'SHORT_PARAS', 'LOW', shortParas.length + '个单字段落');
  }

  // ---- 7. DIALOGUE CONSISTENCY ----

  // 7a. Dialogue attribution patterns
  // "叶文轩说。" should match "叶文轩" throughout
  // Check if all character names in dialogue attribution are consistent
  const dialogAttributions = {
    '叶文轩': text.split('叶文轩说').length - 1 + text.split('叶文轩道').length - 1 + text.split('叶文轩开口').length - 1,
    '赵大嘴': text.split('赵大嘴说').length - 1 + text.split('赵大嘴道').length - 1,
    '韩冰': text.split('韩冰说').length - 1 + text.split('韩冰道').length - 1,
    '林渊': text.split('林渊说').length - 1 + text.split('林渊道').length - 1,
    '沈知秋': text.split('沈知秋说').length - 1 + text.split('沈知秋道').length - 1,
  };

  // 7b. Broken dialogue patterns
  // "……"叶文轩说。" with mismatched quotes
  const brokenDialogue = text.match(/…{2}"[^"]*"（第|\.{3}"[^"]*"（第/);
  if (brokenDialogue) {
    addIssue(ch, 'BROKEN_DIALOGUE', 'LOW', '结尾附近可能有断裂对话');
  }

  // ---- 8. TIMELINE/SETTING REFERENCES ----

  // 8a. Year references
  const yearMatches = text.match(/\d{4}年/g) || [];
  for (const y of yearMatches) {
    const yr = parseInt(y);
    if (yr < 1990 || yr > 2200) {
      addIssue(ch, 'YEAR_ANOMALY', 'LOW', '异常年份引用: ' + y);
    }
  }

  // 8b. Specific timeline markers
  // "闭环" references - check for conflicting loop numbers
  const loopMentions = text.match(/第\d+次循环|第\d+循环/g) || [];
  const loopNumbers = new Set();
  for (const m of loopMentions) {
    const n = parseInt(m.replace(/[^0-9]/g, ''));
    loopNumbers.add(n);
  }

  // ---- 9. SYSTEM/UI ELEMENTS ----

  // 9a. System prompt format consistency
  const systemPrompts = text.match(/>.*「.*」.*<|>.*「.*」/g) || [];
  if (systemPrompts.length > 0) {
    // Check for inconsistencies in system message formatting
    const fmtTypes = new Set();
    for (const sp of systemPrompts) {
      if (sp.includes('**「')) fmtTypes.add('bold');
      else if (sp.includes('「')) fmtTypes.add('plain');
    }
  }

  // 9b. Check for system message that breaks mid-sentence
  // Look for system messages without proper closing
  const unclosedSystem = text.match(/>.*「[^」]*$/m);
  if (unclosedSystem) {
    addIssue(ch, 'UNCLOSED_SYSTEM', 'LOW', '未关闭的系统消息');
  }

  // ---- 10. CONTENT-LEVEL CHECKS ----

  // 10a. POV consistency — check for sudden perspective shifts
  // Look for "她" or "他" references that don't match the main character
  // This is too complex to automate reliably

  // 10b. Check for incomplete narrative transitions
  // Look for chapter that ends abruptly without resolution
  const last200 = text.slice(-200);
  if (!last200.includes('章完') && !last200.includes('——')) {
    // Might be fine — just informational
  }

  // ---- 11. NUMBERS AND MEASUREMENTS ----

  // Check for inconsistent numbers
  // "121年" should be consistent
  const years121 = text.split('121年').length - 1;
  const yearsOther = text.split(/(?<!121)年/g).length;
  // Not an issue per se, just tracking

  // 10c. Fragment count consistency
  // 0428 has 42 fragments, check if this is consistent
  // "42片" or "四十二片"
  const fragCount42 = (text.match(/42片|四十二片/g) || []).length;

  // 10d. Check for "朵朵" before her proper introduction (should be V2+)
  // Actually 朵朵 appears from around ch160+
  // Just checking if name is introduced properly

  // ---- 12. PUNCTUATION CONSISTENCY ----

  // 12a. Full-width vs half-width
  // Should use full-width Chinese punctuation
  const halfWidthPeriod = (text.match(/[a-zA-Z0-9]\.[a-zA-Z0-9]/g) || []).length;
  // This is fine in mixed English/Chinese contexts

  // 12b. Check for straight vs curly quotes
  const straightQuotes = (text.match(/"/g) || []).length;
  const curlyQuotes = (text.match(/[“”]/g) || []).length;
  // Should primarily use straight quotes per project rules
  if (curlyQuotes > 0) {
    addIssue(ch, 'QUOTE_STYLE', 'LOW', '发现弯引号 x' + curlyQuotes);
  }

  // 12c. Check for half-width punctuation in Chinese context
  const halfWidthComma = (text.match(/[一-鿿],[一-鿿]/g) || []).length;
  const halfWidthDot = (text.match(/[一-鿿]\.[一-鿿]/g) || []).length;
  if (halfWidthComma > 0) addIssue(ch, 'PUNCT_HALF', 'LOW', '半角逗号 x' + halfWidthComma);
  if (halfWidthDot > 0) addIssue(ch, 'PUNCT_HALF', 'LOW', '半角句号 x' + halfWidthDot);

  // 12d. Missing punctuation at end of sentences
  // Check for lines that end without proper sentence-ending punctuation
  const noPunctLines = lines.filter(l => {
    const t = l.trim();
    if (t.length < 3 || t.startsWith('#') || t.startsWith('>')) return false;
    return !/[。！？…）」』】、；："""]$/.test(t);
  }).length;
  if (noPunctLines > 0) {
    // Don't flag every case — some sentences might be fine
    // Only flag if there are many
    if (noPunctLines > 5) {
      addIssue(ch, 'NO_PUNCT', 'LOW', noPunctLines + '行缺少句末标点');
    }
  }

  // ---- 13. CROSS-CHAPTER CONSISTENCY (will be checked globally later) ----

  // ---- 14. DIALOGUE TAG CONSISTENCY ----
  // Check for "说道" which is a common AI-tell variant
  if (text.includes('说道')) {
    addIssue(ch, 'AI_TELL', 'LOW', '发现"说道"');
  }
  // Check for "轻轻" or "微微" if any remain
  // These were already cleaned but double-check

  // ---- 15. CHAPTER NUMBER CONSISTENCY ----
  // Check that the chapter title number matches the file name
  if (titleMatch) {
    // Extract the chapter number from title
    const titleNum = titleMatch[0].match(/第([一二三四五六七八九十百零]+)章/);
    if (titleNum) {
      // Convert Chinese numeral to number
      // Simple conversion for our range
      const cnNums = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,
        '百':100,'零':0 };
      const cnStr = titleNum[1];
      let cnVal = 0;
      let tmp = 0;
      for (const c of cnStr) {
        if (c === '百') { cnVal += (tmp || 1) * 100; tmp = 0; }
        else if (c === '十') { cnVal += (tmp || 1) * 10; tmp = 0; }
        else { tmp = cnNums[c] || 0; }
      }
      cnVal += tmp;
      if (cnVal !== ch) {
        addIssue(ch, 'CHAPTER_NUM_MISMATCH', 'HIGH', '章节标题数字"' + cnVal + '"与文件名不一致');
      }
    }
  }

  // Store details for cross-chapter checks
  chDetails[ch] = {
    cjk,
    chars: text.length,
    lines: lines.length,
    hasTitle: !!titleMatch,
    hasEndMarker: !!endMarkerMatch,
    nameCounts: nameVariations,
  };
}

// ======== GLOBAL CHECKS ========

console.log('=== 全局检查 ===');

// ---- G1: Total CJK ----
console.log('总CJK: ' + stats.totalCjk.toLocaleString());

// ---- G2: Chapters below 3000 ----
const below3000 = [];
for (let ch = 1; ch <= 1000; ch++) {
  if (chDetails[ch] && chDetails[ch].cjk < 3000) {
    below3000.push(ch);
  }
}
console.log('低于3000 CJK的章节: ' + below3000.length);
if (below3000.length) console.log('  章节: ' + below3000.join(', '));

// ---- G3: Missing chapters ----
const missingFiles = [];
for (let ch = 1; ch <= 1000; ch++) {
  if (!fs.existsSync(getFP(ch))) {
    missingFiles.push(ch);
  }
}
console.log('缺失章节文件: ' + missingFiles.length);
if (missingFiles.length) console.log('  章节: ' + missingFiles.join(', '));

// ---- G4: Cross-chapter name consistency ----
// Count total mentions of each character name across all chapters
const globalNameCounts = {};
for (const ch of Object.keys(chDetails)) {
  for (const [name, cnt] of Object.entries(chDetails[ch].nameCounts)) {
    globalNameCounts[name] = (globalNameCounts[name] || 0) + cnt;
  }
}
console.log('\n=== 角色名称全局统计 ===');
for (const [name, cnt] of Object.entries(globalNameCounts).sort((a,b) => b[1]-a[1])) {
  if (cnt > 0) console.log('  ' + name + ': ' + cnt + '次');
}

// ---- G5: Volume coverage ----
console.log('\n=== 卷覆盖范围 ===');
for (const v of VOLUMES) {
  const dir = p.join(ROOT, 'chapters', v);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(x => x.endsWith('-polished.md')).length;
  console.log('  ' + v + ': ' + files + '章');
}

// ---- G6: Check for chapters that skip chapter numbers in sequence ----
// (This is expected — chapters are numbered by file, not by content)

// ---- G7: Global terminology consistency ----
// Check for common terms that should be consistent
const globalTerms = ['碎片', '闭环', '回廊', '洞察者', '系统', '区域A', '区域B', '区域C',
  '区域 A', '区域 B', '区域 C', '归位之门', '维护派', '觉醒者'];
console.log('\n=== 术语一致性 ===');
for (const term of globalTerms) {
  let total = 0;
  for (let ch = 1; ch <= 1000; ch++) {
    const fp = getFP(ch);
    if (!fs.existsSync(fp)) continue;
    const text = fs.readFileSync(fp, 'utf-8');
    total += text.split(term).length - 1;
  }
  if (total > 0) console.log('  "' + term + '": ' + total + '次');
}

// ---- G8: Check for common AI-tell patterns that might have survived ----
const aiTellPatterns = [
  '说道', '仿佛', '犹如', '宛若', '如同',
  '深吸一口气', '缓缓', '不禁', '微微', '轻轻', '淡淡',
  '眼中闪过', '嘴角勾起', '眉头微皱',
  '从容不迫', '不容置疑', '显而易见', '毫无疑问',
  '深邃', '凛冽', '冰冷', '不由自主', '情不自禁',
  '自然而然', '狡黠', '闪烁着光芒',
];
console.log('\n=== AI痕迹残留 ===');
for (const pat of aiTellPatterns) {
  let total = 0;
  for (let ch = 1; ch <= 1000; ch++) {
    const fp = getFP(ch);
    if (!fs.existsSync(fp)) continue;
    const text = fs.readFileSync(fp, 'utf-8');
    total += text.split(pat).length - 1;
  }
  if (total > 0) console.log('  "' + pat + '": ' + total + '次');
}

// ---- G9: Format anomalies summary ----
console.log('\n=== 格式问题汇总 ===');
const formatIssues = {};
for (const [ch, chIssues] of Object.entries(issues)) {
  for (const issue of chIssues) {
    formatIssues[issue.category] = (formatIssues[issue.category] || 0) + 1;
  }
}
for (const [cat, cnt] of Object.entries(formatIssues).sort((a,b) => b[1]-a[1])) {
  console.log('  ' + cat + ': ' + cnt + '处');
}

// ---- G10: Severity summary ----
console.log('\n=== 严重程度汇总 ===');
const severityCounts = {};
for (const chIssues of Object.values(issues)) {
  for (const issue of chIssues) {
    severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
  }
}
for (const [sev, cnt] of Object.entries(severityCounts).sort((a,b) => {
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return order[a[0]] - order[b[0]];
})) {
  console.log('  ' + sev + ': ' + cnt + '处');
}

// ---- G11: Detailed issues list ----
console.log('\n=== 详细问题清单 ===');
let totalIssues = 0;
for (let ch = 1; ch <= 1000; ch++) {
  if (!issues[ch]) continue;
  const chNum = ch;
  const vol = ch <= 100 ? 'V1' : ch <= 250 ? 'V2' : ch <= 400 ? 'V3' : ch <= 550 ? 'V4' : ch <= 750 ? 'V5' : ch <= 918 ? 'V6' : 'V7';
  for (const issue of issues[ch]) {
    totalIssues++;
    console.log('  ' + vol + ' ch' + chNum + ' [' + issue.severity + '][' + issue.category + ']: ' + issue.msg);
  }
}
console.log('\n问题总数: ' + totalIssues);

// ---- G12: CJK distribution ----
console.log('\n=== CJK分布 ===');
const cjkRanges = { '3000-3500': 0, '3500-4000': 0, '4000-4500': 0, '4500-5000': 0, '5000+': 0, '<3000': 0 };
for (const ch of Object.keys(chDetails)) {
  const c = chDetails[ch].cjk;
  if (c < 3000) cjkRanges['<3000']++;
  else if (c < 3500) cjkRanges['3000-3500']++;
  else if (c < 4000) cjkRanges['3500-4000']++;
  else if (c < 4500) cjkRanges['4000-4500']++;
  else if (c < 5000) cjkRanges['4500-5000']++;
  else cjkRanges['5000+']++;
}
for (const [range, cnt] of Object.entries(cjkRanges)) {
  console.log('  ' + range + ' CJK: ' + cnt + '章');
}

console.log('\n=== 审计完成 ===');
