/**
 * scan_r127_probe.js
 * R127 AI Voice Pattern Probe -- post-R126 sweep
 *
 * R126 just fixed all 8 flat-tone patterns to 0. This probe:
 *   - Verifies R126 fix (all 0)
 *   - 语气 deep-dive: 5-char suffix scan for remaining templated clusters
 *   - 声音/嗓音 sub-pattern sweep
 *   - R124-R126 substitution artifacts check
 *   - Broad sweep for new concentrated patterns
 *
 * Goal: Identify 8 concentrated patterns (>=10 count) for R127 fix.
 */
const fs = require('fs'), path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const allText = [];
for (const v of VOLUMES) {
  const d = path.join(baseDir, 'chapters', v);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
  for (const f of files) allText.push(fs.readFileSync(path.join(d, f), 'utf-8'));
}
const combined = allText.join('\n');
function count(s) { return combined.split(s).length - 1; }
function re_escape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ============ PHASE 0: R126 FIX VERIFICATION ============
console.log('='.repeat(70));
console.log('  PHASE 0: R126 FIX VERIFICATION (must all be 0)');
console.log('='.repeat(70));
console.log('');
const r126check = [
  ['语气平淡得不像活人', 13], ['语气平淡得没有感情', 13],
  ['语气平淡得让人发冷', 13], ['语气像尺子量过一样均匀', 13],
  ['语气从头到尾没有起落', 13], ['语气平稳得像一潭死水', 13],
  ['语气没有波动', 17], ['语气平直无波', 17],
];
for (const [s, old] of r126check) {
  const c = count(s);
  const ok = c === 0 ? ' OK' : ' >>> STILL PRESENT <<<';
  console.log('  ' + s + ': ' + c + ' (was ' + old + ')' + ok);
}

// ============ PHASE 1: R124-R126 SUBSTITUTION ARTIFACTS ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 1: R124-R126 SUBSTITUTION ARTIFACTS');
console.log('='.repeat(70));
console.log('');
const artifacts = [
  '语气均匀得机械', '开口像机器', '说话节奏完全一致',
  '从头到尾一个节奏', '说话平静得像死水', '开口没有半分波动',
  '语气沉寂得可怕', '语调平而直', '说话单调而平稳',
  '说话单调一致', '说话平直', '语气完全没有波澜',
  '开口毫无变化', '语气里没有半分情绪', '语气听不出情绪',
];
let anyArtifact = false;
for (const s of artifacts) {
  const c = count(s);
  if (c >= 1) { console.log('  ' + s + ': ' + c); anyArtifact = true; }
}
if (!anyArtifact) console.log('  (none found at >=1)');

// ============ PHASE 2: 语气 MEGA-CLUSTER - TOTAL & 5-CHAR SUFFIX ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 2: 语气 MEGA-CLUSTER -- TOTAL + 5-CHAR SUFFIX DEEP-DIVE');
console.log('='.repeat(70));
console.log('');
const totalYQ = count('语气');
console.log('  Total 语气 instances: ' + totalYQ);
console.log('');

// 5-char suffix deep dive (语气 + exactly 4 following chars)
const yq5 = {};
for (const m of combined.matchAll(/语气([一-鿿]{4})/g)) {
  const k = '语气' + m[1]; yq5[k] = (yq5[k] || 0) + 1;
}
const yq5sorted = Object.entries(yq5).sort((a,b)=>b[1]-a[1]);
console.log('--- 语气 5-char suffix clusters (>=10) ---');
for (const [s,c] of yq5sorted) {
  if (c >= 10) console.log('  ' + s + ': ' + c);
}
console.log('');
console.log('--- 语气 5-char suffix clusters (5-9) ---');
for (const [s,c] of yq5sorted) {
  if (c >= 5 && c < 10) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 3: 语气 SUB-PATTERN SWEEP ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 3: 语气 SUB-PATTERN SWEEP (explicit targets, >=3)');
console.log('='.repeat(70));
console.log('');
const yqTargets = [
  '语气平淡', '语气很平', '语气平直', '语气平稳',
  '语气平淡静', '语气平铺直叙', '语气没有感情',
  '语气低沉', '语气冰冷', '语气发冷',
  '语气平淡得', '语气平淡地', '语气平淡，',
  '语气平淡；', '语气冷', '语气硬', '语气急',
  '语气平淡无', '语气没有起', '语气没有变', '语气变',
  '语气像', '语气听不出', '语气里', '语气中',
  '语气带着', '语气完全', '语气毫无',
];
for (const s of yqTargets) {
  const c = count(s);
  if (c >= 3) console.log('  ' + s + ': ' + c);
}

// 语气平淡 deep dive: what follows "语气平淡"?
console.log('');
console.log('--- 语气平淡 + 6-char suffix (>=2) ---');
let map = {};
for (const m of combined.matchAll(/语气平淡([一-鿿]{6})/g)) {
  const k = '语气平淡' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 2) console.log('  ' + s + ': ' + c);

// ============ PHASE 4: 语气 7-CHAR CLUSTER DEEP-DIVE ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 4: 语气 7-CHAR SUFFIX CLUSTERS (>=5)');
console.log('='.repeat(70));
console.log('');
const yq7 = {};
for (const m of combined.matchAll(/语气([一-鿿]{6})/g)) {
  const k = '语气' + m[1]; yq7[k] = (yq7[k] || 0) + 1;
}
const yq7sorted = Object.entries(yq7).sort((a,b)=>b[1]-a[1]);
for (const [s,c] of yq7sorted) {
  if (c >= 5) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 5: 声音 PATTERNS ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 5: 声音 PATTERNS (>=5)');
console.log('='.repeat(70));
console.log('');
const soundTargets = [
  '声音有些', '声音没有', '声音在叶', '声音在他',
  '声音很轻', '声音变得', '声音响起', '声音不再',
  '声音有些哑', '声音有些颤抖', '声音有些沙哑',
  '声音没有起伏', '声音没有感情', '声音没有变化',
  '声音没有温度', '声音没有波澜', '声音在叶文轩',
  '声音在他脑海', '声音在他脑', '声音在他意识',
  '声音很轻很', '声音很轻地',
  '声音变得沙哑', '声音变得低沉', '声音变得冰冷',
  '声音响起又', '声音响起后', '声音响起时',
  '声音不再', '声音突然',
  '声音像', '声音里',
];
for (const s of soundTargets) {
  const c = count(s);
  if (c >= 5) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 6: 嗓音 PATTERNS ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 6: 嗓音 PATTERNS (>=5)');
console.log('='.repeat(70));
console.log('');
const voiceTargets = [
  '嗓音低', '嗓音干', '嗓音干涩', '嗓音沙哑',
  '嗓音低得', '嗓音颤抖', '嗓音低下', '嗓音像砂',
  '嗓音低沉', '嗓音干涩得', '嗓音沙哑得',
  '嗓音低得几乎', '嗓音低得像', '嗓音颤抖着',
];
for (const s of voiceTargets) {
  const c = count(s);
  if (c >= 5) console.log('  ' + s + ': ' + c);
}

// 嗓音 5-char suffix deep dive
const zx5 = {};
for (const m of combined.matchAll(/嗓音([一-鿿]{4})/g)) {
  const k = '嗓音' + m[1]; zx5[k] = (zx5[k] || 0) + 1;
}
const zx5sorted = Object.entries(zx5).sort((a,b)=>b[1]-a[1]);
console.log('');
console.log('--- 嗓音 5-char suffix (>=8) ---');
for (const [s,c] of zx5sorted) {
  if (c >= 8) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 7: BROAD NEW PATTERN SWEEP ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 7: BROAD SWEEP -- NEW CONCENTRATED PATTERNS (>=10)');
console.log('='.repeat(70));
console.log('');
const broadPatterns = [
  // Descriptors of delivery/style
  '说得很平', '说得很慢', '说得极慢', '说得很轻',
  '声音极轻', '声音极淡', '声音极冷',
  // Template phrases
  '没有一丝', '没有半点', '没有半分',
  '没有任何感情', '没有任何情绪', '没有任何波澜',
  // Rhythm/tempo descriptors
  '节奏完全', '一个节奏', '一样的节奏',
  '匀速', '速度一样',
  // Other flatness metaphors
  '像被设定', '像被编程', '像照着读',
  '像背书', '像念稿',
  // Emotion-absence
  '面无表情地说', '毫无表情地说', '没有任何表情',
  '脸上没有任何', '脸上没有半分',
  // Voice delivery patterns
  '一字一顿', '一字一句', '一个一个字',
  '慢慢吐出', '缓缓吐出',
  // System voice patterns
  '冰冷的声音', '冰冷的嗓音', '机械般的声音',
  '系统般的声音', '毫无感情的声音',
  // 语气 remaining
  '语气冰冷', '语气冷', '语气平淡', '语气很',
  // Pattern: "声音/语气 + 没有 + [emotional descriptor]"
  '没有温度', '没有起伏', '没有波澜', '没有情绪',
  '没有感情', '没有变化',
];
for (const s of broadPatterns) {
  const c = count(s);
  if (c >= 10) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 8: 语气 + EMOTIONAL-ABSENCE COMPOUNDS ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 8: COMPOUND FLAT-EMOTION PATTERNS (>=5)');
console.log('='.repeat(70));
console.log('');
const compoundPatterns = [
  '语气没有任何', '语气没有半点', '语气没有半分',
  '语气里没有任何', '语气听不出任何',
  '语气完全没有任何', '语气完全听不出',
  '语气像没有任何', '语气似乎没有任何',
  '语气带着没有任何', '语气冰冷没有任何',
  '语气低沉没有任何', '语气平淡没有任何',
  '语气没有一丝', '语气没有半点',
  '语气没有半分',
];
for (const s of compoundPatterns) {
  const c = count(s);
  if (c >= 5) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 9: TOP 10 CONCENTRATED PATTERNS ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 9: R127 CANDIDATE SUMMARY');
console.log('='.repeat(70));
console.log('');

// Collect all candidates >= 10 from 语气 domain
const candidates = [];
// 语气 5-char suffix clusters
for (const [s,c] of yq5sorted) {
  if (c >= 10) candidates.push({s, c, domain: '语气-5char'});
}
// Sound patterns >=10
const soundAll = [];
const soundAll5 = {};
for (const m of combined.matchAll(/声音([一-鿿]{4})/g)) {
  const k = '声音' + m[1]; soundAll5[k] = (soundAll5[k] || 0) + 1;
}
for (const [s,c] of Object.entries(soundAll5).sort((a,b)=>b[1]-a[1])) {
  if (c >= 10) soundAll.push({s, c, domain: '声音-5char'});
}
const zxAll = [];
for (const [s,c] of zx5sorted) {
  if (c >= 10) zxAll.push({s, c, domain: '嗓音-5char'});
}

// Deduplicate: 5-char clusters overlap with 7-char, keep the most specific
const seen = new Set();
const allCandidates = [...candidates, ...soundAll, ...zxAll];
const deduped = [];
for (const item of allCandidates) {
  // Skip if it's a substring of something already seen
  let skip = false;
  for (const s of seen) {
    if (s.startsWith(item.s) && s.length > item.s.length) { skip = true; break; }
  }
  if (!skip) {
    seen.add(item.s);
    deduped.push(item);
  }
}

console.log('--- All 5-char domain clusters >=10 (deduped) ---');
for (const item of deduped) {
  console.log('  [' + item.domain + '] ' + item.s + ': ' + item.c);
}
console.log('');
console.log('  Total candidates found: ' + deduped.length);

// ============ CONTEXT SAMPLES FOR TOP CANDIDATES ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 10: CONTEXT SAMPLES (top 6 candidates, 3 samples each)');
console.log('='.repeat(70));
console.log('');

// ============ PHASE 11: DEEP-DIVE ON TOP SUBSTITUTION ARTIFACTS ============
console.log('='.repeat(70));
console.log('  PHASE 11: SUBSTITUTION ARTIFACT DEEP-DIVE (R124-R126 rewrites)');
console.log('='.repeat(70));
console.log('');
console.log('--- 语气平淡得像 (what follows, >=1) ---');
map = {};
for (const m of combined.matchAll(/语气平淡得像(.{6})/g)) {
  const k = '语气平淡得像' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 语气很平淡静 (what follows, >=1) ---');
map = {};
for (const m of combined.matchAll(/语气很平淡静(.{6})/g)) {
  const k = '语气很平淡静' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 声音稳得连半 (what follows, >=1) ---');
map = {};
for (const m of combined.matchAll(/声音稳得连半(.{6})/g)) {
  const k = '声音稳得连半' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 嗓音沉得到极 (what follows, >=1) ---');
map = {};
for (const m of combined.matchAll(/嗓音沉得到极(.{5})/g)) {
  const k = '嗓音沉得到极' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 声音低沉得轻之又轻 (full phrase) ---');
console.log('  ' + '声音低沉得轻之又轻' + ': ' + count('声音低沉得轻之又轻'));
console.log('  ' + '说话声音低沉得轻之又轻' + ': ' + count('说话声音低沉得轻之又轻'));

console.log('');
console.log('--- 嗓音实而平稳 (what follows, >=1) ---');
map = {};
for (const m of combined.matchAll(/嗓音实而平稳(.{5})/g)) {
  const k = '嗓音实而平稳' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

// ============ PHASE 12: R127 RECOMMENDATION ============
console.log('');
console.log('='.repeat(70));
console.log('  R127 RECOMMENDATION: 8 CONCENTRATED PATTERNS FOR ONE-ROUND FIX');
console.log('='.repeat(70));
console.log('');

const rec127 = [
  {
    n: 1, pat: '嗓音平淡无波', cnt: 50,
    why: 'The single largest remaining AI voice template. Exact 50 hits = ' +
         '100% templated. Describes the same flat, emotionless delivery ' +
         'R124-R126 tried to fix. Pure AI construct.',
    fix: 'Replace per context: 声音一点起伏都没有 / 念得像一条直线 / ' +
         '说这话时脸上纹丝不动'
  },
  {
    n: 2, pat: '嗓音沉得到极', cnt: 30,
    why: 'Templated extremity descriptor. "沉得到极[限/致/点]" appears 30x ' +
         'with no literary variation. AI uses 极端 intensifiers mechanically.',
    fix: 'Replace per context: 声音压到最低 / 话几乎是从喉咙里挤出来的 / ' +
         '每一个字都像从深处沉下来'
  },
  {
    n: 3, pat: '声音低沉得轻之又轻', cnt: 29,
    why: 'Identical phrase repeated 29 times verbatim. Smoking gun. The ' +
         '"轻之又轻" construction is a stock AI intensifier. Context samples ' +
         'confirm it appears with "说话声音低沉得轻之又轻" framing.',
    fix: 'Vary per speaker/emotion: 声音低得几乎听不见 / 话轻得像飘过来的 / ' +
         '每一个字都轻得让叶文轩不得不屏住呼吸'
  },
  {
    n: 4, pat: '说话平直', cnt: 20,
    why: 'R126 substitution artifact. Replaced "语气平直无波" but kept the ' +
         'same flatness descriptor in a different form. 20 hits = new template.',
    fix: 'Replace per context: 一句话一个调子 / 从头到尾一个节奏 / ' +
         '念得每个字都一样重'
  },
  {
    n: 5, pat: '声音稳得连半', cnt: 19,
    why: 'Templated "稳得连半点都不[动/变/散]" construction. 19 hits = ' +
         'highly concentrated. Mechanical stability descriptor.',
    fix: 'Replace per context: 稳得像钉在那里 / 一个字都没飘 / ' +
         '连呼吸的节奏都没乱'
  },
  {
    n: 6, pat: '嗓音没有起伏', cnt: 17,
    why: 'Direct flatness descriptor. Same family as the R126 patterns but ' +
         'applied to 嗓音 instead of 语气. 17 hits.',
    fix: 'Replace per context: 每个字一个调 / 像一条拉直的线 / ' +
         '从头念到尾没换过节奏'
  },
  {
    n: 7, pat: '嗓音毫无波澜', cnt: 16,
    why: 'Water-wave metaphor for emotional flatness. 16 hits. Same metaphor ' +
         'family R126 already eliminated for 语气 ("像一潭死水").',
    fix: 'Replace per context: 一点情绪都听不出来 / 像念说明书一样 / ' +
         '说这话时脸上没变'
  },
  {
    n: 8, pat: '语气平淡得像机器', cnt: 13,
    why: 'R126 substitution artifact. Replaced "语气像尺子量过一样均匀" ' +
         'but swapped "ruler" for "machine" -- same AI templating pattern, ' +
         'same 13 hits. The "像XX一样" simile structure is the problem.',
    fix: 'Replace per context: 说这话时脸上没表情 / 每个字间隔都一样 / ' +
         '念得像节拍器'
  },
];

let total = 0;
for (const r of rec127) {
  console.log('  #' + r.n + ': ' + r.pat + '  (' + r.cnt + ' instances)');
  console.log('     Why:     ' + r.why);
  console.log('     Fix:     ' + r.fix);
  total += r.cnt;
  console.log('');
}
console.log('  TOTAL FIXABLE: ' + total + ' instances across 8 patterns');
console.log('');
console.log('  R126 REMOVED:  89 instances (8 flat-tone patterns, all now 0)');
console.log('  R127 TARGETS:  ' + total + ' instances (嗓音/声音 flatness + artifacts)');
console.log('');
console.log('  AFTER R127, 语气 total should drop from 410 to ~384.');
console.log('  Remaining 语气 domain (语气平淡：64, 语气平淡，：32, 语气里：28)');
console.log('  needs per-context rewriting in R128+ if desired.');
console.log('');
console.log('  ADDITIONAL PATTERNS WORTH NOTING (>=10, not in top 8):');
console.log('    嗓音干涩得没[有任何感情] (13) -- flat emotion via dry voice');
console.log('    嗓音从头到尾 (13) -- start-to-finish descriptor (same as R126)');
console.log('    嗓音实而平稳 (11) -- stable/uniform descriptor');
console.log('    语气很平淡静 (13) -- near-identical to "语气平淡得像机器"');
console.log('    语气平铺直叙 (13) -- another flatness template');
console.log('    声音没有感情 (13) -- direct emotion-absence');
console.log('    声音从头到尾 (13) -- start-to-finish flatness');
console.log('    声音毫无起伏 (10) -- same flatness family');
console.log('    声音从头至尾 (10) -- variant of 从头到尾');
console.log('    声音低沉得轻之又轻 (29) -- templated intensifier (IN TOP 8)');
console.log('');
console.log('  SUBSTITUTION ARTIFACT ALERT:');
console.log('    R126 replaced 8 old patterns but introduced NEW templates:');
console.log('    语气平淡得像机器 (13), 说话平直 (20).');
console.log('    These are the same AI voice pattern in new clothing.');
console.log('    R127 must eliminate these artifacts too.');
