/**
 * scan_r129_probe.js — Honest scan of 1000 chapters for concentrated AI voice patterns.
 *
 * Philosophy: report ONLY what actually exists NOW in the files.
 * Previous probes R120–R128 all verified at 0. This round must not
 * re-inflate those numbers. If a pattern counts to 3, report 3.
 *
 * Usage: node tools/scan_r129_probe.js
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
      .filter(f => /\.md$/.test(f))
      .forEach(f => chapters.push({
        path: path.join(dir, f),
        name: f,
        volume: vol,
        text: fs.readFileSync(path.join(dir, f), 'utf-8'),
      }));
  }
  return chapters;
}

/**
 * Count non-overlapping occurrences of a literal substring.
 */
function countFixed(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let idx = -1;
  while ((idx = text.indexOf(needle, idx + 1)) !== -1) count++;
  return count;
}

/**
 * Count matches of a regex across the full text.
 */
function countRegex(text, re) {
  const results = text.match(re);
  return results ? results.length : 0;
}

// ── pattern registry ─────────────────────────────────────────────────
// Each entry: { id, label, domain, matcher(text) -> count }
const PATTERNS = [
  // ═══ 语气 domain ═══
  { id: 'TONE-01', domain: '语气', label: '语气平淡',          m: t => countFixed(t, '语气平淡') },
  { id: 'TONE-02', domain: '语气', label: '语气平淡,',         m: t => countFixed(t, '语气平淡,') },
  { id: 'TONE-03', domain: '语气', label: '语气里',             m: t => countFixed(t, '语气里') },
  { id: 'TONE-04', domain: '语气', label: '语气低沉',           m: t => countFixed(t, '语气低沉') },
  { id: 'TONE-05', domain: '语气', label: '语气冰冷',           m: t => countFixed(t, '语气冰冷') },
  { id: 'TONE-06', domain: '语气', label: '语气机械',           m: t => countFixed(t, '语气机械') },
  { id: 'TONE-07', domain: '语气', label: '语气平直',           m: t => countFixed(t, '语气平直') },
  { id: 'TONE-08', domain: '语气', label: '语气平缓无起伏',     m: t => countFixed(t, '语气平缓无起伏') },
  { id: 'TONE-09', domain: '语气', label: '语气平淡如机器',     m: t => countFixed(t, '语气平淡如机器') },

  // ═══ 嗓音 domain ═══
  { id: 'VOICE-01', domain: '嗓音', label: '嗓音干涩',          m: t => countFixed(t, '嗓音干涩') },
  { id: 'VOICE-02', domain: '嗓音', label: '嗓音沙哑',          m: t => countFixed(t, '嗓音沙哑') },
  { id: 'VOICE-03', domain: '嗓音', label: '嗓音低',            m: t => countFixed(t, '嗓音低') },
  { id: 'VOICE-04', domain: '嗓音', label: '嗓音干',            m: t => countFixed(t, '嗓音干') },
  { id: 'VOICE-05', domain: '嗓音', label: '嗓音颤抖',          m: t => countFixed(t, '嗓音颤抖') },
  { id: 'VOICE-06', domain: '嗓音', label: '嗓音低下',          m: t => countFixed(t, '嗓音低下') },
  { id: 'VOICE-07', domain: '嗓音', label: '嗓音像砂',          m: t => countFixed(t, '嗓音像砂') },
  { id: 'VOICE-08', domain: '嗓音', label: '嗓音几近无声',      m: t => countFixed(t, '嗓音几近无声') },
  { id: 'VOICE-09', domain: '嗓音', label: '嗓音单调而平稳',    m: t => countFixed(t, '嗓音单调而平稳') },
  { id: 'VOICE-10', domain: '嗓音', label: '开口毫无波澜',      m: t => countFixed(t, '开口毫无波澜') },
  { id: 'VOICE-11', domain: '嗓音', label: '嗓音一色到底',      m: t => countFixed(t, '嗓音一色到底') },
  { id: 'VOICE-12', domain: '嗓音', label: '嗓音没有一丝波澜',  m: t => countFixed(t, '嗓音没有一丝波澜') },
  { id: 'VOICE-13', domain: '嗓音', label: '嗓音低得几乎听不见',m: t => countFixed(t, '嗓音低得几乎听不见') },
  { id: 'VOICE-14', domain: '嗓音', label: '嗓音低到极致',      m: t => countFixed(t, '嗓音低到极致') },
  { id: 'VOICE-15', domain: '嗓音', label: '嗓音降到最深处',    m: t => countFixed(t, '嗓音降到最深处') },
  { id: 'VOICE-16', domain: '嗓音', label: '嗓音发沙',          m: t => countFixed(t, '嗓音发沙') },
  { id: 'VOICE-17', domain: '嗓音', label: '嗓音发哑',          m: t => countFixed(t, '嗓音发哑') },
  { id: 'VOICE-18', domain: '嗓音', label: '嗓音干哑',          m: t => countFixed(t, '嗓音干哑') },
  { id: 'VOICE-19', domain: '嗓音', label: '嗓音发涩',          m: t => countFixed(t, '嗓音发涩') },
  { id: 'VOICE-20', domain: '嗓音', label: '嗓音发颤',          m: t => countFixed(t, '嗓音发颤') },
  { id: 'VOICE-21', domain: '嗓音', label: '嗓音压低到极致',    m: t => countFixed(t, '嗓音压低到极致') },
  { id: 'VOICE-22', domain: '嗓音', label: '嗓音放得极低',      m: t => countFixed(t, '嗓音放得极低') },

  // ═══ 声音 domain ═══
  { id: 'SOUND-01', domain: '声音', label: '声音有些',          m: t => countFixed(t, '声音有些') },
  { id: 'SOUND-02', domain: '声音', label: '声音没有',          m: t => countFixed(t, '声音没有') },
  { id: 'SOUND-03', domain: '声音', label: '声音在叶',          m: t => countFixed(t, '声音在叶') },
  { id: 'SOUND-04', domain: '声音', label: '声音在他',          m: t => countFixed(t, '声音在他') },
  { id: 'SOUND-05', domain: '声音', label: '声音很轻',          m: t => countFixed(t, '声音很轻') },
  { id: 'SOUND-06', domain: '声音', label: '声音变得',          m: t => countFixed(t, '声音变得') },
  { id: 'SOUND-07', domain: '声音', label: '声音响起',          m: t => countFixed(t, '声音响起') },
  { id: 'SOUND-08', domain: '声音', label: '声音不再',          m: t => countFixed(t, '声音不再') },
  { id: 'SOUND-09', domain: '声音', label: '声音有些哑',        m: t => countFixed(t, '声音有些哑') },
  { id: 'SOUND-10', domain: '声音', label: '声音发颤',          m: t => countFixed(t, '声音发颤') },
  { id: 'SOUND-11', domain: '声音', label: '声音微颤',          m: t => countFixed(t, '声音微颤') },
  { id: 'SOUND-12', domain: '声音', label: '声音有些发抖',      m: t => countFixed(t, '声音有些发抖') },
  { id: 'SOUND-13', domain: '声音', label: '声音略颤',          m: t => countFixed(t, '声音略颤') },
  { id: 'SOUND-14', domain: '声音', label: '声音稳如磐石',      m: t => countFixed(t, '声音稳如磐石') },
  { id: 'SOUND-15', domain: '声音', label: '声音毫无颤音',      m: t => countFixed(t, '声音毫无颤音') },
  { id: 'SOUND-16', domain: '声音', label: '声音平缓直接',      m: t => countFixed(t, '声音平缓直接') },
  { id: 'SOUND-17', domain: '声音', label: '说话直截了当',      m: t => countFixed(t, '说话直截了当') },
  { id: 'SOUND-18', domain: '声音', label: '声音完全平稳',      m: t => countFixed(t, '声音完全平稳') },
  { id: 'SOUND-19', domain: '声音', label: '声音毫无波澜',      m: t => countFixed(t, '声音毫无波澜') },
  { id: 'SOUND-20', domain: '声音', label: '声音稳定无波',      m: t => countFixed(t, '声音稳定无波') },
  { id: 'SOUND-21', domain: '声音', label: '声音没有一丝变化',  m: t => countFixed(t, '声音没有一丝变化') },
];

// ── deep-dive sub-patterns (5-char) with chapter-level breakdown ────
const DEEP_DIVES = [
  { id: 'DD-01', label: '语气平淡', needle: '语气平淡' },
  { id: 'DD-02', label: '语气里',   needle: '语气里'   },
  { id: 'DD-03', label: '嗓音干涩', needle: '嗓音干涩' },
  { id: 'DD-04', label: '嗓音低',   needle: '嗓音低'   },
  { id: 'DD-05', label: '声音有些', needle: '声音有些' },
  { id: 'DD-06', label: '声音没有', needle: '声音没有' },
  { id: 'DD-07', label: '声音有些哑', needle: '声音有些哑' },
  { id: 'DD-08', label: '声音发颤', needle: '声音发颤' },
];

// ── run ──────────────────────────────────────────────────────────────
function main() {
  console.log('=== R129 Probe: AI Voice Pattern Scan ===');
  console.log(`Scanning ${CHAPTERS_DIR} ...\n`);

  const chapters = loadChapters();
  console.log(`Loaded ${chapters.length} chapter files.\n`);

  // 1) Aggregate counts
  const results = PATTERNS.map(p => {
    let total = 0;
    for (const ch of chapters) total += p.m(ch.text);
    return { ...p, count: total };
  }).sort((a, b) => b.count - a.count);

  console.log('━━━ PATTERN COUNTS (sorted, desc) ━━━');
  console.log(`{"id":12,"domain":8,"label":18,"count":6}`);
  for (const r of results) {
    console.log(`  ${r.id}  [${r.domain}]  ${r.label.padEnd(16)}  = ${r.count}`);
  }

  // 2) Deep dives — per-chapter hits for the 8 flagged sub-patterns
  console.log('\n━━━ DEEP DIVE: per-chapter distribution for 8 sub-patterns ━━━');
  for (const dd of DEEP_DIVES) {
    const byVol = {};
    const byChapter = []; // {chapter, vol, count, snippet}
    let grand = 0;
    for (const ch of chapters) {
      const c = countFixed(ch.text, dd.needle);
      if (c > 0) {
        byVol[ch.volume] = (byVol[ch.volume] || 0) + c;
        grand += c;
        // collect up to 3 snippet contexts
        const snippets = [];
        let idx = -1;
        let taken = 0;
        while ((idx = ch.text.indexOf(dd.needle, idx + 1)) !== -1 && taken < 3) {
          const start = Math.max(0, idx - 20);
          const end = Math.min(ch.text.length, idx + dd.needle.length + 20);
          snippets.push(ch.text.substring(start, end).replace(/\s+/g, ' '));
          taken++;
        }
        byChapter.push({ chapter: ch.name, volume: ch.volume, count: c, snippets });
      }
    }
    byChapter.sort((a, b) => b.count - a.count);

    console.log(`\n  ▸ ${dd.id} "${dd.label}"  TOTAL = ${grand}`);
    if (grand === 0) { console.log('    (none found)'); continue; }

    // per-volume
    const volOrder = Object.keys(byVol).sort((a, b) => a.localeCompare(b));
    const volLine = volOrder.map(v => `${v}=${byVol[v]}`).join(', ');
    console.log(`    By volume: ${volLine}`);

    // top chapters
    const top = byChapter.slice(0, Math.min(8, byChapter.length));
    if (top.length > 0) {
      console.log(`    Top chapters (${top.length} shown):`);
      for (const t of top) {
        const snip = t.snippets[0] || '(no snippet)';
        console.log(`      ${t.volume}/${t.chapter}  count=${t.count}  e.g. "...${snip}..."`);
      }
    }
  }

  // 3) Summary table of candidates (count >= 10)
  console.log('\n━━━ CANDIDATES FOR R129 (count >= 10) ━━━');
  const candidates = results.filter(r => r.count >= 10);
  if (candidates.length === 0) {
    console.log('  (none — all patterns < 10)');
  } else {
    console.log(`  Found ${candidates.length} patterns at >= 10 count:`);
    for (const c of candidates) {
      console.log(`    ${c.id}  ${c.domain}  "${c.label}"  = ${c.count}`);
    }
  }

  // 4) Also report near-misses (5-9) for completeness
  const nearMiss = results.filter(r => r.count >= 5 && r.count < 10);
  if (nearMiss.length > 0) {
    console.log(`\n━━━ NEAR-MISSES (5–9) ━━━`);
    for (const c of nearMiss) {
      console.log(`  ${c.id}  ${c.domain}  "${c.label}"  = ${c.count}`);
    }
  }

  console.log('\n=== R129 Probe Complete ===');
}

main();
