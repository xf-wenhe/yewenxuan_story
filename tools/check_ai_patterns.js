// check_ai_patterns.js — Scan all chapters for banned AI patterns
const fs = require('fs'), p = require('path');

function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

// Banned words from polish_pipeline.py L1_WORDS
const bannedWords = [
  '仿佛', '犹如', '宛若', '如同',
  '深吸一口气', '深吸一口气', '缓缓', '不禁', '微微', '轻轻', '淡淡',
  '眼中闪过', '嘴角勾起', '眉头微皱', '心中暗道',
  '不容置疑', '显而易见', '毫无疑问',
  '坚定', '深邃', '凛冽', '冰冷',
  '不由自主', '情不自禁',
  '从容不迫', '波澜不惊', '纹丝不动',
  '一丝', '一股', '一抹', '一缕',
];

// Deadly patterns
const deadlyPatterns = [
  /不是[^，。！？]{1,10}而是[^，。！？]{1,10}/g,
  /他知道[^\n]{1,50}/g,
  /眼中闪过一丝/g,
  /心中涌起一股/g,
  /脑中闪过/g,
];

const results = [];

for (let ch = 1; ch <= 1000; ch++) {
  const fp = getFP(ch);
  if (!fs.existsSync(fp)) continue;
  const text = fs.readFileSync(fp, 'utf-8');
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const word of bannedWords) {
      if (line.includes(word)) {
        results.push({ ch, line: i + 1, type: 'WORD', word, context: line.substring(Math.max(0, line.indexOf(word) - 15), line.indexOf(word) + word.length + 15) });
      }
    }
    for (const pattern of deadlyPatterns) {
      pattern.lastIndex = 0;
      const m = pattern.exec(line);
      if (m) {
        results.push({ ch, line: i + 1, type: 'PATTERN', word: m[0], context: line.substring(Math.max(0, m.index - 15), m.index + m[0].length + 15) });
      }
    }
  }
}

console.log('=== AI Pattern Scan ===');
console.log('Total findings: ' + results.length);
console.log('');

// Group by word
const byWord = {};
for (const r of results) {
  const key = r.type === 'WORD' ? r.word : 'PATTERN: ' + r.word.substring(0, 30);
  if (!byWord[key]) byWord[key] = [];
  byWord[key].push(r);
}

for (const [word, items] of Object.entries(byWord).sort((a, b) => b[1].length - a[1].length)) {
  console.log(word + ' (' + items.length + '):');
  items.slice(0, 3).forEach(item => {
    console.log('  ch' + item.ch + ' L' + item.line + ': ' + item.context);
  });
  if (items.length > 3) console.log('  ... +' + (items.length - 3) + ' more');
}
