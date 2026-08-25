const fs = require('fs');
const path = require('path');

const ROOT = 'D:/work/yewenxuan_story/chapters';
const volumes = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

// Collect all chapter files
let files = [];
for (const v of volumes) {
  const dir = path.join(ROOT, v);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.md')) files.push(path.join(dir, f));
  }
}
files.sort();

// Load all text into memory with filename
let entries = [];
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  entries.push({ f, content });
}

// Patterns to scan — grouped by theme
const patternGroups = {
  'sound_flat_tone': [
    '声音有些', '声音没有', '声音很轻', '声音变得', '声音发抖',
    '声音微抖', '声音颤动', '声音颤抖', '声音震动', '声音抖动',
    '声音颤起来', '声音微微颤动', '声音平直无波'
  ],
  'tone_voice_tone': [
    '语气里', '语气平稳', '语气冷静', '语气冷硬', '语气平直',
    '语气机械', '语气刻板', '语气像念稿', '语气毫无生气', '语气僵',
    '语气平而直', '语气平而', '语气毫无变化', '语气毫无波澜'
  ],
  'throat_hoarse': [
    '嗓音低', '嗓音沙哑', '嗓音嘶哑', '嗓音带哑', '嗓音发暗',
    '嗓音暗哑', '嗓音喑哑', '嗓音低沉而哑', '嗓音带暗哑', '嗓音闷哑',
    '嗓音粗涩', '嗓音发涩', '嗓音带涩', '嗓音沙涩', '嗓音涩哑',
    '嗓音发哑', '嗓音发涩', '嗓音干涩', '嗓音砂', '嗓音干',
    '嗓音低沉', '嗓音低得', '嗓音低得几乎听不见', '嗓音低到极致',
    '嗓音一色到底', '嗓音单调而平稳', '嗓音颤抖'
  ],
  'opening_monotone': [
    '开口毫无', '开口平淡', '开口平淡无奇', '开口一成不变',
    '开口完全没变', '开口毫无起伏', '开口毫无变化', '开口毫无波澜'
  ]
};

function countInText(text, pattern) {
  // Use a simple approach: find all occurrences
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf(pattern, idx)) !== -1) {
    count++;
    idx += pattern.length;
  }
  return count;
}

const allPatterns = [];
for (const [group, pats] of Object.entries(patternGroups)) {
  for (const p of pats) allPatterns.push({ group, pattern: p });
}

// Count each pattern across all files
const results = new Map(); // pattern -> { total, files: [filename, count] }
for (const { group, pattern } of allPatterns) {
  let total = 0;
  const fileHits = [];
  for (const { f, content } of entries) {
    const c = countInText(content, pattern);
    if (c > 0) {
      total += c;
      fileHits.push({ file: path.basename(f), count: c });
    }
  }
  results.set(pattern, { group, total, fileHits });
}

// Also deduplicate: some patterns are substrings of others.
// We'll report raw counts but note substring relationships.

// Print grouped results
console.log('=== R132 SCAN — AI VOICE PATTERNS ACROSS ALL 1000 CHAPTERS ===\n');

for (const [group, pats] of Object.entries(patternGroups)) {
  console.log(`--- ${group} ---`);
  const sorted = pats.filter(p => results.has(p)).sort((a, b) => {
    const ca = (results.get(a) || {}).total || 0;
    const cb = (results.get(b) || {}).total || 0;
    return cb - ca;
  });
  for (const p of sorted) {
    const r = results.get(p);
    const top = r.fileHits.slice().sort((a, b) => b.count - a.count).slice(0, 3);
    const topStr = top.map(t => `${t.file}:${t.count}`).join(', ');
    console.log(`  "${p}" total=${r.total}  (top: ${topStr})`);
  }
  console.log();
}

// Highlight concentrated patterns (total >= 10)
console.log('=== CONCENTRATED PATTERNS (total >= 10) — candidate cleanup targets ===\n');
const concentrated = [];
for (const [pattern, r] of results) {
  if (r.total >= 10) concentrated.push({ pattern, ...r });
}
concentrated.sort((a, b) => b.total - a.total);
for (const c of concentrated) {
  const top = c.fileHits.slice().sort((a, b) => b.count - a.count).slice(0, 5);
  console.log(`  "${c.pattern}" total=${c.total}  [${c.group}]  top5: ${top.map(t => `${t.file}:${t.count}`).join(', ')}`);
}
console.log(`\nTotal concentrated patterns (>=10): ${concentrated.length}`);

// Sub-pattern analysis for ambiguous broad patterns
console.log('\n=== SUB-PATTERN DETAIL (top concentrated broad patterns) ===\n');

const broadCheck = ['声音有些', '声音没有', '声音变得', '嗓音低', '语气里'];
for (const bp of broadCheck) {
  const r = results.get(bp);
  if (!r || r.total < 10) continue;
  console.log(`\n>> "${bp}" (total=${r.total}) — sample contexts:`);
  // Show some actual sentences containing this pattern
  const samples = [];
  for (const { f, content } of entries) {
    let idx = 0;
    let found = 0;
    while ((idx = content.indexOf(bp, idx)) !== -1 && found < 2) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(content.length, idx + bp.length + 40);
      const ctx = content.substring(start, end).replace(/\s/g, ' ');
      samples.push(`[${path.basename(f)}] ...${ctx}...`);
      found++;
      idx += bp.length;
    }
  }
  for (const s of samples.slice(0, 8)) console.log(`  ${s}`);
}

// Check for potential new artifacts from R130/R131 substitutions
console.log('\n=== POTENTIAL NEW ARTIFACTS (R130/R131 substitution candidates) ===\n');
const newCandidates = [
  '语气平稳', '语气冷静', '语气冷硬', '语气刻板', '语气像念稿',
  '语气毫无生气', '语气僵', '语气毫无变化', '语气毫无波澜',
  '嗓音嘶哑', '嗓音带哑', '嗓音发暗', '嗓音暗哑', '嗓音喑哑',
  '嗓音低沉而哑', '嗓音带暗哑', '嗓音闷哑',
  '嗓音粗涩', '嗓音带涩', '嗓音沙涩', '嗓音涩哑',
  '声音震动', '声音抖动', '声音颤起来', '声音微微颤动',
  '声音平直无波', '开口平淡无奇', '开口一成不变', '开口完全没变',
  '开口毫无起伏', '开口平淡', '嗓音低得几乎听不见', '嗓音低到极致',
  '声音发抖', '声音微抖'
];
for (const p of newCandidates) {
  const r = results.get(p);
  if (r) {
    const top = r.fileHits.slice().sort((a, b) => b.count - a.count).slice(0, 3);
    console.log(`  "${p}" total=${r.total}  top3: ${top.map(t => `${t.file}:${t.count}`).join(', ')}`);
  }
}
