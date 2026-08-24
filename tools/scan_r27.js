const fs = require('fs');
const path = require('path');

const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

// Scan: count every full sentence (up to 。) across all chapters, find the most common
// Sentences of 5-30 chars that appear 15+ times
const counts = {};

for (const v of V) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    // Extract sentences ending with 。
    const sents = text.split('。').filter(s => s.trim().length >= 5 && s.trim().length <= 30);
    for (const s of sents) {
      const t = s.trim();
      counts[t] = (counts[t] || 0) + 1;
    }
  }
}

const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
console.log('=== R27 CANDIDATES (sentences appearing 15+ times) ===');
for (const [sent, cnt] of sorted.slice(0, 40)) {
  if (cnt < 15) break;
  console.log('  ' + cnt + 'x  "' + sent + '"');
}

// Also scan for half-sentence fragments (up to ，) that appear frequently
const fragCounts = {};
for (const v of V) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md'))) {
    const text = fs.readFileSync(path.join(d, f), 'utf-8');
    const frags = text.split('，').filter(s => s.trim().length >= 5 && s.trim().length <= 25);
    for (const s of frags) {
      const t = s.trim();
      fragCounts[t] = (fragCounts[t] || 0) + 1;
    }
  }
}
const fragSorted = Object.entries(fragCounts).sort((a,b) => b[1] - a[1]);
console.log('\n=== R27 FRAGMENT CANDIDATES (appearing 15+ times) ===');
for (const [frag, cnt] of fragSorted.slice(0, 40)) {
  if (cnt < 15) break;
  console.log('  ' + cnt + 'x  "' + frag + '"');
}