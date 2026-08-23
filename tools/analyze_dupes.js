const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'chapters/volume-5');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-polished.md')).sort();

// Scan each chapter for duplicate paragraphs
const results = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf-8');
  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(p => p.length > 5 && !p.includes('#'));
  const seen = {};
  let extraCopies = 0;
  for (const p of paragraphs) {
    if (seen[p]) {
      seen[p].count++;
      extraCopies++;
    } else {
      seen[p] = { count: 1, text: p };
    }
  }
  const chNum = parseInt(f.match(/chapter-(\d+)/)[1]);
  if (extraCopies > 0) {
    const dupes = Object.values(seen).filter(s => s.count > 1);
    results.push({ ch: chNum, file: f, extraCopies, dupeCount: dupes.length, topDupe: dupes[0]?.text?.slice(0, 80) });
  }
}

results.sort((a, b) => b.extraCopies - a.extraCopies);
console.log('=== V5 DUPLICATE ANALYSIS ===');
console.log('Chapters with dupes:', results.length);
console.log('Total extra copies:', results.reduce((s, r) => s + r.extraCopies, 0));
console.log('\nTop 30 by extra copies:');
for (const r of results.slice(0, 30)) {
  console.log('  ch' + r.ch + ': ' + r.extraCopies + ' extra (' + r.dupeCount + ' duped paragraphs)');
  console.log('    top: ' + r.topDupe);
}

// Distribution
console.log('\nDistribution:');
const buckets = {};
for (const r of results) {
  const b = Math.min(r.extraCopies, 10);
  if (!buckets[b]) buckets[b] = 0;
  buckets[b]++;
}
for (const [k, v] of Object.entries(buckets).sort((a,b) => a[0]-b[0])) {
  console.log('  ' + k + ' extra: ' + v + ' chapters');
}