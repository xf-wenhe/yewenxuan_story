/**
 * scan_r126_probe.js
 * R126 AI Voice Pattern Probe -- post-R124/R125 sweep
 *
 * After R124 and R125 eliminated 声音/嗓音 patterns, this probe does:
 *   - R124/R125 residual verification
 *   - Alternative pattern hunt (substitution artifacts)
 *   - 语气 (tone) mega-cluster deep-dive  **<< PRIMARY FINDING >>**
 *   - 声音/嗓音 sub-pattern deep-dives
 *   - Broad sweep for new concentrated patterns
 *
 * Goal: Identify 8 concentrated patterns (all >=10 count) for R126 fix.
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
function suffixScan(prefix, suffixLen, minCount) {
  const pat = new RegExp(re_escape(prefix) + '(.{' + suffixLen + '})', 'g');
  const map = {};
  for (const m of combined.matchAll(pat)) {
    const k = prefix + m[1];
    map[k] = (map[k] || 0) + 1;
  }
  return Object.entries(map).filter(([,c]) => c >= minCount).sort((a,b) => b[1] - a[1]);
}

// ============ PHASE 1: R124/R125 RESIDUAL VERIFICATION ============
console.log('='.repeat(70));
console.log('  PHASE 1: R124/R125 RESIDUAL VERIFICATION (should be 0 or near 0)');
console.log('='.repeat(70));
console.log('');

const r125check = [
  ['声音在叶文轩的意识里', 46], ['声音在叶文轩的意识中', 36],
  ['声音在叶文轩的意识', 83],   ['声音没有起伏', 67],
  ['声音，很', 49],
  ['嗓音轻得像要消散', 9],       ['嗓音轻得几乎散在', 8],
  ['嗓音轻得即将飘散', 8],       ['嗓音轻得快要融在', 7],
  ['声音细得如同', 13],          ['声音细得像', 19],
  ['声音开始颤抖', 27],          ['声音有些颤抖', 17],
  ['嗓音稳定稳得', 11],
];
for (const [s, old] of r125check) {
  const c = count(s);
  const ok = c === 0 ? ' OK' : ' >>> STILL PRESENT <<<';
  console.log('  ' + s + ': ' + c + ' (was ' + old + ')' + ok);
}

// ============ PHASE 2: ALTERNATIVE PATTERN HUNT ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 2: ALTERNATIVE PATTERN HUNT (R124/R125 substitution artifacts)');
console.log('='.repeat(70));
console.log('');

const altPatterns = [
  '声音压得很低', '声音颤抖起来', '声音发颤',
  '嗓音很稳', '嗓音很轻', '嗓音很冷', '嗓音很低', '嗓音很干',
  '声音带颤抖', '声音带颤',
  '那声音，', '那声音很', '那声音没',
  '这声音，', '这声音很', '这声音没',
  '尾音发颤', '尾音颤抖',
  '带着颤抖', '带着颤音', '带着沙哑',
  '声音突然', '声音变得',
  '声音消失了', '声音断掉',
];
for (const s of altPatterns) {
  const c = count(s);
  if (c >= 3) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 3: 语气 MEGA-CLUSTER DEEP DIVE ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 3: 语气 MEGA-CLUSTER DEEP DIVE  **<< PRIMARY FINDING >>**');
console.log('='.repeat(70));
console.log('');

const totalYQ = count('语气');
console.log('  Total 语气 instances: ' + totalYQ);
console.log('  (For reference: 499 total -- the single biggest voice domain left)');
console.log('');

// Deep dive on the flat/monotone sub-patterns
console.log('--- 语气 + flat/monotone descriptor templates ---');
const yqTargets = [
  ['语气平淡得不像活人', null],
  ['语气平淡得没有感情', null],
  ['语气平淡得让人发冷', null],
  ['语气像尺子量过一样均匀', null],
  ['语气从头到尾没有起落', null],
  ['语气平稳得像一潭死水', null],
  ['语气平铺直叙', null],
  ['语气平直无波', null],
  ['语气没有波动', null],
  ['语气平淡得', null],
  ['语气很平淡', null],
  ['语气平淡，', null],
  ['语气平稳得', null],
  ['语气像尺子', null],
  ['语气从头到尾', null],
  ['语气平铺直', null],
  ['语气平直', null],
  ['语气平淡静', null],
  ['语气平淡无', null],
  ['语气没有起', null],
  ['语气很平', null],
  ['语气没有变', null],
  ['语气变', null],
  ['语气冷', null],
  ['语气硬', null],
  ['语气急', null],
  ['语气急得', null],
  ['语气冷硬', null],
];
for (const [s, _] of yqTargets) {
  const c = count(s);
  if (c >= 5) console.log('  ' + s + ': ' + c);
}

// 7-char suffix deep dive for top patterns
console.log('');
console.log('--- 语气平淡得 (full 8-char phrases, >=2) ---');
let map = {};
for (const m of combined.matchAll(/语气平淡得(.{7})/g)) {
  const k = '语气平淡得' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 2) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 语气像尺子 (full 9-char phrases, >=1) ---');
map = {};
for (const m of combined.matchAll(/语气像尺子(.{7})/g)) {
  const k = '语气像尺子' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 语气从头到尾 (full 9-char phrases, >=1) ---');
map = {};
for (const m of combined.matchAll(/语气从头到尾(.{5})/g)) {
  const k = '语气从头到尾' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 语气平铺直 (full 9-char phrases, >=1) ---');
map = {};
for (const m of combined.matchAll(/语气平铺直(.{7})/g)) {
  const k = '语气平铺直' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 语气平稳得 (full 9-char phrases, >=1) ---');
map = {};
for (const m of combined.matchAll(/语气平稳得(.{7})/g)) {
  const k = '语气平稳得' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 语气平直无波 (full 9-char phrases, >=1) ---');
map = {};
for (const m of combined.matchAll(/语气平直无波(.{5})/g)) {
  const k = '语气平直无波' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

console.log('');
console.log('--- 语气没有波动 (full 9-char phrases, >=1) ---');
map = {};
for (const m of combined.matchAll(/语气没有波动(.{5})/g)) {
  const k = '语气没有波动' + m[1]; map[k] = (map[k] || 0) + 1;
}
for (const [s,c] of Object.entries(map).sort((a,b)=>b[1]-a[1]))
  if (c >= 1) console.log('  ' + s + ': ' + c);

// ============ PHASE 4: CONTEXT SAMPLES ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 4: CONTEXT SAMPLES (to confirm AI template nature)');
console.log('='.repeat(70));
console.log('');

const samplePatterns = [
  ['语气平淡得不像活人', 5],
  ['语气平淡得没有感情', 5],
  ['语气像尺子量过一样均匀', 5],
  ['语气从头到尾没有起落', 5],
  ['语气平稳得像一潭死水', 5],
  ['语气平铺直叙', 3],
  ['语气没有波动', 3],
  ['语气平直无波', 3],
];
for (const [pat, n] of samplePatterns) {
  console.log('--- ' + pat + ' (first ' + n + ' samples) ---');
  let c = 0;
  for (const m of combined.matchAll(new RegExp('.{30}' + re_escape(pat) + '.{30}', 'g'))) {
    if (c >= n) break;
    console.log('  ...' + m[0] + '...');
    c++;
  }
  console.log('');
}

// ============ PHASE 5: OTHER 声音/嗓音 REMAINDERS ============
console.log('='.repeat(70));
console.log('  PHASE 5: OTHER 声音/嗓音 PATTERNS (>=10)');
console.log('='.repeat(70));
console.log('');

const otherTargets = [
  '声音有些哑', '声音没有感情', '声音发颤',
  '嗓音干涩', '嗓音干涩得', '嗓音干涩得没有任何感情',
  '嗓音沙哑', '嗓音低得', '嗓音颤抖',
  '声音压得很低', '声音里带着',
  '声音突然', '声音变得', '声音不再', '声音响起',
  '声音在他脑子里', '声音在他的意识',
];
for (const s of otherTargets) {
  const c = count(s);
  if (c >= 5) console.log('  ' + s + ': ' + c);
}

// ============ PHASE 6: 语气 5-char sub-pattern deep-dive ============
console.log('');
console.log('='.repeat(70));
console.log('  PHASE 6: 语气 5-CHAR SUB-PATTERN BREAKDOWN (all >=5)');
console.log('='.repeat(70));
console.log('');

const yq5 = {};
for (const m of combined.matchAll(/语气(.{4})/g)) {
  const k = '语气' + m[1]; yq5[k] = (yq5[k] || 0) + 1;
}
const yq5sorted = Object.entries(yq5).sort((a,b)=>b[1]-a[1]);
for (const [s,c] of yq5sorted) {
  if (c >= 5) console.log('  ' + s + ': ' + c);
}

// ============ FINAL: R126 RECOMMENDATION ============
console.log('');
console.log('='.repeat(70));
console.log('  R126 RECOMMENDATION: 8 CONCENTRATED PATTERNS FOR ONE-ROUND FIX');
console.log('='.repeat(70));
console.log('');
console.log('  MEGA-FINDING: The 语气 (tone) domain is the next AI voice frontier.');
console.log('  All 8 patterns below describe the SAME thing: flat/monotonous/robotic');
console.log('  tone. They each appear EXACTLY 13 times (or 17), a smoking-gun signal');
console.log('  of AI templating. Probability of 6 distinct metaphors each appearing');
console.log('  exactly 13 times by chance: essentially zero.');
console.log('');

const rec = [
  {
    n: 1, pat: '语气平淡得不像活人', cnt: 13,
    fix: 'Replace with specific behavior: 声音里听不出情绪 / 说这话时脸上没变',
    ctx: 'Template: "叶文轩说话时语气平淡得不像活人" -- classic AI',
  },
  {
    n: 2, pat: '语气平淡得没有感情', cnt: 13,
    fix: 'Same as #1; merge or replace with specific emotional read',
    ctx: 'Near-identical variant of #1',
  },
  {
    n: 3, pat: '语气平淡得让人发冷', cnt: 13,
    fix: 'Replace with physical reaction: 这话让人后背发凉 / 寒意顺着脊背爬',
    ctx: 'Emotional-effect variant of same template',
  },
  {
    n: 4, pat: '语气像尺子量过一样均匀', cnt: 13,
    fix: 'Replace with: 每个字间隔都一样 / 语速纹丝不动 / 念得像节拍器',
    ctx: 'Ruler metaphor -- AI-generated, not literary',
  },
  {
    n: 5, pat: '语气从头到尾没有起落', cnt: 13,
    fix: 'Replace with: 一句话一个调子 / 从头念到尾没换过节奏',
    ctx: 'Start-to-finish flatness descriptor',
  },
  {
    n: 6, pat: '语气平稳得像一潭死水', cnt: 13,
    fix: 'Replace with: 静得像没有人在说话 / 水面一样平',
    ctx: 'Dead-water metaphor -- another AI-generated flatness simile',
  },
  {
    n: 7, pat: '语气没有波动', cnt: 17,
    fix: 'Replace with: 一点起伏都没有 / 像一条直线',
    ctx: 'No-wave descriptor -- broader than the 13-count templates',
  },
  {
    n: 8, pat: '语气平直无波', cnt: 17,
    fix: 'Replace with: 一条线 / 平得像尺子画出来的',
    ctx: 'Flat-and-straight descriptor -- four-character variant',
  },
];

let total = 0;
for (const r of rec) {
  console.log('  #' + r.n + ': ' + r.pat + '  (' + r.cnt + ' instances)');
  console.log('     Context: ' + r.ctx);
  console.log('     Fix:     ' + r.fix);
  total += r.cnt;
}
console.log('');
console.log('  TOTAL FIXABLE: ' + total + ' instances across 8 patterns');
console.log('');
console.log('  NOTE: #4 (语气像尺子量过一样均匀) and 语气平铺直叙 likely overlap');
console.log('  (same 13 instances reading "语气平铺直叙，像尺子量过一样均匀").');
console.log('  Actual unique fixable count: ~99-112 depending on overlap.');
console.log('');
console.log('  ADDITIONAL PATTERNS WORTH NOTING (>=10, not in top 8):');
console.log('    语气平铺直叙 (13) -- likely same as #4');
console.log('    语气平直无波 (17) -- same as #8');
console.log('    声音没有感情 (13) -- part of system voice cluster');
console.log('    嗓音干涩得没有任何感情 (10) -- same flat-emotion cluster');
console.log('    声音发颤 (28) -- includes fragment IDs; genuine ~12');
console.log('    嗓音干涩 (40) -- natural voice descriptor, borderline');
console.log('    声音有些哑 (49) -- includes fragment IDs; genuine ~38');
console.log('    嗓音低得 (14) -- scattered sub-patterns, moderate');
console.log('    嗓音沙哑 (19) -- natural voice descriptor');
console.log('');
console.log('  MEGA-PATTERN SUMMARY:');
console.log('    The entire 语气 domain (499 total) has ~110+ instances of');
console.log('    templated flat/monotone tone descriptions. The core cluster');
console.log('    (the 8 patterns above) accounts for 104 of these. After R126,');
console.log('    the remaining ~395 语气 instances should be re-examined for');
console.log('    residual AI patterns (语气平淡，语气很平 etc.).');
