/**
 * scan_r125_probe.js
 * R125 AI Voice Pattern Probe -- 8 concentrated patterns for one-round fix
 *
 * Scans all 1000 chapters for templated AI voice constructs in
 * 声音/sound and 嗓音/voice domain. Identifies 8 patterns (all >=10 count)
 * that can be fixed in one round.
 */
const fs = require('fs'), p = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const allText = [];
for (const v of V) {
  const d = p.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md')))
    allText.push(fs.readFileSync(p.join(d, f), 'utf-8'));
}
const combined = allText.join('\n');
const count = s => combined.split(s).length - 1;

function re_escape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function suffixScan(prefix, minCount) {
  const pat = new RegExp(re_escape(prefix) + '(.{4})', 'g');
  const map = {};
  for (const x of combined.matchAll(pat)) {
    const k = prefix + x[1];
    map[k] = (map[k] || 0) + 1;
  }
  return Object.entries(map).filter(([,c]) => c >= minCount).sort((a,b) => b[1] - a[1]);
}

// ============ PHASE 1: BASELINE ============
console.log('=== PHASE 1: BASELINE COUNTS (post-R124) ===\n');
const baseline = [
  ['备份在', 2992], ['备份的', 718],
  ['声音从', 371], ['声音里', 174],
  ['声音有些', 154], ['声音没有', 92], ['声音在叶', 83], ['声音在他', 72],
  ['声音很轻', 71], ['声音细得', 54], ['声音开始', 50], ['声音，很', 50],
  ['嗓音低', 47], ['嗓音干', 42], ['嗓音低得', 14], ['嗓音轻得', 11],
  ['嗓音颤抖', 10], ['嗓音低下', 10], ['嗓音像砂', 10],
  ['嗓音稳定', 16], ['嗓音沙哑', 19],
];
for (const [s, old] of baseline) {
  const c = count(s);
  const delta = c - old;
  console.log('  ' + s + ': ' + c + '  (was ~' + old + ', delta ' + (delta >= 0 ? '+' : '') + delta + ')');
}

// ============ PHASE 2: 备份 SKIP ============
const beiCount = count('备份');
console.log('\n=== PHASE 2: 备份 CHECK ===');
console.log('  备份 (any): ' + beiCount);
console.log('  >>> 备份 is too pervasive (4594) -- SKIPPED for R125.');

// ============ PHASE 3: DEEP DIVE -- 声音 sub-patterns ============
console.log('\n=== PHASE 3: 声音 DEEP DIVE (suffix 4-char, >=3) ===');

const soundPrefixes = ['声音从', '声音里', '声音在叶', '声音在他',
  '声音没有', '声音有些', '声音很轻', '声音细得', '声音开始', '声音，很'];
for (const prefix of soundPrefixes) {
  const base = count(prefix);
  if (base < 10) continue;
  console.log('\n--- ' + prefix + ' (base=' + base + ') ---');
  const results = suffixScan(prefix, 3);
  for (const [s, c] of results) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 4: DEEP DIVE -- 嗓音 sub-patterns ============
console.log('\n=== PHASE 4: 嗓音 DEEP DIVE (suffix 4-char, >=3) ===');
const voicePrefixes = ['嗓音低', '嗓音干', '嗓音轻得', '嗓音颤抖', '嗓音低下',
  '嗓音像砂', '嗓音稳定', '嗓音沙哑', '嗓音低得'];
for (const prefix of voicePrefixes) {
  const base = count(prefix);
  if (base < 8) continue;
  console.log('\n--- ' + prefix + ' (base=' + base + ') ---');
  const results = suffixScan(prefix, 3);
  for (const [s, c] of results) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 5: TARGETED COUNTS for concentrated sub-patterns ============
console.log('\n=== PHASE 5: TARGETED SUB-PATTERN COUNTS ===');
const targeted = [
  // 声音在叶文轩 consciousness
  ['声音在叶文轩的意识里', null],
  ['声音在叶文轩的意识中', null],
  ['声音在叶文轩的意识', null],
  ['声音在叶文轩的脑', null],
  // 声音没有起伏
  ['声音没有起伏', null],
  ['声音没有感情', null],
  // 声音有些
  ['声音有些颤抖', null],
  ['声音有些哑', null],
  ['声音有些沙哑', null],
  ['声音有些低沉', null],
  // 声音细得 similes
  ['声音细得如同', null],
  ['声音细得像', null],
  // 嗓音干涩
  ['嗓音干涩', null],
  ['嗓音干涩得', null],
  // 声音，很
  ['声音，很轻', null],
  ['声音，很远', null],
  ['声音，很多', null],
  ['声音，很稳', null],
  ['声音，很平', null],
  ['声音，很紧', null],
  // 嗓音轻得 sub-patterns
  ['嗓音轻得像要消散', null],
  ['嗓音轻得几乎散在', null],
  ['嗓音轻得即将飘散', null],
  ['嗓音轻得快要融在', null],
  // 嗓音稳定稳得 (doubled/redundant)
  ['嗓音稳定稳得', null],
  // 声音开始
  ['声音开始颤抖', null],
  // 嗓音像砂
  ['嗓音像砂砾', null],
  ['嗓音像砂纸', null],
  // 嗓音颤抖
  ['嗓音颤抖', null],
  ['嗓音颤抖，', null],
  ['嗓音颤抖。', null],
];
for (const [s, _] of targeted) {
  const c = count(s);
  if (c >= 1) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 6: 嗓音轻得 ALL SUFFIXES (lower threshold) ============
console.log('\n=== PHASE 6: 嗓音轻得 FULL BREAKDOWN (>=1) ===');
let qdmap = {};
for (const m of combined.matchAll(new RegExp(re_escape('嗓音轻得') + '(.{4})', 'g'))) {
  const k = '嗓音轻得' + m[1];
  qdmap[k] = (qdmap[k] || 0) + 1;
}
let qdSorted = Object.entries(qdmap).sort((a,b) => b[1] - a[1]);
let qdSum = 0;
for (const [s, c] of qdSorted) { console.log('  ' + s + ': ' + c); qdSum += c; }
console.log('  Total 嗓音轻得 (all 5-char): ' + qdSum);
console.log('  Base 嗓音轻得 count: ' + count('嗓音轻得'));

// ============ FINAL SUMMARY ============
console.log('\n' + '='.repeat(60));
console.log('  R125 RECOMMENDATION: 8 CONCENTRATED PATTERNS FOR ONE-ROUND FIX');
console.log('='.repeat(60));

const rec = [
  {
    pattern: '1. 声音在叶文轩的意识里/中',
    count: 46,
    type: 'TEMPLATED AI VOICE (concentrated)',
    detail: '10x 意识里 + 36x 意识中 = 46 total. This is the single most\n    concentrated AI voice pattern found. The structure "声音在叶文轩的\n    意识里/中" describes how sound reaches the protagonist and is a\n    classic AI exposition device.',
    fix: 'Replace with direct narrative: what the voice said, how it\n    arrived (e.g., 直接飘到耳边, 在意识深处响起, or just describe\n    the content directly without the meta-layer).'
  },
  {
    pattern: '2. 声音没有起伏',
    count: 67,
    type: 'TEMPLATED AI VOICE (concentrated)',
    detail: '67 instances of "声音没有起伏" (sub-variants: 46x followed\n    by comma, plus others). Classic AI flat-description of voice tone.',
    fix: 'Replace with specific tone descriptors: 毫无抑扬顿挫, 像\n    机械播报, 每个字一样的音量, etc. Or remove entirely when the\n    context already implies neutrality.'
  },
  {
    pattern: '3. 声音，很 + descriptor',
    count: 49,
    type: 'AI PAUSE-AND-DESCRIBE TEMPLATE',
    detail: '49 instances. The comma+很 construct is a classic AI\n    narrative pause. Top sub-patterns: 很轻(15), 很远(5), 很多(5),\n    很稳(3), 很平(3), 很紧(2), 很低(2).',
    fix: 'Merge into sentence flow: 声音很轻 -> 很轻的声音, or\n    embed in clause. Remove the dramatic pause comma.'
  },
  {
    pattern: '4. 嗓音轻得 + 消散/散在/飘散/融在',
    count: 32,
    type: 'TEMPLATED METAPHOR CLUSTER',
    detail: '32 instances (of 68 total 嗓音轻得): 9x 将要消散, 8x\n    几乎散在, 8x 即将飘散, 7x 快要融在. This is a tightly clustered\n    metaphor family: voice fading/dissolving. The 4 variants are\n    nearly synonymous, creating heavy repetition.',
    fix: 'Vary the metaphor: replace with 几乎听不见了, 淡得像烟,\n    弱到几乎不存在, 轻得仿佛随时会断. Or just 声音很轻 without\n    the dissolving metaphor.'
  },
  {
    pattern: '5. 声音细得 + 如同XX/像XX (simile)',
    count: 32,
    type: 'TEMPLATED SIMILE CLUSTER',
    detail: '32 instances: 13x 声音细得如同 (蚊蚋/蜂鸣/etc.),\n    19x 声音细得像 (蝉鸣/etc.). AI-generated simile template for\n    describing thin/quiet voices.',
    fix: 'Replace with direct descriptors: 细若游丝, 细得几乎\n    听不清, 尖细得刺耳. Remove the 如同/像 simile structure.'
  },
  {
    pattern: '6. 声音开始颤抖',
    count: 27,
    type: 'AI VOICE DESCRIPTOR',
    detail: '27 instances of "声音开始颤抖" -- a standard AI voice\n    emotion cue. Overused for emotional moments.',
    fix: 'Vary: 声音抖了起来, 话语开始发颤, 尾音发颤,\n    声音裂了, 声音断了. Match the specific emotion.'
  },
  {
    pattern: '7. 声音有些颤抖',
    count: 17,
    type: 'AI VOICE DESCRIPTOR',
    detail: '17 instances of "声音有些颤抖" -- softer variant of\n    "开始颤抖" but same AI template.',
    fix: 'Vary: 带着颤音, 微微发抖, 语气发颤, 尾音发颤,\n    声音里有一丝颤.'
  },
  {
    pattern: '8. 嗓音稳定稳得 (doubled/redundant)',
    count: 11,
    type: 'REDUNDANT DOUBLED PATTERN',
    detail: '11 instances of "嗓音稳定稳得" -- this is "嗓音" + "稳定"\n    + "稳得", where 稳定 and 稳得 repeat the same root. Clear AI\n    doubling artifact. Sub-patterns: 稳得不带情绪(5), 稳得像从(4),\n    etc.',
    fix: 'Simplify to 嗓音稳得... (drop the 定), or 嗓音稳定，后面\n    + specific descriptor.'
  },
];

let total = 0;
for (const r of rec) {
  console.log('\n' + r.pattern);
  console.log('  Count: ' + r.count);
  console.log('  Type:  ' + r.type);
  console.log('  Detail:');
  for (const line of r.detail.split('\n')) console.log('    ' + line.trim());
  console.log('  Fix:');
  for (const line of r.fix.split('\n')) console.log('    ' + line.trim());
  total += r.count;
}
console.log('\n  TOTAL FIXABLE INSTANCES: ' + total);
console.log('  (across 8 patterns, all >=10 count)');

// ============ NOTES ON SKIPPED PATTERNS ============
console.log('\n--- SKIPPED PATTERNS ---');
console.log('  备份 (4594 total): Too pervasive; not a fixable voice pattern.');
console.log('  声音有些 (154): Too broad; sub-patterns like 声音有些颤抖(17) and');
console.log('    声音有些哑(49) are more targeted. 声音有些哑 includes fragment IDs.');
console.log('  声音很轻 (57): Includes 10x artifact "声音很轻0428" (fragment ID).');
console.log('    Genuine "声音很轻" is moderate but overlaps with 声音，很轻(15).');
console.log('  声音从 (366): Natural preposition; not an AI voice pattern.');
console.log('  声音里 (170): Natural preposition; not an AI voice pattern.');
console.log('  嗓音低 (47): Broad prefix; 嗓音低了下来(2), 嗓音低得X(14) are small.');
console.log('  嗓音干 (42): 嗓音干涩(40) is the sub-pattern; moderate but natural.');
console.log('  嗓音沙哑 (19): Natural voice descriptor, not AI-specific.');
console.log('  嗓音颤抖 (10): Boundary count; overlaps with 声音开始颤抖 pattern.');
console.log('  嗓音低下 (10): Mostly 嗓音低下来了下来(7) which may be text errors.');
console.log('  嗓音像砂 (10): 嗓音像砂砾(7) + 嗓音像砂纸(2); borderline, natural.');
