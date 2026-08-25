// R124 Probe: Concentrated 声音/嗓音 pattern scan across 1000 chapters
const fs = require('fs');
const path = require('path');

const CHAPTERS_DIR = path.join(__dirname, '..', 'chapters');
const files = [];

for (let v = 1; v <= 7; v++) {
    const volDir = path.join(CHAPTERS_DIR, `volume-${v}`);
    if (!fs.existsSync(volDir)) continue;
    for (const f of fs.readdirSync(volDir)) {
        if (f.endsWith('.md')) files.push(path.join(volDir, f));
    }
}
console.log(`Scanning ${files.length} chapter files\n`);

const allText = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// --- Helper: count and collect contexts ---
function countPattern(re) {
    let count = 0;
    const matches = [...allText.matchAll(re)];
    count = matches.length;
    return count;
}

function getContexts(pattern, n = 5) {
    const re = new RegExp('(.{0,20})' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(.{0,20})', 'g');
    const results = [];
    let m;
    while ((m = re.exec(allText)) !== null && results.length < n) {
        results.push(m[1] + '【' + pattern + '】' + m[2]);
    }
    return results;
}

// === 1. Known patterns ===
console.log('=== KNOWN PATTERNS (exact substring) ===');
const known = [
    '声音轻得', '声音很平', '备份在', '备份的',
    '声音从', '声音里', '声音。。',
    '嗓音压', '嗓音冷', '嗓音开',
    // R123 fresh replacements — verify they didn't create new concentrations
    '声音压至', '声音沉得很低', '声音落到了底', '声音压至底',
    '声音压至最低', '声音压至极限', '声音压至最深处'
];
const knownResults = known.map(p => {
    const c = (allText.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    return { pattern: p, count: c };
}).sort((a, b) => b.count - a.count);
knownResults.forEach(r => console.log(`  ${r.count.toString().padStart(5)}  ${r.pattern}`));

// === 2. 声音压至 + any chars (top 15 variants) ===
console.log('\n=== 声音压至 + suffix variants (top 15) ===');
const yazi_re = /声音压至.{1,6}/g;
const yazi_counts = {};
let m;
while ((m = yazi_re.exec(allText)) !== null) {
    yazi_counts[m[0]] = (yazi_counts[m[0]] || 0) + 1;
}
Object.entries(yazi_counts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${v.toString().padStart(5)}  ${k}`);
});

// === 3. 嗓音X patterns (single char after 嗓音) top 15 ===
console.log('\n=== 嗓音X (single char) top 15 ===');
const sanzhi_re = /嗓音.?[^\s\n]/g;
const sanzhi_counts = {};
while ((m = sanzhi_re.exec(allText)) !== null) {
    // normalize to 嗓音+next2chars for grouping
    sanzhi_counts[m[0]] = (sanzhi_counts[m[0]] || 0) + 1;
}
Object.entries(sanzhi_counts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${v.toString().padStart(5)}  ${k}`);
});

// Also count just 嗓音+1char
console.log('\n--- 嗓音+1char (exact 3-char) top 15 ---');
const sanzhi1_re = /嗓音./g;
const sanzhi1_counts = {};
while ((m = sanzhi1_re.exec(allText)) !== null) {
    sanzhi1_counts[m[0]] = (sanzhi1_counts[m[0]] || 0) + 1;
}
Object.entries(sanzhi1_counts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${v.toString().padStart(5)}  ${k}`);
});

// === 4. 声音轻得 with contexts ===
console.log('\n=== 声音轻得 (contexts) ===');
const qd_count = (allText.match(/声音轻得/g) || []).length;
console.log(`  Total: ${qd_count}`);
getContexts('声音轻得', 5).forEach(c => console.log(`    ${c}`));

// Show top suffixes for 声音轻得
const qd_re = /声音轻得.{1,4}/g;
const qd_counts = {};
while ((m = qd_re.exec(allText)) !== null) {
    qd_counts[m[0]] = (qd_counts[m[0]] || 0) + 1;
}
Object.entries(qd_counts).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    console.log(`    ${v.toString().padStart(4)}  ${k}`);
});

// === 5. 声音很平 with contexts ===
console.log('\n=== 声音很平 (contexts) ===');
const hp_count = (allText.match(/声音很平/g) || []).length;
console.log(`  Total: ${hp_count}`);
getContexts('声音很平', 5).forEach(c => console.log(`    ${c}`));

// Show top suffixes for 声音很平
const hp_re = /声音很平.{1,6}/g;
const hp_counts = {};
while ((m = hp_re.exec(allText)) !== null) {
    hp_counts[m[0]] = (hp_counts[m[0]] || 0) + 1;
}
Object.entries(hp_counts).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    console.log(`    ${v.toString().padStart(4)}  ${k}`);
});

// === 6. Summary: all patterns >= 10 ===
console.log('\n=== ALL CONCENTRATED PATTERNS >= 10 (priority list) ===');
const allPatterns = [
    ...knownResults,
    ...Object.entries(yazi_counts).map(([k,v]) => ({pattern:`声音压至...(${k})`, count:v})),
    ...Object.entries(sanzhi_counts).map(([k,v]) => ({pattern:`嗓音(${k})`, count:v})),
    ...Object.entries(qd_counts).map(([k,v]) => ({pattern:`声音轻得...(${k})`, count:v})),
    ...Object.entries(hp_counts).map(([k,v]) => ({pattern:`声音很平...(${k})`, count:v})),
];
allPatterns.filter(p => p.count >= 10).sort((a, b) => b.count - a.count)
    .forEach(p => console.log(`  ${p.count.toString().padStart(5)}  ${p.pattern}`));

// === 7. Bonus: look for other repetitive 声音/嗓音 patterns missed so far ===
console.log('\n=== BONUS: 声音+2char patterns (top 20) ===');
const sy2_re = /声音.{2}/g;
const sy2 = {};
while ((m = sy2_re.exec(allText)) !== null) {
    sy2[m[0]] = (sy2[m[0]] || 0) + 1;
}
Object.entries(sy2).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => {
    console.log(`  ${v.toString().padStart(5)}  ${k}`);
});

console.log('\n=== BONUS: 嗓音+2char patterns (top 20) ===');
const sz2_re = /嗓音.{2}/g;
const sz2 = {};
while ((m = sz2_re.exec(allText)) !== null) {
    sz2[m[0]] = (sz2[m[0]] || 0) + 1;
}
Object.entries(sz2).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => {
    console.log(`  ${v.toString().padStart(5)}  ${k}`);
});
