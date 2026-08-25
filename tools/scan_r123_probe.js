// scan_r123_probe.js — Round 123 probe: scan 声音/嗓音 patterns across 1000 chapters
const fs = require('fs');
const path = require('path');

const CHAPTS_ROOT = path.join(__dirname, '..', 'chapters');

// Collect all chapter files
const volumeDirs = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
let chapterFiles = [];
for (const vd of volumeDirs) {
  const dir = path.join(CHAPTS_ROOT, vd);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  files.forEach(f => chapterFiles.push(path.join(dir, f)));
}
chapterFiles.sort();
console.log(`Found ${chapterFiles.length} chapter files\n`);

// Patterns to scan
const patterns = [
  // HIGH COUNT — show ALL contexts
  { pat: '声音轻得', showAll: true },
  { pat: '声音很平', showAll: true },
  { pat: '声音平稳', showAll: true },
  { pat: '声音在颤', showAll: true },
  { pat: '声音压得', showAll: true },
  { pat: '声音压到', showAll: true },
  { pat: '声音变了', showAll: true },
  { pat: '声音变得', showAll: true },

  // MODERATE
  { pat: '声音说，' },
  { pat: '嗓音平' },
  { pat: '嗓音压' },
  { pat: '嗓音冷' },
  { pat: '嗓音降' },

  // R122 replacement artifacts
  { pat: '0415碎片循环播放' },
  { pat: '0415碎片最深层播放' },
  { pat: '声音传出' },
  { pat: '声音轻得快要飘散' },
  { pat: '声音轻得似乎要散' },

  // 备份 (high count, just count)
  { pat: '备份在' },
  { pat: '备份的' },
];

// Build results
const results = {};
for (const p of patterns) {
  results[p.pat] = { count: 0, contexts: [], config: p };
}

// Scan
for (const fpath of chapterFiles) {
  const text = fs.readFileSync(fpath, 'utf8');
  const fname = path.basename(fpath);
  for (const p of patterns) {
    let idx = 0;
    let matches = 0;
    while ((idx = text.indexOf(p.pat, idx)) !== -1) {
      matches++;
      idx += p.pat.length;
    }
    results[p.pat].count += matches;

    // Collect contexts (full sentence around match)
    // Get up to 3 if not showAll, or ALL if showAll
    idx = 0;
    const maxCtx = p.showAll ? Infinity : 3;
    let ctxCount = 0;
    while ((idx = text.indexOf(p.pat, idx)) !== -1 && ctxCount < maxCtx) {
      // Extract sentence: from previous 。 or start, to next 。 or end
      let start = idx;
      while (start > 0 && text[start-1] !== '。' && text[start-1] !== '！' && text[start-1] !== '？' && text[start-1] !== '\n') {
        start--;
      }
      let end = idx + p.pat.length;
      while (end < text.length && text[end] !== '。' && text[end] !== '！' && text[end] !== '？' && text[end] !== '\n') {
        end++;
      }
      const ctx = text.substring(start, end).trim();
      results[p.pat].contexts.push(`  [${fname}] ${ctx}`);
      idx += p.pat.length;
      ctxCount++;
    }
  }
}

// Print results — sorted by count descending
const sorted = Object.entries(results).sort((a, b) => b[1].count - a[1].count);

for (const [pat, r] of sorted) {
  const marker = r.count >= 10 ? ' ★★★' : (r.count >= 5 ? ' ★' : '');
  console.log(`\n========== ${pat}  |  count=${r.count}${marker} ==========`);
  if (r.count > 0 && r.contexts.length > 0) {
    if (r.config.showAll) {
      console.log(`  (showing ALL ${r.contexts.length} contexts)`);
      r.contexts.forEach(c => console.log(c));
    } else {
      const show = r.contexts.slice(0, 3);
      show.forEach(c => console.log(c));
      if (r.contexts.length > 3) {
        console.log(`  ... and ${r.contexts.length - 3} more`);
      }
    }
  }
}

// Summary
console.log('\n\n========== SUMMARY (count >= 10) ==========');
for (const [pat, r] of sorted) {
  if (r.count >= 10) {
    console.log(`  ${pat.padEnd(25)} → ${r.count}`);
  }
}
console.log('\n========== SUMMARY (count 5-9) ==========');
for (const [pat, r] of sorted) {
  if (r.count >= 5 && r.count < 10) {
    console.log(`  ${pat.padEnd(25)} → ${r.count}`);
  }
}
console.log('\n========== SUMMARY (count < 5) ==========');
for (const [pat, r] of sorted) {
  if (r.count < 5) {
    console.log(`  ${pat.padEnd(25)} → ${r.count}`);
  }
}