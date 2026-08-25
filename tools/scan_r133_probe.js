// scan_r133_probe.js — R133 AI voice pattern scan (v2)
// Scans all 1000 chapters for remaining AI voice constructs.
// Uses literal substring counting (includes), NOT regex, for accuracy.

const fs = require('fs');
const path = require('path');

const BASE = 'D:/work/yewenxuan_story/chapters';

// Count all occurrences of a substring in text
function countAll(text, substr) {
    if (!substr) return 0;
    let count = 0;
    let idx = 0;
    while ((idx = text.indexOf(substr, idx)) !== -1) {
        count++;
        idx += substr.length;
    }
    return count;
}

// Collect all chapter files
const chapters = [];
for (let v = 1; v <= 7; v++) {
    const dir = path.join(BASE, `volume-${v}`);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir)
        .filter(f => /^chapter-\d{1,4}-polished\.md$/.test(f))
        .sort();
    for (const f of files) {
        const chapNum = parseInt(f.match(/chapter-(\d+)/)[1]);
        chapters.push({ num: chapNum, volume: v, path: path.join(dir, f) });
    }
}

console.log(`Loaded ${chapters.length} chapters (expected 1000)`);

// Load all content into memory
const contentMap = new Map();
let totalChars = 0;
for (const ch of chapters) {
    try {
        const text = fs.readFileSync(ch.path, 'utf-8');
        contentMap.set(ch.num, text);
        totalChars += text.length;
    } catch(e) {
        contentMap.set(ch.num, '');
    }
}

// Define patterns — each is a literal substring to search for
// Format: [label, substring]
const PATTERNS = [
    // === Broad umbrella patterns (for context) ===
    ['声音有些', '声音有些'],
    ['声音没有', '声音没有'],
    ['声音很轻', '声音很轻'],
    ['声音变得', '声音变得'],
    ['嗓音低', '嗓音低'],

    // === 声音有些 + sub-patterns ===
    ['声音有些沙哑', '声音有些沙哑'],
    ['声音有些低沉', '声音有些低沉'],
    ['声音有些颤抖', '声音有些颤抖'],
    ['声音有些发颤', '声音有些发颤'],
    ['声音有些发抖', '声音有些发抖'],
    ['声音有些发闷', '声音有些发闷'],
    ['声音有些平淡', '声音有些平淡'],
    ['声音有些异样', '声音有些异样'],
    ['声音有些嘶哑', '声音有些嘶哑'],
    ['声音有些干涩', '声音有些干涩'],
    ['声音有些沙哑', '声音有些沙哑'],

    // === 声音没有 + sub-patterns ===
    ['声音没有起伏', '声音没有起伏'],
    ['声音没有感情', '声音没有感情'],
    ['声音没有情绪', '声音没有情绪'],
    ['声音没有波澜', '声音没有波澜'],
    ['声音没有温度', '声音没有温度'],
    ['声音没有波动', '声音没有波动'],
    ['声音没有杂质', '声音没有杂质'],
    ['声音不带感情', '声音不带感情'],
    ['声音不带温度', '声音不带温度'],
    ['声音毫无情绪', '声音毫无情绪'],
    ['声音毫无波澜', '声音毫无波澜'],

    // === 声音很轻 + sub-patterns ===
    ['声音很轻很轻', '声音很轻很轻'],
    ['声音很轻地', '声音很轻地'],

    // === 声音变得 + sub-patterns ===
    ['声音变得沙哑', '声音变得沙哑'],
    ['声音变得低沉', '声音变得低沉'],
    ['声音变得冰冷', '声音变得冰冷'],
    ['声音变得冰冷起来', '声音变得冰冷起来'],
    ['声音变得陌生', '声音变得陌生'],
    ['声音变得遥远', '声音变得遥远'],
    ['声音变得微弱', '声音变得微弱'],
    ['声音变得急促', '声音变得急促'],

    // === 嗓音低 + sub-patterns ===
    ['嗓音低沉', '嗓音低沉'],
    ['嗓音低到极致', '嗓音低到极致'],
    ['嗓音低到极限', '嗓音低到极限'],
    ['嗓音低哑', '嗓音低哑'],
    ['嗓音低得像', '嗓音低得像'],
    ['嗓音低得几乎', '嗓音低得几乎'],
    ['嗓音低得快要', '嗓音低得快要'],
    ['嗓音低了下去', '嗓音低了下去'],
    ['嗓音低了下来', '嗓音低了下来'],

    // === 嗓音嘶哑/干哑/沙哑/暗哑 ===
    ['嗓音嘶哑', '嗓音嘶哑'],
    ['嗓音干哑', '嗓音干哑'],
    ['嗓音沙哑', '嗓音沙哑'],
    ['嗓音暗哑', '嗓音暗哑'],
    ['嗓音发涩', '嗓音发涩'],
    ['嗓音喑哑', '嗓音喑哑'],
    ['嗓音带沙', '嗓音带沙'],
    ['嗓音发暗', '嗓音发暗'],
    ['嗓音发哑', '嗓音发哑'],

    // === 声音发抖/微抖/颤抖/打颤/震颤/颤 ===
    ['声音发抖', '声音发抖'],
    ['声音微抖', '声音微抖'],
    ['声音颤抖', '声音颤抖'],
    ['声音打颤', '声音打颤'],
    ['声音震颤', '声音震颤'],
    ['声音颤起来', '声音颤起来'],
    ['声音颤了颤', '声音颤了颤'],
    ['声音发颤', '声音发颤'],

    // === 声音沙哑/嘶哑/干涩/暗哑/发哑 ===
    ['声音沙哑', '声音沙哑'],
    ['声音沙哑起来', '声音沙哑起来'],
    ['声音嘶哑', '声音嘶哑'],
    ['声音干涩', '声音干涩'],
    ['声音暗哑', '声音暗哑'],
    ['声音发哑', '声音发哑'],
    ['声音喑哑', '声音喑哑'],

    // === 平淡/无波/无奇 ===
    ['声音平直无波', '声音平直无波'],
    ['声音平淡', '声音平淡'],
    ['开口平淡', '开口平淡'],
    ['开口平淡无奇', '开口平淡无奇'],
    ['开口毫无波澜', '开口毫无波澜'],
    ['开口直白', '开口直白'],
    ['开口冷淡', '开口冷淡'],
    ['开口冷硬', '开口冷硬'],
    ['开口平淡无波', '开口平淡无波'],

    // === 语气平淡/平实/冷而平/毫无波动 ===
    ['语气平淡如常', '语气平淡如常'],
    ['语气平实', '语气平实'],
    ['语气冷而平', '语气冷而平'],
    ['语气毫无波动', '语气毫无波动'],
    ['语气平淡', '语气平淡'],
    ['语气平稳', '语气平稳'],
    ['语气平直', '语气平直'],

    // === 嗓音毫无起伏/波澜/波动 ===
    ['嗓音毫无起伏', '嗓音毫无起伏'],
    ['嗓音毫无波澜', '嗓音毫无波澜'],
    ['嗓音毫无波动', '嗓音毫无波动'],

    // === 嗓音压得 ===
    ['嗓音压得发闷', '嗓音压得发闷'],
    ['嗓音几近无声', '嗓音几近无声'],
    ['嗓音压得很低', '嗓音压得很低'],
    ['嗓音压得极低', '嗓音压得极低'],
    ['嗓音压低了', '嗓音压低了'],

    // === 声音压得/压低 ===
    ['声音压得', '声音压得'],
    ['声音压低了', '声音压低了'],
    ['声音压低', '声音压低'],
];

// Deduplicate by substring
const seen = new Set();
const uniquePatterns = [];
for (const [label, substr] of PATTERNS) {
    if (seen.has(substr)) continue;
    seen.add(substr);
    uniquePatterns.push([label, substr]);
}

// Count each pattern
const results = [];
for (const [label, substr] of uniquePatterns) {
    let totalCount = 0;
    const byVolume = new Array(8).fill(0);
    const byChapter = new Map();
    for (const ch of chapters) {
        const text = contentMap.get(ch.num);
        if (!text) continue;
        const c = countAll(text, substr);
        if (c > 0) {
            totalCount += c;
            byVolume[ch.volume] += c;
            byChapter.set(ch.num, c);
        }
    }
    if (totalCount > 0) {
        results.push({
            label,
            total: totalCount,
            byVolume: byVolume,
            byChapter: byChapter,
        });
    }
}

// Sort by total descending
results.sort((a, b) => b.total - a.total);

// Print full report
console.log('');
console.log('R133 AI VOICE PATTERN SCAN RESULTS (v2 - literal matching)');
console.log(`Total chapters scanned: ${chapters.length}`);
console.log(`Total text: ${(totalChars/1000).toFixed(0)}K chars`);
console.log('='.repeat(80));
console.log('');
console.log('ALL PATTERNS FOUND (sorted by count, descending):');
console.log('-'.repeat(80));

let rank = 0;
for (const r of results) {
    rank++;
    const volStr = [];
    for (let v = 1; v <= 7; v++) {
        if (r.byVolume[v] > 0) volStr.push(`V${v}:${r.byVolume[v]}`);
    }
    const sortedChaps = [...r.byChapter.entries()].sort((a,b) => b[1] - a[1]);
    const topChaps = sortedChaps.slice(0, 5).map(([c, cnt]) => `ch${c}:${cnt}`).join(', ');
    const concentrated = r.total >= 10 ? ' **>=10**' : '';
    console.log(`  #${String(rank).padStart(3)}  "${r.label}"  =>  ${r.total} hits${concentrated}`);
    console.log(`           Volumes: ${volStr.join(', ')}`);
    if (topChaps) console.log(`           Top chs: ${topChaps}`);
    console.log('');
}

// Summary: patterns with >= 10 hits
console.log('='.repeat(80));
console.log('CONCENTRATED PATTERNS (>= 10 hits) — CANDIDATE CLEAN-UP TARGETS:');
console.log('-'.repeat(80));
let concentratedCount = 0;
for (const r of results) {
    if (r.total >= 10) {
        concentratedCount++;
        const volStr = [];
        for (let v = 1; v <= 7; v++) {
            if (r.byVolume[v] > 0) volStr.push(`V${v}:${r.byVolume[v]}`);
        }
        const sortedChaps = [...r.byChapter.entries()].sort((a,b) => b[1] - a[1]);
        const hotChs = sortedChaps.slice(0, 10).map(([c, cnt]) => `ch${c}:${cnt}`).join(', ');
        console.log(`  [${concentratedCount}] "${r.label}" = ${r.total} hits`);
        console.log(`       Volumes: ${volStr.join(', ')}`);
        console.log(`       Hot chs: ${hotChs}`);
        console.log('');
    }
}

console.log(`TOTAL concentrated patterns (>=10 hits): ${concentratedCount}`);

// Bonus: find patterns near V5 chapters 635-647 which seem to be hotspots
console.log('\n' + '='.repeat(80));
console.log('VOLUME 5 HOTSPOT CHECK (ch635-647):');
console.log('-'.repeat(80));
const hotspotChs = [635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647];
for (const chNum of hotspotChs) {
    const text = contentMap.get(chNum);
    if (!text) continue;
    let hits = 0;
    let details = [];
    for (const [label, substr] of uniquePatterns) {
        const c = countAll(text, substr);
        if (c > 0) {
            hits += c;
            if (c >= 2) details.push(`${label}:${c}`);
        }
    }
    if (hits > 0) {
        console.log(`  ch${chNum}: ${hits} total hits | ${details.join(', ')}`);
    }
}
console.log('='.repeat(80));