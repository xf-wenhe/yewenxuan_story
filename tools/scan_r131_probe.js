/**
 * scan_r131_probe.js — Honest scan of 1000 chapters for concentrated AI voice patterns.
 *
 * Round R131. All R120-R130 pools verified at 0 (fixed by prior rounds).
 *
 * Verified-zero sources from R130: 声音有些哑, 嗓音干涩, 嗓音像砂, 嗓音颤抖,
 *   嗓音低下, 开口毫无波澜, 嗓音一色到底, 嗓音单调而平稳
 *
 * This probe uses a QUICK scan to determine ACTUAL current counts, then
 * builds deep-dives on those with >= 10 hits. Honesty-first: if a pattern
 * counts to 5, it reports 5. No inflation.
 *
 * Usage: node tools/scan_r131_probe.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CHAPTERS_DIR = path.join(ROOT, 'chapters');

// ── helpers ──────────────────────────────────────────────────────────
function loadChapters() {
  const volumes = fs.readdirSync(CHAPTERS_DIR)
    .filter(f => /^volume-\d+$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));

  const chapters = [];
  for (const vol of volumes) {
    const dir = path.join(CHAPTERS_DIR, vol);
    fs.readdirSync(dir)
      .filter(f => /chapter-\d+-polished\.md$/.test(f))
      .sort()
      .forEach(f => chapters.push({
        path: path.join(dir, f),
        name: f,
        volume: vol,
        text: fs.readFileSync(path.join(dir, f), 'utf-8'),
      }));
  }
  return chapters;
}

function countFixed(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let idx = -1;
  while ((idx = text.indexOf(needle, idx + 1)) !== -1) count++;
  return count;
}

function extractSnippets(text, needle, maxSnippets = 2) {
  const snippets = [];
  let idx = -1;
  let taken = 0;
  while ((idx = text.indexOf(needle, idx + 1)) !== -1 && taken < maxSnippets) {
    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + needle.length + 30);
    snippets.push(text.substring(start, end).replace(/\s+/g, ' '));
    taken++;
  }
  return snippets;
}

// ── pattern registry ─────────────────────────────────────────────────
// kind: BROAD = 5-char anchor (many natural matches), SUB = specific sub-pattern,
//        ART = substitution artifact from R127-130, STRUCT = structural/positional
// exclude: true = skip from candidate selection (structural or known-natural)
const PATTERNS = [
  // ═══ BROAD anchors (for context; many are natural, reviewed below) ═══
  { id: 'BR-01', domain: '声音有些', label: '声音有些',        kind: 'BROAD',    exclude: false, m: t => countFixed(t, '声音有些') },
  { id: 'BR-02', domain: '声音没有', label: '声音没有',        kind: 'BROAD',    exclude: false, m: t => countFixed(t, '声音没有') },
  { id: 'BR-03', domain: '声音很轻', label: '声音很轻',        kind: 'BROAD',    exclude: false, m: t => countFixed(t, '声音很轻') },
  { id: 'BR-04', domain: '声音变得', label: '声音变得',        kind: 'BROAD',    exclude: false, m: t => countFixed(t, '声音变得') },
  { id: 'BR-05', domain: '声音在他', label: '声音在他',        kind: 'STRUCT',   exclude: true,   m: t => countFixed(t, '声音在他') },
  { id: 'BR-06', domain: '声音在叶', label: '声音在叶',        kind: 'STRUCT',   exclude: true,   m: t => countFixed(t, '声音在叶') },
  { id: 'BR-07', domain: '嗓音低',   label: '嗓音低',          kind: 'BROAD',    exclude: false, m: t => countFixed(t, '嗓音低') },
  { id: 'BR-08', domain: '嗓音干',   label: '嗓音干',          kind: 'BROAD',    exclude: false, m: t => countFixed(t, '嗓音干') },
  { id: 'BR-09', domain: '语气里',   label: '语气里',          kind: 'BROAD',    exclude: false, m: t => countFixed(t, '语气里') },

  // ═══ SUB: 声音有些 sub-patterns (5-char tail) ═══
  { id: 'SU-01', domain: '声音有些沙', label: '声音有些沙',    kind: 'SUB', m: t => countFixed(t, '声音有些沙') },
  { id: 'SU-02', domain: '声音有些颤', label: '声音有些颤',    kind: 'SUB', m: t => countFixed(t, '声音有些颤') },
  { id: 'SU-03', domain: '声音有些涩', label: '声音有些涩',    kind: 'SUB', m: t => countFixed(t, '声音有些涩') },
  { id: 'SU-04', domain: '声音有些什', label: '声音有些什',    kind: 'SUB', m: t => countFixed(t, '声音有些什') },
  { id: 'SU-05', domain: '声音有些低', label: '声音有些低',    kind: 'SUB', m: t => countFixed(t, '声音有些低') },
  { id: 'SU-06', domain: '声音有些冷', label: '声音有些冷',    kind: 'SUB', m: t => countFixed(t, '声音有些冷') },
  { id: 'SU-07', domain: '声音有些僵', label: '声音有些僵',    kind: 'SUB', m: t => countFixed(t, '声音有些僵') },
  { id: 'SU-08', domain: '声音有些干', label: '声音有些干',    kind: 'SUB', m: t => countFixed(t, '声音有些干') },
  { id: 'SU-09', domain: '声音有些虚', label: '声音有些虚',    kind: 'SUB', m: t => countFixed(t, '声音有些虚') },
  { id: 'SU-10', domain: '声音有些闷', label: '声音有些闷',    kind: 'SUB', m: t => countFixed(t, '声音有些闷') },

  // ═══ SUB: 声音没有 sub-patterns ═══
  { id: 'SN-01', domain: '声音没有情', label: '声音没有情',    kind: 'SUB', m: t => countFixed(t, '声音没有情') },
  { id: 'SN-02', domain: '声音没有什', label: '声音没有什',    kind: 'SUB', m: t => countFixed(t, '声音没有什') },
  { id: 'SN-03', domain: '声音没有停', label: '声音没有停',    kind: 'SUB', m: t => countFixed(t, '声音没有停') },
  { id: 'SN-04', domain: '声音没有变', label: '声音没有变',    kind: 'SUB', m: t => countFixed(t, '声音没有变') },
  { id: 'SN-05', domain: '声音没有丝', label: '声音没有丝',    kind: 'SUB', m: t => countFixed(t, '声音没有丝') },
  { id: 'SN-06', domain: '声音没有半', label: '声音没有半',    kind: 'SUB', m: t => countFixed(t, '声音没有半') },
  { id: 'SN-07', domain: '声音没有起伏', label: '声音没有起伏', kind: 'SUB', m: t => countFixed(t, '声音没有起伏') },
  { id: 'SN-08', domain: '声音没有变化', label: '声音没有变化', kind: 'SUB', m: t => countFixed(t, '声音没有变化') },

  // ═══ SUB: 嗓音低 sub-patterns ═══
  { id: 'SD-01', domain: '嗓音低沉',   label: '嗓音低沉',      kind: 'SUB', m: t => countFixed(t, '嗓音低沉') },
  { id: 'SD-02', domain: '嗓音低哑',   label: '嗓音低哑',      kind: 'SUB', m: t => countFixed(t, '嗓音低哑') },
  { id: 'SD-03', domain: '嗓音低得',   label: '嗓音低得',      kind: 'SUB', m: t => countFixed(t, '嗓音低得') },
  { id: 'SD-04', domain: '嗓音低低',   label: '嗓音低低',      kind: 'SUB', m: t => countFixed(t, '嗓音低低') },

  // ═══ SUB: 嗓音干 sub-patterns ═══
  { id: 'SG-01', domain: '嗓音干哑',   label: '嗓音干哑',      kind: 'SUB', m: t => countFixed(t, '嗓音干哑') },

  // ═══ SUB: 语气里 sub-patterns ═══
  { id: 'TJ-01', domain: '语气里有紧', label: '语气里有紧',    kind: 'SUB', m: t => countFixed(t, '语气里有紧') },
  { id: 'TJ-02', domain: '语气里有焦', label: '语气里有焦',    kind: 'SUB', m: t => countFixed(t, '语气里有焦') },
  { id: 'TJ-03', domain: '语气里有郑', label: '语气里有郑',    kind: 'SUB', m: t => countFixed(t, '语气里有郑') },

  // ═══ SUB: 声音很轻 sub-patterns ═══
  { id: 'SH-01', domain: '声音很轻很', label: '声音很轻很',    kind: 'SUB', m: t => countFixed(t, '声音很轻很') },
  { id: 'SH-02', domain: '声音很轻几', label: '声音很轻几',    kind: 'SUB', m: t => countFixed(t, '声音很轻几') },

  // ═══ SUB: 声音变得 sub-patterns ═══
  { id: 'SB-01', domain: '声音变得平', label: '声音变得平',    kind: 'SUB', m: t => countFixed(t, '声音变得平') },
  { id: 'SB-02', domain: '声音变得沉', label: '声音变得沉',    kind: 'SUB', m: t => countFixed(t, '声音变得沉') },
  { id: 'SB-03', domain: '声音变得干', label: '声音变得干',    kind: 'SUB', m: t => countFixed(t, '声音变得干') },
  { id: 'SB-04', domain: '声音变得沙', label: '声音变得沙',    kind: 'SUB', m: t => countFixed(t, '声音变得沙') },
  { id: 'SB-05', domain: '声音变得冷', label: '声音变得冷',    kind: 'SUB', m: t => countFixed(t, '声音变得冷') },

  // ═══ ART: R128-130 substitution artifacts (high-concentration AI constructs) ═══
  { id: 'AR-01', domain: '语气平直',       label: '语气平直',       kind: 'ART', m: t => countFixed(t, '语气平直') },
  { id: 'AR-02', domain: '语气平而直',     label: '语气平而直',     kind: 'ART', m: t => countFixed(t, '语气平而直') },
  { id: 'AR-03', domain: '语气机械',       label: '语气机械',       kind: 'ART', m: t => countFixed(t, '语气机械') },
  { id: 'AR-04', domain: '语气冷淡',       label: '语气冷淡',       kind: 'ART', m: t => countFixed(t, '语气冷淡') },
  { id: 'AR-05', domain: '语气冷硬',       label: '语气冷硬',       kind: 'ART', m: t => countFixed(t, '语气冷硬') },
  { id: 'AR-06', domain: '语气没有温度',   label: '语气没有温度',   kind: 'ART', m: t => countFixed(t, '语气没有温度') },
  { id: 'AR-07', domain: '语气发寒',       label: '语气发寒',       kind: 'ART', m: t => countFixed(t, '语气发寒') },
  { id: 'AR-08', domain: '嗓音发哑',       label: '嗓音发哑',       kind: 'ART', m: t => countFixed(t, '嗓音发哑') },
  { id: 'AR-09', domain: '嗓音哑了',       label: '嗓音哑了',       kind: 'ART', m: t => countFixed(t, '嗓音哑了') },
  { id: 'AR-10', domain: '嗓音沙哑',       label: '嗓音沙哑',       kind: 'ART', m: t => countFixed(t, '嗓音沙哑') },
  { id: 'AR-11', domain: '嗓音嘶哑',       label: '嗓音嘶哑',       kind: 'ART', m: t => countFixed(t, '嗓音嘶哑') },
  { id: 'AR-12', domain: '嗓音发涩',       label: '嗓音发涩',       kind: 'ART', m: t => countFixed(t, '嗓音发涩') },
  { id: 'AR-13', domain: '嗓音干哑',       label: '嗓音干哑',       kind: 'ART', m: t => countFixed(t, '嗓音干哑') },
  { id: 'AR-14', domain: '嗓音发抖',       label: '嗓音发抖',       kind: 'ART', m: t => countFixed(t, '嗓音发抖') },
  { id: 'AR-15', domain: '声音发抖',       label: '声音发抖',       kind: 'ART', m: t => countFixed(t, '声音发抖') },
  { id: 'AR-16', domain: '声音颤动',       label: '声音颤动',       kind: 'ART', m: t => countFixed(t, '声音颤动') },
  { id: 'AR-17', domain: '声音微抖',       label: '声音微抖',       kind: 'ART', m: t => countFixed(t, '声音微抖') },
  { id: 'AR-18', domain: '声音打颤',       label: '声音打颤',       kind: 'ART', m: t => countFixed(t, '声音打颤') },
  { id: 'AR-19', domain: '嗓音震动',       label: '嗓音震动',       kind: 'ART', m: t => countFixed(t, '嗓音震动') },
  { id: 'AR-20', domain: '嗓音带颤抖',     label: '嗓音带颤抖',     kind: 'ART', m: t => countFixed(t, '嗓音带颤抖') },
  { id: 'AR-21', domain: '嗓音抖动',       label: '嗓音抖动',       kind: 'ART', m: t => countFixed(t, '嗓音抖动') },
  { id: 'AR-22', domain: '声音带颤音',     label: '声音带颤音',     kind: 'ART', m: t => countFixed(t, '声音带颤音') },
  { id: 'AR-23', domain: '声音颤起来',     label: '声音颤起来',     kind: 'ART', m: t => countFixed(t, '声音颤起来') },
  { id: 'AR-24', domain: '声音发颤',       label: '声音发颤',       kind: 'ART', m: t => countFixed(t, '声音发颤') },
  { id: 'AR-25', domain: '嗓音打颤',       label: '嗓音打颤',       kind: 'ART', m: t => countFixed(t, '嗓音打颤') },
  { id: 'AR-26', domain: '嗓音微颤',       label: '嗓音微颤',       kind: 'ART', m: t => countFixed(t, '嗓音微颤') },
  { id: 'AR-27', domain: '声音微微发颤',   label: '声音微微发颤',   kind: 'ART', m: t => countFixed(t, '声音微微发颤') },
  { id: 'AR-28', domain: '声音略颤',       label: '声音略颤',       kind: 'ART', m: t => countFixed(t, '声音略颤') },
  { id: 'AR-29', domain: '开口毫无变化',   label: '开口毫无变化',   kind: 'ART', m: t => countFixed(t, '开口毫无变化') },
  { id: 'AR-30', domain: '开口平淡如常',   label: '开口平淡如常',   kind: 'ART', m: t => countFixed(t, '开口平淡如常') },
  { id: 'AR-31', domain: '开口平淡无奇',   label: '开口平淡无奇',   kind: 'ART', m: t => countFixed(t, '开口平淡无奇') },
  { id: 'AR-32', domain: '开口直截了当',   label: '开口直截了当',   kind: 'ART', m: t => countFixed(t, '开口直截了当') },
  { id: 'AR-33', domain: '嗓音毫无变化',   label: '嗓音毫无变化',   kind: 'ART', m: t => countFixed(t, '嗓音毫无变化') },
  { id: 'AR-34', domain: '嗓音毫无起伏',   label: '嗓音毫无起伏',   kind: 'ART', m: t => countFixed(t, '嗓音毫无起伏') },
  { id: 'AR-35', domain: '嗓音一成不变',   label: '嗓音一成不变',   kind: 'ART', m: t => countFixed(t, '嗓音一成不变') },
  { id: 'AR-36', domain: '嗓音完全一致',   label: '嗓音完全一致',   kind: 'ART', m: t => countFixed(t, '嗓音完全一致') },
  { id: 'AR-37', domain: '嗓音平直无波',   label: '嗓音平直无波',   kind: 'ART', m: t => countFixed(t, '嗓音平直无波') },
  { id: 'AR-38', domain: '嗓音平稳无起伏', label: '嗓音平稳无起伏', kind: 'ART', m: t => countFixed(t, '嗓音平稳无起伏') },
  { id: 'AR-39', domain: '嗓音机械而稳定', label: '嗓音机械而稳定', kind: 'ART', m: t => countFixed(t, '嗓音机械而稳定') },
  { id: 'AR-40', domain: '嗓音平如直线',   label: '嗓音平如直线',   kind: 'ART', m: t => countFixed(t, '嗓音平如直线') },
  { id: 'AR-41', domain: '嗓音带沙',       label: '嗓音带沙',       kind: 'ART', m: t => countFixed(t, '嗓音带沙') },
  { id: 'AR-42', domain: '嗓音粗涩',       label: '嗓音粗涩',       kind: 'ART', m: t => countFixed(t, '嗓音粗涩') },
  { id: 'AR-43', domain: '嗓音如砾',       label: '嗓音如砾',       kind: 'ART', m: t => countFixed(t, '嗓音如砾') },
  { id: 'AR-44', domain: '嗓音带砂砾',     label: '嗓音带砂砾',     kind: 'ART', m: t => countFixed(t, '嗓音带砂砾') },
  { id: 'AR-45', domain: '嗓音粗糙如砂',   label: '嗓音粗糙如砂',   kind: 'ART', m: t => countFixed(t, '嗓音粗糙如砂') },
  { id: 'AR-46', domain: '嗓音粗如砂纸',   label: '嗓音粗如砂纸',   kind: 'ART', m: t => countFixed(t, '嗓音粗如砂纸') },
  { id: 'AR-47', domain: '嗓音低得发闷',   label: '嗓音低得发闷',   kind: 'ART', m: t => countFixed(t, '嗓音低得发闷') },
  { id: 'AR-48', domain: '嗓音压得很低',   label: '嗓音压得很低',   kind: 'ART', m: t => countFixed(t, '嗓音压得很低') },
  { id: 'AR-49', domain: '嗓音低到极限',   label: '嗓音低到极限',   kind: 'ART', m: t => countFixed(t, '嗓音低到极限') },
  { id: 'AR-50', domain: '声音平直无波',   label: '声音平直无波',   kind: 'ART', m: t => countFixed(t, '声音平直无波') },
  { id: 'AR-51', domain: '声音完全平稳',   label: '声音完全平稳',   kind: 'ART', m: t => countFixed(t, '声音完全平稳') },
  { id: 'AR-52', domain: '声音平如直线',   label: '声音平如直线',   kind: 'ART', m: t => countFixed(t, '声音平如直线') },
  { id: 'AR-53', domain: '声音平如石板',   label: '声音平如石板',   kind: 'ART', m: t => countFixed(t, '声音平如石板') },
  { id: 'AR-54', domain: '声音稳如磐石',   label: '声音稳如磐石',   kind: 'ART', m: t => countFixed(t, '声音稳如磐石') },
  { id: 'AR-55', domain: '声音毫无颤音',   label: '声音毫无颤音',   kind: 'ART', m: t => countFixed(t, '声音毫无颤音') },
  { id: 'AR-56', domain: '声音毫无波澜',   label: '声音毫无波澜',   kind: 'ART', m: t => countFixed(t, '声音毫无波澜') },
  { id: 'AR-57', domain: '声音稳定无波',   label: '声音稳定无波',   kind: 'ART', m: t => countFixed(t, '声音稳定无波') },
  { id: 'AR-58', domain: '声音没有一丝变化', label: '声音没有一丝变化', kind: 'ART', m: t => countFixed(t, '声音没有一丝变化') },
  { id: 'AR-59', domain: '声音没有任何起伏', label: '声音没有任何起伏', kind: 'ART', m: t => countFixed(t, '声音没有任何起伏') },
  { id: 'AR-60', domain: '声音平缓直接',   label: '声音平缓直接',   kind: 'ART', m: t => countFixed(t, '声音平缓直接') },
  { id: 'AR-61', domain: '说话直截了当',   label: '说话直截了当',   kind: 'ART', m: t => countFixed(t, '说话直截了当') },
  { id: 'AR-62', domain: '语气平缓无起伏', label: '语气平缓无起伏', kind: 'ART', m: t => countFixed(t, '语气平缓无起伏') },
  { id: 'AR-63', domain: '语气平淡如机器', label: '语气平淡如机器', kind: 'ART', m: t => countFixed(t, '语气平淡如机器') },
  { id: 'AR-64', domain: '语气平直无波',   label: '语气平直无波',   kind: 'ART', m: t => countFixed(t, '语气平直无波') },
  { id: 'AR-65', domain: '嗓音几近无声',   label: '嗓音几近无声',   kind: 'ART', m: t => countFixed(t, '嗓音几近无声') },
  { id: 'AR-66', domain: '嗓音几乎听不见', label: '嗓音几乎听不见', kind: 'ART', m: t => countFixed(t, '嗓音几乎听不见') },
  { id: 'AR-67', domain: '嗓音压低到极致', label: '嗓音压低到极致', kind: 'ART', m: t => countFixed(t, '嗓音压低到极致') },
  { id: 'AR-68', domain: '嗓音放得极低',   label: '嗓音放得极低',   kind: 'ART', m: t => countFixed(t, '嗓音放得极低') },
  { id: 'AR-69', domain: '嗓音低得几乎听不见', label: '嗓音低得几乎听不见', kind: 'ART', m: t => countFixed(t, '嗓音低得几乎听不见') },
  { id: 'AR-70', domain: '嗓音低到极致',   label: '嗓音低到极致',   kind: 'ART', m: t => countFixed(t, '嗓音低到极致') },
  { id: 'AR-71', domain: '嗓音降到最深处', label: '嗓音降到最深处', kind: 'ART', m: t => countFixed(t, '嗓音降到最深处') },
  { id: 'AR-72', domain: '嗓音带砂',       label: '嗓音带砂',       kind: 'ART', m: t => countFixed(t, '嗓音带砂') },
  { id: 'AR-73', domain: '嗓音发沙',       label: '嗓音发沙',       kind: 'ART', m: t => countFixed(t, '嗓音发沙') },
  { id: 'AR-74', domain: '嗓音干',         label: '嗓音干',         kind: 'ART', m: t => countFixed(t, '嗓音干') },
  { id: 'AR-75', domain: '嗓音干燥',       label: '嗓音干燥',       kind: 'ART', m: t => countFixed(t, '嗓音干燥') },
];

// ── DEEP DIVES: patterns to show per-chapter breakdown (count >= 10 or ART) ──
// (will be populated dynamically based on actual counts)

// ── run ──────────────────────────────────────────────────────────────
function main() {
  console.log('=== R131 Probe: AI Voice Pattern Scan ===');
  console.log(`Scanning ${CHAPTERS_DIR} ...\n`);

  const chapters = loadChapters();
  console.log(`Loaded ${chapters.length} chapter files.\n`);

  // 1) Aggregate counts with volume breakdown
  const results = PATTERNS.map(p => {
    let total = 0;
    const byVol = {};
    for (const ch of chapters) {
      const c = p.m(ch.text);
      total += c;
      byVol[ch.volume] = (byVol[ch.volume] || 0) + c;
    }
    return { ...p, count: total, byVol };
  });

  // 2) ALL PATTERN COUNTS (sorted desc)
  results.sort((a, b) => b.count - a.count);
  console.log('━━━ ALL PATTERN COUNTS (sorted desc, count > 0) ━━━');
  console.log(`  {"id":10,"kind":6,"domain":18,"label":20,"count":6,"V1-V7 breakdown":30}`);
  for (const r of results) {
    if (r.count === 0) continue;
    const volOrder = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
    const volLine = volOrder.map(v => {
      const c = r.byVol[v] || 0;
      return c > 0 ? `V${v.replace('volume-','')}:${c}` : '';
    }).filter(Boolean).join(' ');
    console.log(`  ${r.id}  [${r.kind.padEnd(6)}]  ${r.label.padEnd(18)}  = ${r.count}  [${volLine}]`);
  }

  // 3) GROUP SUMMARY: sum of all ART patterns (substitution artifacts)
  const artTotal = results.filter(r => r.kind === 'ART').reduce((s, r) => s + r.count, 0);
  const subTotal = results.filter(r => r.kind === 'SUB').reduce((s, r) => s + r.count, 0);
  console.log(`\n━━━ GROUP TOTALS ━━━`);
  console.log(`  ART (substitution artifacts): ${artTotal} total across ${results.filter(r => r.kind==='ART' && r.count>0).length} patterns`);
  console.log(`  SUB (specific sub-patterns):  ${subTotal} total`);

  // 4) CANDIDATES FOR R131 FIX (count >= 10, non-structural)
  console.log('\n━━━ TOP 8+ CANDIDATES FOR R131 (count >= 10, non-structural) ━━━');
  const candidates = results.filter(r => r.count >= 10 && r.exclude !== true)
    .sort((a, b) => b.count - a.count);
  console.log(`  Found ${candidates.length} patterns at >= 10:`);
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const volOrder = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
    const volLine = volOrder.map(v => {
      const ct = c.byVol[v] || 0;
      return ct > 0 ? `V${v.replace('volume-','')}:${ct}` : '';
    }).filter(Boolean).join(' ');
    console.log(`    ${i+1}. ${c.id}  [${c.kind}]  "${c.label}"  = ${c.count}  [${volLine}]`);
  }

  // 5) DEEP DIVE: per-chapter for each candidate (top 6 chapters per pattern)
  console.log('\n━━━ DEEP DIVE: per-chapter distribution for candidates ━━━');
  for (const cand of candidates) {
    const needle = cand.label;
    const byChapter = [];
    for (const ch of chapters) {
      const c = countFixed(ch.text, needle);
      if (c > 0) {
        const snippets = extractSnippets(ch.text, needle, 1);
        byChapter.push({ chapter: ch.name, volume: ch.volume, count: c, snippets });
      }
    }
    byChapter.sort((a, b) => b.count - a.count);

    console.log(`\n  >> "${cand.label}"  TOTAL = ${cand.count}  (hits in ${byChapter.length} chapters)`);
    const top = byChapter.slice(0, 6);
    for (const t of top) {
      const snip = t.snippets[0] || '(no snippet)';
      console.log(`    ${t.volume}/${t.chapter}  n=${t.count}  e.g. "...${snip}..."`);
    }
    if (byChapter.length > 6) {
      console.log(`    ... and ${byChapter.length - 6} more chapters`);
    }
  }

  // 6) NEAR-MISSES (5-9) — for completeness
  const nearMiss = results.filter(r => r.count >= 5 && r.count < 10 && r.exclude !== true);
  if (nearMiss.length > 0) {
    console.log(`\n━━━ NEAR-MISSES (5-9) ━━━`);
    for (const c of nearMiss.sort((a,b) => b.count - a.count)) {
      console.log(`  ${c.id}  [${c.kind}]  "${c.label}"  = ${c.count}`);
    }
  }

  // 7) V5 CONCENTRATION CHECK
  console.log('\n━━━ V5 CONCENTRATION CHECK (>50% in volume-5) ━━━');
  const v5Heavy = results.filter(r => r.count >= 5 && (r.byVol['volume-5'] || 0) / r.count > 0.5);
  if (v5Heavy.length > 0) {
    for (const r of v5Heavy.sort((a,b) => b.count - a.count)) {
      const pct = Math.round((r.byVol['volume-5'] / r.count) * 100);
      console.log(`    ${r.id}  "${r.label}"  total=${r.count}  V5=${r.byVol['volume-5']} (${pct}%)`);
    }
  } else {
    console.log('  (no pattern has V5 >50%)');
  }

  // 8) STRUCTURAL patterns (excluded) — verify they're still structural
  console.log('\n━━━ STRUCTURAL PATTERNS (excluded from candidates) ━━━');
  for (const r of results.filter(r => r.exclude === true)) {
    if (r.count > 0) console.log(`  ${r.id}  "${r.label}"  = ${r.count}`);
  }

  // 9) ZERO-VERIFY: confirm R130-cleaned patterns are truly 0
  console.log('\n━━━ R130 ZERO-VERIFY (should all be 0) ━━━');
  const r130Verify = ['声音有些哑','嗓音干涩','嗓音像砂','嗓音颤抖','嗓音低下','开口毫无波澜','嗓音一色到底','嗓音单调而平稳'];
  for (const p of r130Verify) {
    let total = 0;
    for (const ch of chapters) total += countFixed(ch.text, p);
    console.log(`  "${p}"  = ${total}`);
  }

  console.log('\n=== R131 Probe Complete ===');
}

main();
