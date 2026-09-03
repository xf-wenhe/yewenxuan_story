// Scan all chapters for verbatim repeated phrases (≥8 chars, repeated ≥3x within a chapter)
const fs = require('fs');
const path = require('path');

const VOLS = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const MIN_LEN = 10;
const MIN_REPEAT = 3;
const results = [];

for (const vol of VOLS) {
  const dir = path.join('chapters', vol);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.includes('-polished.md'));
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), 'utf-8');
    const lines = text.split('\n');
    const deduped = {};
    for (const raw of lines) {
      const s = raw.trim();
      if (s.length < MIN_LEN) continue;
      if (/\(.*章完\)/.test(s)) continue;
      if (/^#/.test(s)) continue;
      deduped[s] = (deduped[s] || 0) + 1;
    }
    const dupes = Object.entries(deduped).filter(([,n]) => n >= MIN_REPEAT);
    if (dupes.length > 0) {
      dupes.sort((a,b) => b[1] - a[1]);
      results.push({ file: f, count: dupes.length, top: dupes.slice(0, 5).map(([s,n]) => ({n, s: s.slice(0,50)})) });
    }
  }
}

results.sort((a,b) => b.count - a.count);
console.log(`Chapters with ≥${MIN_REPEAT}× repeated lines: ${results.length}`);
for (const r of results.slice(0, 30)) {
  console.log(`\n${r.file} (${r.count} repeated lines)`);
  for (const t of r.top) {
    console.log(`  ×${t.n}  ${t.s}...`);
  }
}