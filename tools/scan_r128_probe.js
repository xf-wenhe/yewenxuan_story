/**
 * scan_r128_probe.js — R128 AI voice pattern scan
 *
 * Scans all 1000 chapters across volume-1..volume-7 for remaining AI voice
 * constructs after R120-R127 round fixes. Focuses on 语气/嗓音/声音 domains.
 *
 * Output: JSON to stdout with per-pattern counts, per-chapter breakdown,
 * and 5-char sub-pattern deep-dives.
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\work\\yewenxuan_story\\chapters';
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

// ── Patterns ────────────────────────────────────────────────────────────────
// Each entry: { name, patterns: [regexes], domain }
const PATTERNS = [
  // 语气 domain
  { name: '语气平淡',         patterns: [/(语气平淡[^得])/g] },
  { name: '语气平淡,',        patterns: [/(语气平淡，)/g] },
  { name: '语气平淡得',       patterns: [/语气平淡得/g] },
  { name: '语气平淡静',       patterns: [/语气平淡静/g] },
  { name: '语气平铺直叙',     patterns: [/语气平铺直叙/g] },
  { name: '语气低沉',         patterns: [/语气低沉/g] },
  { name: '语气冰冷',         patterns: [/语气冰冷/g] },
  { name: '语气里',           patterns: [/语气里[^就]/g] },

  // 嗓音 domain
  { name: '嗓音干涩',         patterns: [/嗓音干涩/g] },
  { name: '嗓音沙哑',         patterns: [/嗓音沙哑/g] },
  { name: '嗓音低得',         patterns: [/嗓音低得/g] },
  { name: '嗓音颤抖',         patterns: [/嗓音颤抖/g] },
  { name: '嗓音低下',         patterns: [/嗓音低下/g] },
  { name: '嗓音像砂',         patterns: [/嗓音像砂/g] },
  { name: '嗓音低(?!\u5f97)', patterns: [/嗓音低(?!\u5f97|了|下)/g] },
  { name: '嗓音干(?!\u6ede)', patterns: [/嗓音干(?!\u6ede)/g] },

  // 声音 domain
  { name: '声音有些',         patterns: [/声音有些/g] },
  { name: '声音没有',         patterns: [/声音没有/g] },
  { name: '声音在叶',         patterns: [/声音在叶文轩/g] },
  { name: '声音在他',         patterns: [/声音在他/g] },
  { name: '声音很轻',         patterns: [/声音很轻/g] },
  { name: '声音变得',         patterns: [/声音变得/g] },
  { name: '声音响起',         patterns: [/声音响起/g] },
  { name: '声音不再',         patterns: [/声音不再/g] },
  { name: '声音有些哑',       patterns: [/声音有些哑/g] },
  { name: '声音发颤',         patterns: [/声音发颤/g] },

  // R127 substitution artifacts
  { name: 'R127-嗓音单调而平稳',     patterns: [/嗓音单调而平稳/g] },
  { name: 'R127-开口毫无波澜',       patterns: [/开口毫无波澜/g] },
  { name: 'R127-嗓音一色到底',       patterns: [/嗓音一色到底/g] },
  { name: 'R127-嗓音没有一丝波澜',   patterns: [/嗓音没有一丝波澜/g] },
  { name: 'R127-嗓音低得几乎听不见', patterns: [/嗓音低得几乎听不见/g] },
  { name: 'R127-嗓音低到极致',       patterns: [/嗓音低到极致/g] },
  { name: 'R127-嗓音降到最深处',     patterns: [/嗓音降到最深处/g] },
  { name: 'R127-嗓音几近无声',       patterns: [/嗓音几近无声/g] },
  { name: 'R127-说话声音轻得几乎没有重量', patterns: [/说话声音轻得几乎没有重量/g] },
  { name: 'R127-声音轻得没有半点重量',     patterns: [/声音轻得没有半点重量/g] },
  { name: 'R127-声音轻飘得难以承受',       patterns: [/声音轻飘得难以承受/g] },
  { name: 'R127-声音像纸一样薄',           patterns: [/声音像纸一样薄/g] },
  { name: 'R127-说话单调',                 patterns: [/说话单调/g] },
  { name: 'R127-说话没有任何变化',         patterns: [/说话没有任何变化/g] },
  { name: 'R127-开口毫无变化',             patterns: [/开口毫无变化/g] },
  { name: 'R127-说话一成不变',             patterns: [/说话一成不变/g] },
  { name: 'R127-声音稳得没有一丝颤音',     patterns: [/声音稳得没有一丝颤音/g] },
  { name: 'R127-声音没有半点颤音',         patterns: [/声音没有半点颤音/g] },
  { name: 'R127-声音连一个颤音都没有',     patterns: [/声音连一个颤音都没有/g] },
  { name: 'R127-声音毫无颤音',             patterns: [/声音毫无颤音/g] },
  { name: 'R127-嗓音没有波动',             patterns: [/嗓音没有波动/g] },
  { name: 'R127-嗓音平如直线',             patterns: [/嗓音平如直线/g] },
  { name: 'R127-嗓音完全没有变化',         patterns: [/嗓音完全没有变化/g] },
  { name: 'R127-嗓音没有任何波动',         patterns: [/嗓音没有任何波动/g] },
  { name: 'R127-嗓音没有半点波澜',         patterns: [/嗓音没有半点波澜/g] },
  { name: 'R127-嗓音完全平静',             patterns: [/嗓音完全平静/g] },
  { name: 'R127-嗓音平如镜',               patterns: [/嗓音平如镜/g] },
  { name: 'R127-语气像机器一样',           patterns: [/语气像机器一样/g] },
  { name: 'R127-语气机械而无生气',         patterns: [/语气机械而无生气/g] },
  { name: 'R127-语气像程序输出',           patterns: [/语气像程序输出/g] },
  { name: 'R127-语气没有一丝人情味',       patterns: [/语气没有一丝人情味/g] },
];

// ── Deep-dive sub-patterns ─────────────────────────────────────────────────
const DEEP_DIVE = [
  { name: 'deep-语气平淡',     re: /语气平淡.{0,8}/g },
  { name: 'deep-语气平淡得',   re: /语气平淡得.{0,12}/g },
  { name: 'deep-语气平铺直叙', re: /语气平铺直叙.{0,8}/g },
  { name: 'deep-嗓音干涩',     re: /嗓音干涩.{0,8}/g },
  { name: 'deep-嗓音低',       re: /嗓音低.{0,8}/g },
  { name: 'deep-声音有些',     re: /声音有些.{0,8}/g },
  { name: 'deep-声音没有',     re: /声音没有.{0,8}/g },
];

// ── Sub-pattern breakdowns for top patterns ────────────────────────────────
// For each anchor, extract the next N chars and group by frequency
const SUBPATTERN_BROKEN = [
  { anchor: '声音有些', extend: 10 },
  { anchor: '声音没有', extend: 10 },
  { anchor: '语气平淡', extend: 12 },
  { anchor: '嗓音低',    extend: 10 },
  { anchor: '声音在他', extend: 8  },
  { anchor: '声音在叶', extend: 8  },
  { anchor: '声音变得', extend: 8  },
  { anchor: '声音很轻', extend: 8  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function getAllChapterFiles() {
  const files = [];
  for (const vol of VOLUMES) {
    const dir = path.join(ROOT, vol);
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (/^chapter-\d{2,3}-polished\.md$/.test(entry)) {
          files.push(path.join(dir, entry));
        }
      }
    } catch (e) {
      // skip
    }
  }
  return files;
}

function extractChapterNum(filename) {
  const m = /chapter-(\d+)/.exec(path.basename(filename));
  return m ? parseInt(m[1], 10) : -1;
}

function extractChapterTitle(text) {
  // Match Chinese numeral titles: 第X章：title or 第X章: title
  const m = /^# 第[一二三四五六七八九十百千万\d]+章[：:]\s*(.+)$/.exec(text);
  return m ? m[1].trim().slice(0, 30) : '';
}

// ── Scan ────────────────────────────────────────────────────────────────────
function scan() {
  const files = getAllChapterFiles();
  const totalChapters = files.length;

  // Per-pattern accumulator: { name, totalCount, chapters: [{ch, count, title}] }
  const results = PATTERNS.map(p => ({ name: p.name, totalCount: 0, chapters: [] }));
  // Deep-dive accumulator: { name, totalCount, samples: [string], chapters: [{ch, count}] }
  const deepResults = DEEP_DIVE.map(d => ({ name: d.name, totalCount: 0, samples: [], chapters: [] }));

  // Per-chapter aggregate for concentration heatmap
  const perChapterAgg = new Map(); // chNum -> count

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (e) { continue; }
    const chNum = extractChapterNum(file);
    const title = extractChapterTitle(text);
    let chapterTotal = 0;

    // Pattern scan
    for (let pi = 0; pi < PATTERNS.length; pi++) {
      const p = PATTERNS[pi];
      let count = 0;
      for (const re of p.patterns) {
        const matches = text.match(re);
        if (matches) count += matches.length;
      }
      if (count > 0) {
        results[pi].totalCount += count;
        results[pi].chapters.push({ ch: chNum, count, title });
        chapterTotal += count;
      }
    }

    // Deep-dive scan
    for (let di = 0; di < DEEP_DIVE.length; di++) {
      const d = DEEP_DIVE[di];
      const matches = text.match(d.re);
      if (matches) {
        deepResults[di].totalCount += matches.length;
        deepResults[di].chapters.push({ ch: chNum, count: matches.length });
        // Collect up to 5 samples per chapter for diversity
        for (const m of matches.slice(0, 5)) {
          if (deepResults[di].samples.length < 30) {
            deepResults[di].samples.push(`ch${chNum}: ...${m}...`);
          }
        }
      }
    }

    if (chapterTotal > 0) perChapterAgg.set(chNum, chapterTotal);
  }

  // ── Sub-pattern breakdowns ──────────────────────────────────────────────
  const subResults = {};
  for (const file of files) {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch (e) { continue; }
    const chNum = extractChapterNum(file);
    for (const sp of SUBPATTERN_BROKEN) {
      const re = new RegExp(sp.anchor + '.{0,' + sp.extend + '}', 'g');
      const matches = text.match(re);
      if (matches) {
        if (!subResults[sp.anchor]) {
          subResults[sp.anchor] = { anchor: sp.anchor, total: 0, variants: new Map() };
        }
        const sr = subResults[sp.anchor];
        sr.total += matches.length;
        for (const m of matches) {
          // Normalize: strip trailing punctuation for grouping
          const key = m.replace(/[，。；！？""''、：,.!?;:'"\s]+$/g, '');
          sr.variants.set(key, (sr.variants.get(key) || 0) + 1);
        }
      }
    }
  }

  // Convert variant maps to sorted arrays
  const subPatternBreakdown = Object.values(subResults).map(sr => ({
    anchor: sr.anchor,
    total: sr.total,
    uniqueVariants: sr.variants.size,
    topVariants: [...sr.variants.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([k, v]) => ({ text: k, count: v })),
  }));
  subPatternBreakdown.sort((a, b) => b.total - a.total);

  // ── Sort results ────────────────────────────────────────────────────────
  // Sort pattern results by total desc
  results.sort((a, b) => b.totalCount - a.totalCount);
  // Sort deep-dives by total desc
  deepResults.sort((a, b) => b.totalCount - a.totalCount);

  // Sort per-chapter breakdowns within each pattern by count desc, keep top-15
  for (const r of results) {
    r.chapters.sort((a, b) => b.count - a.count);
    r.topChapters = r.chapters.slice(0, 15);
    r.chapters.length = 0; // trim memory
  }
  for (const d of deepResults) {
    d.chapters.sort((a, b) => b.count - a.count);
    d.topChapters = d.chapters.slice(0, 15);
    d.chapters.length = 0;
  }

  // Concentration heatmap: top-20 chapters by aggregate
  const heatmap = [...perChapterAgg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([ch, cnt]) => ({ ch, count: cnt }));

  // ── Identify concentrated patterns (>=10 count) ─────────────────────────
  const concentrated = results.filter(r => r.totalCount >= 10);

  return {
    meta: { totalChapters, scanDate: new Date().toISOString(), round: 'R128' },
    summary: {
      totalPatternMatches: results.reduce((s, r) => s + r.totalCount, 0),
      patternsWithHits: results.filter(r => r.totalCount > 0).length,
      concentratedCount: concentrated.length,
    },
    patterns: results.map(r => ({
      name: r.name,
      total: r.totalCount,
      chapters: r.topChapters.map(c => ({ ch: c.ch, count: c.count, title: c.title })),
    })),
    deepDive: deepResults.map(d => ({
      name: d.name,
      total: d.totalCount,
      chapters: d.topChapters.map(c => ({ ch: c.ch, count: c.count })),
      samples: d.samples.slice(0, 20),
    })),
    heatmap: {
      description: 'Top-20 chapters by aggregate AI-voice-pattern density',
      chapters: heatmap,
    },
    concentrated8: concentrated.slice(0, 12).map(r => ({
      name: r.name,
      total: r.totalCount,
      spread: r.topChapters.length,
      top3: r.topChapters.slice(0, 3).map(c => `ch${c.ch}(${c.count})${c.title ? ' 「' + c.title + '」' : ''}`),
    })),
  subPatternBreakdown,
  };
}

const out = scan();
console.log(JSON.stringify(out, null, 2));
