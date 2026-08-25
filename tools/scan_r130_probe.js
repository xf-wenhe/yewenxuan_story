/**
 * scan_r130_probe.js — Honest scan of 1000 chapters for concentrated AI voice patterns.
 *
 * Round R130. All R120-R129 pools verified at 0 (fixed by prior rounds).
 * This probe targets the REMAINING pools that prior rounds did NOT touch:
 *   - 声音有些 (was ~141, 125 in V5) — broad
 *   - 声音没有 (~71)
 *   - 声音很轻 (~71)
 *   - 嗓音低 (~64)
 *   - 嗓音干 (~32)
 *   - 语气里 (~29)
 *   - 声音有些哑 (~49, V5 substitution artifact)
 *   - 嗓音干涩 (~27, V5 substitution artifact)
 *   - R127-129 substitution artifacts: 开口毫无波澜, 嗓音一色到底, 嗓音单调而平稳,
 *     嗓音没有一丝波澜, 语气平直, 嗓音颤抖, 嗓音低下, 嗓音像砂
 *   - 声音变得 (~42)
 *
 * Report ONLY actual counts found NOW. Do not inflate.
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

function countFixed(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let idx = -1;
  while ((idx = text.indexOf(needle, idx + 1)) !== -1) count++;
  return count;
}

// ── pattern registry ─────────────────────────────────────────────────
// Domain: BROAD = 5-char broad pattern, SUB = specific sub-pattern, ART = substitution artifact
const PATTERNS = [
  // ═══ BROAD: 声音有些 / 声音没有 / 声音很轻 / 声音变得 / 声音在他 / 声音在叶 ═══
  { id: 'BROAD-01', domain: '声音有些', label: '声音有些',        kind: 'BROAD', m: t => countFixed(t, '声音有些') },
  { id: 'BROAD-02', domain: '声音没有', label: '声音没有',        kind: 'BROAD', m: t => countFixed(t, '声音没有') },
  { id: 'BROAD-03', domain: '声音很轻', label: '声音很轻',        kind: 'BROAD', m: t => countFixed(t, '声音很轻') },
  { id: 'BROAD-04', domain: '声音变得', label: '声音变得',        kind: 'BROAD', m: t => countFixed(t, '声音变得') },
  { id: 'BROAD-05', domain: '声音在他', label: '声音在他',        kind: 'BROAD', m: t => countFixed(t, '声音在他') },
  { id: 'BROAD-06', domain: '声音在叶', label: '声音在叶',        kind: 'BROAD', m: t => countFixed(t, '声音在叶') },
  { id: 'BROAD-07', domain: '嗓音低',   label: '嗓音低',          kind: 'BROAD', m: t => countFixed(t, '嗓音低') },
  { id: 'BROAD-08', domain: '嗓音干',   label: '嗓音干',          kind: 'BROAD', m: t => countFixed(t, '嗓音干') },
  { id: 'BROAD-09', domain: '语气里',   label: '语气里',          kind: 'BROAD', m: t => countFixed(t, '语气里') },

  // ═══ SUB: 声音有些 sub-patterns (5-char after 声音有些) ═══
  { id: 'SUB-01', domain: '声音有些哑', label: '声音有些哑',      kind: 'SUB', m: t => countFixed(t, '声音有些哑') },
  { id: 'SUB-02', domain: '声音有些沙', label: '声音有些沙',      kind: 'SUB', m: t => countFixed(t, '声音有些沙') },
  { id: 'SUB-03', domain: '声音有些颤', label: '声音有些颤',      kind: 'SUB', m: t => countFixed(t, '声音有些颤') },
  { id: 'SUB-04', domain: '声音有些涩', label: '声音有些涩',      kind: 'SUB', m: t => countFixed(t, '声音有些涩') },
  { id: 'SUB-05', domain: '声音有些什', label: '声音有些什',      kind: 'SUB', m: t => countFixed(t, '声音有些什') },
  { id: 'SUB-06', domain: '声音有些低', label: '声音有些低',      kind: 'SUB', m: t => countFixed(t, '声音有些低') },
  { id: 'SUB-07', domain: '声音有些冷', label: '声音有些冷',      kind: 'SUB', m: t => countFixed(t, '声音有些冷') },
  { id: 'SUB-08', domain: '声音有些僵', label: '声音有些僵',      kind: 'SUB', m: t => countFixed(t, '声音有些僵') },

  // ═══ SUB: 声音没有 sub-patterns ═══
  { id: 'SUB-10', domain: '声音没有什', label: '声音没有什',      kind: 'SUB', m: t => countFixed(t, '声音没有什') },
  { id: 'SUB-11', domain: '声音没有情', label: '声音没有情',      kind: 'SUB', m: t => countFixed(t, '声音没有情') },
  { id: 'SUB-12', domain: '声音没有停', label: '声音没有停',      kind: 'SUB', m: t => countFixed(t, '声音没有停') },
  { id: 'SUB-13', domain: '声音没有变', label: '声音没有变',      kind: 'SUB', m: t => countFixed(t, '声音没有变') },
  { id: 'SUB-14', domain: '声音没有丝', label: '声音没有丝',      kind: 'SUB', m: t => countFixed(t, '声音没有丝') },
  { id: 'SUB-15', domain: '声音没有半', label: '声音没有半',      kind: 'SUB', m: t => countFixed(t, '声音没有半') },

  // ═══ SUB: 嗓音低 sub-patterns ═══
  { id: 'SUB-20', domain: '嗓音低沉',   label: '嗓音低沉',        kind: 'SUB', m: t => countFixed(t, '嗓音低沉') },
  { id: 'SUB-21', domain: '嗓音低哑',   label: '嗓音低哑',        kind: 'SUB', m: t => countFixed(t, '嗓音低哑') },
  { id: 'SUB-22', domain: '嗓音低得',   label: '嗓音低得',        kind: 'SUB', m: t => countFixed(t, '嗓音低得') },
  { id: 'SUB-23', domain: '嗓音低低',   label: '嗓音低低',        kind: 'SUB', m: t => countFixed(t, '嗓音低低') },

  // ═══ SUB: 嗓音干 sub-patterns ═══
  { id: 'SUB-30', domain: '嗓音干涩',   label: '嗓音干涩',        kind: 'SUB', m: t => countFixed(t, '嗓音干涩') },
  { id: 'SUB-31', domain: '嗓音干哑',   label: '嗓音干哑',        kind: 'SUB', m: t => countFixed(t, '嗓音干哑') },
  { id: 'SUB-32', domain: '嗓音干燥',   label: '嗓音干燥',        kind: 'SUB', m: t => countFixed(t, '嗓音干燥') },

  // ═══ SUB: 语气里 sub-patterns ═══
  { id: 'SUB-40', domain: '语气里有紧', label: '语气里有紧',      kind: 'SUB', m: t => countFixed(t, '语气里有紧') },
  { id: 'SUB-41', domain: '语气里有焦', label: '语气里有焦',      kind: 'SUB', m: t => countFixed(t, '语气里有焦') },
  { id: 'SUB-42', domain: '语气里有郑', label: '语气里有郑',      kind: 'SUB', m: t => countFixed(t, '语气里有郑') },

  // ═══ SUB: 声音很轻 sub-patterns ═══
  { id: 'SUB-50', domain: '声音很轻很', label: '声音很轻很',      kind: 'SUB', m: t => countFixed(t, '声音很轻很') },
  { id: 'SUB-51', domain: '声音很轻几', label: '声音很轻几',      kind: 'SUB', m: t => countFixed(t, '声音很轻几') },

  // ═══ SUB: 声音变得 sub-patterns ═══
  { id: 'SUB-60', domain: '声音变得平', label: '声音变得平',      kind: 'SUB', m: t => countFixed(t, '声音变得平') },
  { id: 'SUB-61', domain: '声音变得沉', label: '声音变得沉',      kind: 'SUB', m: t => countFixed(t, '声音变得沉') },
  { id: 'SUB-62', domain: '声音变得干', label: '声音变得干',      kind: 'SUB', m: t => countFixed(t, '声音变得干') },
  { id: 'SUB-63', domain: '声音变得沙', label: '声音变得沙',      kind: 'SUB', m: t => countFixed(t, '声音变得沙') },
  { id: 'SUB-64', domain: '声音变得冷', label: '声音变得冷',      kind: 'SUB', m: t => countFixed(t, '声音变得冷') },

  // ═══ ART: R127-129 substitution artifacts ═══
  { id: 'ART-01', domain: '开口毫无波澜',   label: '开口毫无波澜',   kind: 'ART', m: t => countFixed(t, '开口毫无波澜') },
  { id: 'ART-02', domain: '嗓音一色到底',   label: '嗓音一色到底',   kind: 'ART', m: t => countFixed(t, '嗓音一色到底') },
  { id: 'ART-03', domain: '嗓音单调而平稳', label: '嗓音单调而平稳', kind: 'ART', m: t => countFixed(t, '嗓音单调而平稳') },
  { id: 'ART-04', domain: '嗓音没有一丝波澜', label: '嗓音没有一丝波澜', kind: 'ART', m: t => countFixed(t, '嗓音没有一丝波澜') },
  { id: 'ART-05', domain: '语气平直',       label: '语气平直',       kind: 'ART', m: t => countFixed(t, '语气平直') },
  { id: 'ART-06', domain: '嗓音颤抖',       label: '嗓音颤抖',       kind: 'ART', m: t => countFixed(t, '嗓音颤抖') },
  { id: 'ART-07', domain: '嗓音低下',       label: '嗓音低下',       kind: 'ART', m: t => countFixed(t, '嗓音低下') },
  { id: 'ART-08', domain: '嗓音像砂',       label: '嗓音像砂',       kind: 'ART', m: t => countFixed(t, '嗓音像砂') },
  { id: 'ART-09', domain: '嗓音发沙',       label: '嗓音发沙',       kind: 'ART', m: t => countFixed(t, '嗓音发沙') },
  { id: 'ART-10', domain: '嗓音发哑',       label: '嗓音发哑',       kind: 'ART', m: t => countFixed(t, '嗓音发哑') },
  { id: 'ART-11', domain: '嗓音发涩',       label: '嗓音发涩',       kind: 'ART', m: t => countFixed(t, '嗓音发涩') },
  { id: 'ART-12', domain: '嗓音发颤',       label: '嗓音发颤',       kind: 'ART', m: t => countFixed(t, '嗓音发颤') },
];

// ── deep-dive sub-patterns for per-chapter breakdown ──
const DEEP_DIVES = [
  { id: 'DD-01', label: '声音有些',       needle: '声音有些' },
  { id: 'DD-02', label: '声音没有',       needle: '声音没有' },
  { id: 'DD-03', label: '嗓音低',         needle: '嗓音低'   },
  { id: 'DD-04', label: '嗓音干',         needle: '嗓音干'   },
  { id: 'DD-05', label: '语气里',         needle: '语气里'   },
  { id: 'DD-06', label: '声音有些哑',     needle: '声音有些哑' },
  { id: 'DD-07', label: '嗓音干涩',       needle: '嗓音干涩' },
  { id: 'DD-08', label: '声音变得',       needle: '声音变得' },
  { id: 'DD-09', label: '嗓音低沉',       needle: '嗓音低沉' },
  { id: 'DD-10', label: '嗓音干哑',       needle: '嗓音干哑' },
  { id: 'DD-11', label: '声音没有情',     needle: '声音没有情' },
  { id: 'DD-12', label: '嗓音发沙',       needle: '嗓音发沙' },
  { id: 'DD-13', label: '声音有些沙',     needle: '声音有些沙' },
];

// ── run ──────────────────────────────────────────────────────────────
function main() {
  console.log('=== R130 Probe: AI Voice Pattern Scan ===');
  console.log(`Scanning ${CHAPTERS_DIR} ...\n`);

  const chapters = loadChapters();
  console.log(`Loaded ${chapters.length} chapter files.\n`);

  // 1) Aggregate counts
  const results = PATTERNS.map(p => {
    let total = 0;
    const byVol = {};
    for (const ch of chapters) {
      const c = p.m(ch.text);
      total += c;
      byVol[ch.volume] = (byVol[ch.volume] || 0) + c;
    }
    return { ...p, count: total, byVol };
  }).sort((a, b) => b.count - a.count);

  // 2) Sort by count descending for main table
  results.sort((a, b) => b.count - a.count);

  console.log('━━━ ALL PATTERN COUNTS (sorted desc) ━━━');
  console.log(`{"id":12,"kind":4,"domain":14,"label":18,"count":6,"vol-breakdown":30}`);
  for (const r of results) {
    const volStr = Object.keys(r.byVol).sort().map(v => `${v.replace('volume-','V')}=${r.byVol[v]}`).join(',');
    const volDisplay = volStr.length < 5 ? volStr : volStr.substring(0, 50) + '...';
    console.log(`  ${r.id}  [${r.kind}]  ${r.label.padEnd(16)}  = ${r.count}`);
  }

  // 3) Volume-level summary
  console.log('\n━━━ VOLUME DISTRIBUTION (only patterns with total >= 5) ━━━');
  const withCounts = results.filter(r => r.count >= 5);
  for (const r of withCounts) {
    const volOrder = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
    const volLine = volOrder.map(v => {
      const c = r.byVol[v] || 0;
      return c > 0 ? `V${v.replace('volume-','')}:${c}` : '';
    }).filter(Boolean).join(' ');
    console.log(`  ${r.id}  ${r.label.padEnd(16)}  total=${r.count}  [${volLine}]`);
  }

  // 4) Deep dives — per-chapter hits
  console.log('\n━━━ DEEP DIVE: per-chapter distribution ━━━');
  for (const dd of DEEP_DIVES) {
    const byVol = {};
    const byChapter = [];
    let grand = 0;
    for (const ch of chapters) {
      const c = countFixed(ch.text, dd.needle);
      if (c > 0) {
        byVol[ch.volume] = (byVol[ch.volume] || 0) + c;
        grand += c;
        const snippets = [];
        let idx = -1;
        let taken = 0;
        while ((idx = ch.text.indexOf(dd.needle, idx + 1)) !== -1 && taken < 2) {
          const start = Math.max(0, idx - 25);
          const end = Math.min(ch.text.length, idx + dd.needle.length + 25);
          snippets.push(ch.text.substring(start, end).replace(/\s+/g, ' '));
          taken++;
        }
        byChapter.push({ chapter: ch.name, volume: ch.volume, count: c, snippets });
      }
    }
    byChapter.sort((a, b) => b.count - a.count);

    console.log(`\n  >> ${dd.id} "${dd.label}"  TOTAL = ${grand}`);
    if (grand === 0) { console.log('    (none found)'); continue; }

    const volOrder = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
    const volLine = volOrder.map(v => {
      const c = byVol[v] || 0;
      return c > 0 ? `V${v.replace('volume-','')}:${c}` : '';
    }).filter(Boolean).join(' ');
    console.log(`    By volume: [${volLine}]`);

    const top = byChapter.slice(0, 6);
    if (top.length > 0) {
      console.log(`    Top chapters:`);
      for (const t of top) {
        const snip = t.snippets[0] || '(no snippet)';
        console.log(`      ${t.volume}/${t.chapter}  n=${t.count}  e.g. "...${snip}..."`);
      }
    }
  }

  // 5) Summary: candidates for next round (count >= 10, excluding BROAD structural patterns)
  console.log('\n━━━ CANDIDATES FOR R130 FIX (count >= 10, non-structural) ━━━');
  // Skip BROAD structural (声音在他, 声音在叶) as those are positional/natural
  const candidates = results.filter(r => r.count >= 10 && !['声音在他', '声音在叶'].includes(r.label));
  if (candidates.length === 0) {
    console.log('  (none — all remaining patterns < 10)');
  } else {
    console.log(`  Found ${candidates.length} patterns at >= 10:`);
    for (const c of candidates) {
      console.log(`    ${c.id}  ${c.kind}  "${c.label}"  = ${c.count}`);
    }
  }

  // 6) Near-misses (5-9)
  const nearMiss = results.filter(r => r.count >= 5 && r.count < 10 && !['声音在他', '声音在叶'].includes(r.label));
  if (nearMiss.length > 0) {
    console.log(`\n━━━ NEAR-MISSES (5-9) ━━━`);
    for (const c of nearMiss) {
      console.log(`  ${c.id}  ${c.kind}  "${c.label}"  = ${c.count}`);
    }
  }

  // 7) V5 concentration check
  console.log('\n━━━ V5 CONCENTRATION CHECK (volume-5 share of total) ━━━');
  const v5Heavy = results.filter(r => r.count >= 5 && (r.byVol['volume-5'] || 0) / r.count > 0.5);
  if (v5Heavy.length > 0) {
    console.log('  Patterns where V5 holds >50% of total count:');
    for (const r of v5Heavy) {
      const pct = Math.round((r.byVol['volume-5'] / r.count) * 100);
      console.log(`    ${r.id}  "${r.label}"  total=${r.count}  V5=${r.byVol['volume-5']} (${pct}%)`);
    }
  } else {
    console.log('  (no pattern has V5 >50% concentration)');
  }

  console.log('\n=== R130 Probe Complete ===');
}

main();
