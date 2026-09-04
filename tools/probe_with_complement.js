// probe_with_complement.js — Sample all with_complement / he_knows / she_knows patterns
const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\work\\yewenxuan_story';
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

function getVol(ch) {
  if (ch <= 100) return 1;
  if (ch <= 250) return 2;
  if (ch <= 400) return 3;
  if (ch <= 550) return 4;
  if (ch <= 750) return 5;
  if (ch <= 918) return 6;
  return 7;
}

function getChapterPath(ch) {
  const vol = getVol(ch);
  const numStr = ch <= 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return path.join(ROOT, 'chapters', `volume-${vol}`, `chapter-${numStr}-polished.md`);
}

// === 1. with_complement samples ===
const wcRe = /带着([^，。]{1,10})的/;
const wcSamples = [];
let wcTotal = 0;

// === 2. he_knows / she_knows samples ===
const heKRe = /他知道([^。]{0,30})[。\n]/;
const sheKRe = /她知道([^。]{0,30})[。\n]/;
const hkSamples = [];
const skSamples = [];
let hkTotal = 0, skTotal = 0;

// === 3. Remaining L1 words ===
const L1_WORDS = ['微微', '轻轻', '淡淡', '缓缓', '深吸一口气'];
const l1Samples = {};
for (const w of L1_WORDS) l1Samples[w] = [];
let l1Total = 0;

// === 4. Degeneration: chapters with 3x+ repeated lines ===
const degenChapters = [];

for (let ch = 1; ch <= 1000; ch++) {
  const fp = getChapterPath(ch);
  if (!fs.existsSync(fp)) continue;
  const text = fs.readFileSync(fp, 'utf8');

  // with_complement
  let m;
  const wcR = new RegExp(wcRe.source, 'g');
  while ((m = wcR.exec(text)) !== null) {
    wcTotal++;
    if (wcSamples.length < 80) {
      const ctxStart = Math.max(0, m.index - 20);
      const ctx = text.slice(ctxStart, m.index + m[0].length + 20).replace(/\n/g, ' ');
      wcSamples.push(`ch${ch}: "${m[0]}" | ctx: ...${ctx}...`);
    }
  }

  // he_knows
  const heR = new RegExp(heKRe.source, 'g');
  while ((m = heR.exec(text)) !== null) {
    hkTotal++;
    if (hkSamples.length < 40) {
      const ctxStart = Math.max(0, m.index - 20);
      const ctx = text.slice(ctxStart, m.index + m[0].length + 20).replace(/\n/g, ' ');
      hkSamples.push(`ch${ch}: "${m[0]}" | ctx: ...${ctx}...`);
    }
  }

  // she_knows
  const sheR = new RegExp(sheKRe.source, 'g');
  while ((m = sheR.exec(text)) !== null) {
    skTotal++;
    if (skSamples.length < 20) {
      const ctxStart = Math.max(0, m.index - 20);
      const ctx = text.slice(ctxStart, m.index + m[0].length + 20).replace(/\n/g, ' ');
      skSamples.push(`ch${ch}: "${m[0]}" | ctx: ...${ctx}...`);
    }
  }

  // L1 words
  for (const w of L1_WORDS) {
    const r = new RegExp(w, 'g');
    let matches = 0;
    while ((m = r.exec(text)) !== null) {
      matches++;
      if (l1Samples[w].length < 15) {
        const ctxStart = Math.max(0, m.index - 15);
        const ctx = text.slice(ctxStart, m.index + m[0].length + 15).replace(/\n/g, ' ');
        l1Samples[w].push(`ch${ch}: ...${ctx}...`);
      }
    }
    l1Total += matches;
  }

  // Degeneration: find repeated lines (3x+)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length >= 6);
  const lineCounts = {};
  for (const line of lines) {
    if (!lineCounts[line]) lineCounts[line] = { count: 0, sample: '' };
    lineCounts[line].count++;
  }
  const degLines = Object.entries(lineCounts).filter(([l, v]) => v.count >= 3 && l.length < 60);
  if (degLines.length > 0) {
    degenChapters.push({ ch, lines: degLines.map(([l, v]) => `×${v.count}  ${l}`) });
  }
}

// === OUTPUT ===
console.log('========================================');
console.log('  L1 PATTERN PROBE RESULTS');
console.log('========================================');

console.log('\n=== 1. WITH_COMPLEMENT (带着……的……) ===');
console.log(`Total: ${wcTotal}`);
if (wcSamples.length > 0) {
  console.log(`\nSampled ${wcSamples.length} occurrences:`);
  for (const s of wcSamples) console.log('  ' + s);
}

console.log('\n=== 2. HE_KNOWS / SHE_KNOWS ===');
console.log(`he_knows: ${hkTotal}`);
console.log(`she_knows: ${skTotal}`);
if (hkSamples.length > 0) {
  console.log('\nhe_knows samples:');
  for (const s of hkSamples) console.log('  ' + s);
}
if (skSamples.length > 0) {
  console.log('\nshe_knows samples:');
  for (const s of skSamples) console.log('  ' + s);
}

console.log('\n=== 3. L1 WORDS REMAINING ===');
console.log(`Total hits: ${l1Total}`);
for (const [w, samples] of Object.entries(l1Samples)) {
  if (samples.length > 0) {
    console.log(`\n"${w}":`);
    for (const s of samples) console.log('  ' + s);
  }
}

console.log('\n=== 4. DEGENERATION (3x+ repeated lines) ===');
console.log(`Chapters: ${degenChapters.length}`);
for (const d of degenChapters) {
  console.log(`\n  ch${d.ch}:`);
  for (const l of d.lines) console.log(`    ${l}`);
}