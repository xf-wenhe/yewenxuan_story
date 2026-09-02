// fix_l1_all_volumes.js — Mechanical L1 banned word + deadly pattern fix across ALL volumes
// Strategy: word-level replacement for L1 words; pattern-level for deadly patterns with clear context
// Skip: 带着...的 (with_complement) — too many false positives (e.g. "带着武器"), needs manual review

const fs = require('fs');
const path = require('path');
const ROOT = 'D:\\work\\yewenxuan_story';

// All L1 words with mechanical replacements
const REPLACEMENTS = {
  // modal (文言腔)
  '仿佛': ['似乎', '好像'],
  '犹如': ['好比', '像是'],
  '宛若': ['好似', '像是'],
  '如同': ['就像', '好似'],
  // action
  '深吸一口气': [''],  // delete the phrase
  '缓缓': ['慢慢', '渐渐'],
  '不禁': ['没忍住', '忍不住'],
  '微微': ['略微', '稍', '稍微'],
  '轻轻': ['轻', '略'],
  '淡淡': ['略', '稍'],
  // expression
  '眼中闪过': ['眼里'],
  '嘴角勾起': ['嘴角'],
  '眉头微皱': ['皱眉'],
  '眉眼低垂': ['垂眼'],
  '瞳孔微缩': ['瞳孔一缩'],
  // psychology
  '心中暗道': ['心里想'],
  '不由得': ['忍不住', '没忍住'],
  // judgment
  '不容置疑': ['不容辩驳'],
  '不容置喙': ['不容插嘴'],
  '不易察觉': ['难以察觉'],
  '显而易见': ['显然'],
  '毫无疑问': ['确实'],
  '不可否认': ['不得不承认'],
  // description
  '坚定': ['坚决'],
  '闪烁着光芒': ['发光'],
  '狡黠': ['机灵'],
  '深邃': ['深沉'],
  '凛冽': ['刺骨'],
  '冰冷': ['冷'],
  // transition
  '不由自主': ['忍不住'],
  '情不自禁': ['没忍住'],
  '自然而然': ['自然'],
};

// Deadly patterns to fix
const DEADLY_PATTERNS = [
  // not_a_but: 不是A而是B → just B
  { re: /不是([^，。！？]{1,10})[，———]而是/g, replace: (m, g1) => g1 },
  // eye_flash: 眼中闪过一丝X → 眼里X (only if 微微 was already handled, this is backup)
  { re: /眼中闪过一丝([^，。！？]{1,6})/g, replace: (m, g1) => '眼里' + g1 },
  // heart_surge: 心中涌起一股X → 心里X
  { re: /心中涌起一股([^，。！？]{1,6})/g, replace: (m, g1) => '心里' + g1 },
  // brain_running: 脑子在运转 → 脑子在转
  { re: /脑子在运转/g, replace: '脑子在转' },
  // mind_flash: 脑中闪过X → 脑子里X
  { re: /脑中闪过([^，。！？]{1,8})/g, replace: (m, g1) => '脑子里' + g1 },
];

function getVol(ch) {
  if (ch <= 100) return 1;
  if (ch <= 250) return 2;
  if (ch <= 400) return 3;
  if (ch <= 550) return 4;
  if (ch <= 750) return 5;
  if (ch <= 918) return 6;
  return 7;
}

function getChapterPath(ch) {
  const vol = getVol(ch);
  const numStr = ch <= 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return path.join(ROOT, 'chapters', `volume-${vol}`, `chapter-${numStr}-polished.md`);
}

let stats = {};
for (const word of Object.keys(REPLACEMENTS)) stats[word] = { total: 0, chapters: 0 };
const patternStats = {};
let totalChapters = 0;
let changedChapters = 0;

for (let ch = 1; ch <= 1000; ch++) {
  const fp = getChapterPath(ch);
  if (!fs.existsSync(fp)) continue;
  totalChapters++;

  let text = fs.readFileSync(fp, 'utf-8');
  let original = text;

  // Word replacements
  for (const [word, alts] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'g');
    const matches = text.match(regex);
    if (!matches) continue;

    stats[word].total += matches.length;
    stats[word].chapters++;

    let localIdx = 0;
    text = text.replace(regex, () => {
      const alt = alts.length === 1 ? alts[0] : alts[localIdx % alts.length];
      localIdx++;
      return alt;
    });
  }

  // Deadly pattern replacements
  for (const { re, replace } of DEADLY_PATTERNS) {
    const matches = text.match(re);
    if (!matches) continue;
    const pname = re.toString().replace(/\^|\$|\\/g, '');
    if (!patternStats[pname]) patternStats[pname] = 0;
    patternStats[pname] += matches.length;
    text = text.replace(re, replace);
  }

  if (text !== original) {
    changedChapters++;
    fs.writeFileSync(fp, text, 'utf-8');
  }
}

console.log('=== L1 Word + Pattern Fix Results ===');
console.log(`Total chapters scanned: ${totalChapters}`);
console.log(`Chapters changed: ${changedChapters}`);
console.log('');
console.log('L1 word replacements:');
let grandTotal = 0;
for (const [word, s] of Object.entries(stats)) {
  if (s.total > 0) {
    grandTotal += s.total;
    console.log(`  "${word}": ${s.total} replacements across ${s.chapters} chapters`);
  }
}
console.log(`  TOTAL L1 replacements: ${grandTotal}`);
console.log('');
console.log('Deadly pattern replacements:');
for (const [name, count] of Object.entries(patternStats)) {
  if (count > 0) console.log(`  ${name}: ${count}`);
}